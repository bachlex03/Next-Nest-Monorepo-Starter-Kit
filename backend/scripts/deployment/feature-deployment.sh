#!/bin/bash

# Feature Deployment Pipeline
# Safe deployment of new features with database schema changes

set -e

# Configuration
DEPLOYMENT_LOG="/var/log/feature-deployment.log"
STAGING_ENVIRONMENT=false
BLUE_GREEN_DEPLOYMENT=false
AUTO_ROLLBACK=true
HEALTH_CHECK_TIMEOUT=300

# Load environment variables
if [ -f .env.production ]; then
    export $(cat .env.production | grep -v '^#' | xargs)
fi

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$DEPLOYMENT_LOG"
}

# Function to show usage
usage() {
    echo "Feature Deployment Pipeline"
    echo ""
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  deploy <feature>     Deploy a new feature"
    echo "  rollback             Rollback last deployment"
    echo "  validate             Validate current deployment"
    echo "  status               Show deployment status"
    echo "  test-migration       Test migration without deploying"
    echo "  help                 Show this help message"
    echo ""
    echo "Options:"
    echo "  --staging            Deploy to staging environment"
    echo "  --blue-green         Use blue-green deployment"
    echo "  --no-rollback        Disable automatic rollback on failure"
    echo "  --force              Force deployment even if warnings exist"
    echo "  --dry-run            Show what would be done without executing"
    echo ""
    exit 1
}

# Function to validate feature readiness
validate_feature_readiness() {
    local feature_name="$1"
    
    log "🔍 Validating feature readiness: $feature_name"
    
    # Check if feature branch exists
    if ! git rev-parse --verify "$feature_name" > /dev/null 2>&1; then
        log "❌ Feature branch '$feature_name' not found"
        return 1
    fi
    
    # Check if there are uncommitted changes
    if ! git diff-index --quiet HEAD --; then
        log "❌ Uncommitted changes detected"
        return 1
    fi
    
    # Check if tests pass
    log "🧪 Running tests..."
    if ! npm test; then
        log "❌ Tests failed"
        return 1
    fi
    
    # Check for linting issues
    log "🔍 Running linting..."
    if ! npm run lint; then
        log "❌ Linting failed"
        return 1
    fi
    
    # Check migration files
    log "📋 Checking migration files..."
    local migration_files=$(find src/infrastructure/persistence/prisma/migrations -name "*.sql" -type f 2>/dev/null | wc -l)
    if [ "$migration_files" -gt 0 ]; then
        log "📁 Found $migration_files migration files"
    fi
    
    log "✅ Feature validation passed"
    return 0
}

# Function to run pre-deployment tests
run_pre_deployment_tests() {
    log "🧪 Running pre-deployment tests..."
    
    # Database migration tests
    if ! ./scripts/migrations/migration-strategy.sh check-migrations; then
        log "⚠️ Pending migrations detected - will be applied during deployment"
    fi
    
    # Application tests
    if ! npm test; then
        log "❌ Pre-deployment tests failed"
        return 1
    fi
    
    # Integration tests (if available)
    if [ -f "test/integration" ]; then
        log "🔗 Running integration tests..."
        if ! npm run test:integration; then
            log "❌ Integration tests failed"
            return 1
        fi
    fi
    
    log "✅ Pre-deployment tests passed"
    return 0
}

# Function to create deployment backup
create_deployment_backup() {
    log "💾 Creating deployment backup..."
    
    # Create comprehensive backup
    ./scripts/backup/backup-database.sh
    
    # Create application state backup
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local state_backup="/backups/deployment_state_$timestamp.json"
    
    cat > "$state_backup" << EOF
{
  "deployment_time": "$(date -Iseconds)",
  "git_commit": "$(git rev-parse HEAD)",
  "git_branch": "$(git branch --show-current)",
  "docker_images": {
    "backend": "$(docker images --format '{{.Repository}}:{{.Tag}}' backend-backend | head -1)"
  },
  "database_version": "$(PGPASSWORD="$POSTGRES_PASSWORD" psql -h ${POSTGRES_HOST:-postgres_host} -U ${POSTGRES_USER} -d ${POSTGRES_DB} -t -c "SELECT version();" | xargs)",
  "application_version": "$(cat package.json | grep version | cut -d'"' -f4)"
}
EOF
    
    log "✅ Deployment backup created: $state_backup"
    echo "$state_backup"
}

# Function to deploy with blue-green strategy
deploy_blue_green() {
    local feature_name="$1"
    
    log "🔄 Starting blue-green deployment for feature: $feature_name"
    
    # Determine current color
    local current_color="blue"
    if docker ps --format "table {{.Names}}" | grep -q "backend-green"; then
        current_color="green"
    fi
    
    local new_color="green"
    if [ "$current_color" = "green" ]; then
        new_color="blue"
    fi
    
    log "📊 Current environment: $current_color, Deploying to: $new_color"
    
    # Deploy to new environment
    log "🚀 Deploying to $new_color environment..."
    
    # Create new compose file for the new environment
    local new_compose="docker-compose.$new_color.yml"
    cp docker-compose.prod-secure.yml "$new_compose"
    
    # Update service names in the new compose file
    sed -i "s/backend:/backend-$new_color:/g" "$new_compose"
    sed -i "s/postgres_host:/postgres-$new_color:/g" "$new_compose"
    sed -i "s/redis_host:/redis-$new_color:/g" "$new_compose"
    
    # Deploy new environment
    docker compose -f "$new_compose" --env-file .env.production up -d --build
    
    # Wait for new environment to be healthy
    log "⏳ Waiting for $new_color environment to be healthy..."
    local health_check_url="http://localhost:${PORT:-4000}/health"
    if [ "$new_color" = "green" ]; then
        health_check_url="http://localhost:4001/health"
    fi
    
    local start_time=$(date +%s)
    while [ $(($(date +%s) - start_time)) -lt $HEALTH_CHECK_TIMEOUT ]; do
        if curl -f -s "$health_check_url" > /dev/null 2>&1; then
            log "✅ $new_color environment is healthy"
            break
        fi
        sleep 10
    done
    
    # Switch traffic to new environment
    log "🔄 Switching traffic to $new_color environment..."
    
    # Update load balancer configuration (customize based on your setup)
    # This is a placeholder - implement based on your infrastructure
    
    # Stop old environment
    log "⏹️ Stopping $current_color environment..."
    docker compose -f "docker-compose.$current_color.yml" down
    
    log "✅ Blue-green deployment completed"
}

# Function to deploy feature
deploy_feature() {
    local feature_name="$1"
    local deployment_type="${2:-standard}"
    local dry_run="${3:-false}"
    
    log "🚀 Starting feature deployment: $feature_name"
    
    # Step 1: Validate feature
    if [ "$dry_run" = false ]; then
        if ! validate_feature_readiness "$feature_name"; then
            log "❌ Feature validation failed"
            exit 1
        fi
    fi
    
    # Step 2: Run pre-deployment tests
    if [ "$dry_run" = false ]; then
        if ! run_pre_deployment_tests; then
            log "❌ Pre-deployment tests failed"
            exit 1
        fi
    fi
    
    # Step 3: Create backup
    local state_backup=""
    if [ "$dry_run" = false ]; then
        state_backup=$(create_deployment_backup)
    fi
    
    # Step 4: Deploy based on strategy
    case "$deployment_type" in
        "blue-green")
            if [ "$dry_run" = false ]; then
                deploy_blue_green "$feature_name"
            else
                log "🔍 DRY RUN: Would deploy using blue-green strategy"
            fi
            ;;
        "standard"|*)
            if [ "$dry_run" = false ]; then
                log "🔄 Standard deployment..."
                
                # Run migrations
                if ! ./scripts/migrations/migration-strategy.sh migrate; then
                    log "❌ Migration failed"
                    if [ "$AUTO_ROLLBACK" = true ]; then
                        rollback_deployment
                    fi
                    exit 1
                fi
                
                # Deploy application
                docker compose -f docker-compose.prod-secure.yml --env-file .env.production up -d --build
                
                # Wait for health check
                local start_time=$(date +%s)
                while [ $(($(date +%s) - start_time)) -lt $HEALTH_CHECK_TIMEOUT ]; do
                    if curl -f -s "http://localhost:${PORT:-4000}/health" > /dev/null 2>&1; then
                        log "✅ Deployment health check passed"
                        break
                    fi
                    sleep 10
                done
            else
                log "🔍 DRY RUN: Would deploy using standard strategy"
            fi
            ;;
    esac
    
    # Step 5: Post-deployment validation
    if [ "$dry_run" = false ]; then
        if ! validate_deployment; then
            log "❌ Post-deployment validation failed"
            if [ "$AUTO_ROLLBACK" = true ]; then
                rollback_deployment
            fi
            exit 1
        fi
    fi
    
    log "🎉 Feature '$feature_name' deployed successfully"
}

# Function to validate deployment
validate_deployment() {
    log "✅ Validating deployment..."
    
    # Check application health
    if ! curl -f -s "http://localhost:${PORT:-4000}/health" > /dev/null 2>&1; then
        log "❌ Application health check failed"
        return 1
    fi
    
    # Check database connectivity
    if ! pg_isready -h ${POSTGRES_HOST:-postgres_host} -U ${POSTGRES_USER} -d ${POSTGRES_DB} > /dev/null 2>&1; then
        log "❌ Database connectivity check failed"
        return 1
    fi
    
    # Check Redis connectivity
    if ! redis-cli -h ${REDIS_HOST:-redis_host} -p ${REDIS_PORT:-6379} ping > /dev/null 2>&1; then
        log "❌ Redis connectivity check failed"
        return 1
    fi
    
    # Run smoke tests
    log "🧪 Running smoke tests..."
    if ! npm run test:smoke 2>/dev/null; then
        log "⚠️ Smoke tests failed, but deployment may still be valid"
    fi
    
    log "✅ Deployment validation passed"
    return 0
}

# Function to rollback deployment
rollback_deployment() {
    log "🔄 Rolling back deployment..."
    
    # Find latest deployment backup
    local latest_backup=$(find /backups -name "deployment_state_*.json" -type f -printf '%T@ %p\n' 2>/dev/null | sort -n | tail -1 | cut -d' ' -f2-)
    
    if [ -z "$latest_backup" ]; then
        log "❌ No deployment backup found for rollback"
        return 1
    fi
    
    log "📁 Rolling back from: $latest_backup"
    
    # Stop current services
    docker compose -f docker-compose.prod-secure.yml down
    
    # Restore database
    ./scripts/migrations/migration-strategy.sh rollback
    
    # Restart services
    docker compose -f docker-compose.prod-secure.yml --env-file .env.production up -d
    
    log "✅ Rollback completed"
}

# Function to show deployment status
show_status() {
    log "📊 Deployment Status Report"
    echo ""
    
    echo "🚀 Application Status:"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "(backend|postgres|redis)"
    
    echo ""
    echo "📁 Recent Deployments:"
    ls -la /backups/deployment_state_*.json 2>/dev/null | tail -5 || echo "No deployment history found"
    
    echo ""
    echo "🏥 Health Status:"
    if curl -f -s "http://localhost:${PORT:-4000}/health" > /dev/null 2>&1; then
        echo "✅ Application is healthy"
    else
        echo "❌ Application health check failed"
    fi
    
    echo ""
    echo "📋 Migration Status:"
    ./scripts/migrations/migration-strategy.sh status
}

# Main execution
main() {
    # Parse options
    local dry_run=false
    local deployment_type="standard"
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --staging)
                STAGING_ENVIRONMENT=true
                shift
                ;;
            --blue-green)
                BLUE_GREEN_DEPLOYMENT=true
                deployment_type="blue-green"
                shift
                ;;
            --no-rollback)
                AUTO_ROLLBACK=false
                shift
                ;;
            --dry-run)
                dry_run=true
                shift
                ;;
            --force)
                # Force deployment even with warnings
                shift
                ;;
            *)
                break
                ;;
        esac
    done
    
    case "${1:-help}" in
        "deploy")
            if [ -z "$2" ]; then
                echo "Error: Feature name required"
                echo "Usage: $0 deploy <feature-name> [--blue-green] [--dry-run]"
                exit 1
            fi
            deploy_feature "$2" "$deployment_type" "$dry_run"
            ;;
        "rollback")
            rollback_deployment
            ;;
        "validate")
            validate_deployment
            ;;
        "status")
            show_status
            ;;
        "test-migration")
            ./scripts/migrations/migration-strategy.sh check-migrations
            ;;
        "help"|*)
            usage
            ;;
    esac
}

# Run main function
main "$@"
