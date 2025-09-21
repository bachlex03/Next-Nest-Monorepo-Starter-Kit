#!/bin/bash

# Database Migration Strategy Script
# Handles safe database schema updates and feature deployments

set -e

# Configuration
MIGRATION_LOG="/var/log/migration.log"
BACKUP_BEFORE_MIGRATION=true
VALIDATE_MIGRATION=true
ROLLBACK_ON_FAILURE=true

# Load environment variables
if [ -f .env.production ]; then
    export $(cat .env.production | grep -v '^#' | xargs)
fi

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$MIGRATION_LOG"
}

# Function to show usage
usage() {
    echo "Database Migration Strategy"
    echo ""
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  check-migrations    Check for pending migrations"
    echo "  backup              Create pre-migration backup"
    echo "  migrate             Run database migrations"
    echo "  validate            Validate migration results"
    echo "  rollback            Rollback last migration"
    echo "  deploy-feature      Deploy new feature with migrations"
    echo "  status              Show migration status"
    echo "  help                Show this help message"
    echo ""
    echo "Options:"
    echo "  --dry-run           Show what would be done without executing"
    echo "  --force             Force migration even if warnings exist"
    echo "  --backup-only       Only create backup, don't migrate"
    echo ""
    exit 1
}

# Function to check for pending migrations
check_migrations() {
    log "🔍 Checking for pending migrations..."
    
    # Check if there are pending migrations
    local pending_migrations=$(docker run --rm --network backend_app-network \
        --env-file .env.production \
        -w /app \
        -e DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST:-postgres_host}:${POSTGRES_PORT:-5432}/${POSTGRES_DB}?schema=public" \
        backend-backend \
        npx prisma migrate status --schema ./prisma/schema.prisma 2>/dev/null | grep -c "Following migration have not yet been applied" || true)
    
    if [ "$pending_migrations" -gt 0 ]; then
        log "⚠️ Found $pending_migrations pending migrations"
        
        # List pending migrations
        docker run --rm --network backend_app-network \
            --env-file .env.production \
            -w /app \
            -e DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST:-postgres_host}:${POSTGRES_PORT:-5432}/${POSTGRES_DB}?schema=public" \
            backend-backend \
            npx prisma migrate status --schema ./prisma/schema.prisma
        
        return 1
    else
        log "✅ No pending migrations found"
        return 0
    fi
}

# Function to create pre-migration backup
create_migration_backup() {
    if [ "$BACKUP_BEFORE_MIGRATION" = true ]; then
        log "💾 Creating pre-migration backup..."
        
        local timestamp=$(date +%Y%m%d_%H%M%S)
        local backup_file="/backups/pre_migration_backup_$timestamp.sql.gz"
        
        # Create database backup
        PGPASSWORD="$POSTGRES_PASSWORD" pg_dump \
            -h ${POSTGRES_HOST:-postgres_host} \
            -U ${POSTGRES_USER} \
            -d ${POSTGRES_DB} \
            --verbose --clean --no-owner --no-privileges | gzip > "$backup_file"
        
        log "✅ Pre-migration backup created: $backup_file"
        echo "$backup_file"
    fi
}

# Function to run database migrations
run_migrations() {
    local dry_run=${1:-false}
    
    log "🔄 Running database migrations..."
    
    if [ "$dry_run" = true ]; then
        log "🔍 DRY RUN: Would execute migrations"
        docker run --rm --network backend_app-network \
            --env-file .env.production \
            -w /app \
            -e DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST:-postgres_host}:${POSTGRES_PORT:-5432}/${POSTGRES_DB}?schema=public" \
            backend-backend \
            npx prisma migrate status --schema ./prisma/schema.prisma
        return 0
    fi
    
    # Run migrations
    if docker run --rm --network backend_app-network \
        --env-file .env.production \
        -w /app \
        -e DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST:-postgres_host}:${POSTGRES_PORT:-5432}/${POSTGRES_DB}?schema=public" \
        backend-backend \
        npx prisma migrate deploy --schema ./prisma/schema.prisma; then
        
        log "✅ Migrations completed successfully"
        return 0
    else
        log "❌ Migration failed"
        return 1
    fi
}

# Function to validate migration results
validate_migration() {
    if [ "$VALIDATE_MIGRATION" = true ]; then
        log "✅ Validating migration results..."
        
        # Check if database is accessible
        if ! pg_isready -h ${POSTGRES_HOST:-postgres_host} -U ${POSTGRES_USER} -d ${POSTGRES_DB} > /dev/null 2>&1; then
            log "❌ Database not accessible after migration"
            return 1
        fi
        
        # Test basic queries
        if ! PGPASSWORD="$POSTGRES_PASSWORD" psql \
            -h ${POSTGRES_HOST:-postgres_host} \
            -U ${POSTGRES_USER} \
            -d ${POSTGRES_DB} \
            -c "SELECT 1;" > /dev/null 2>&1; then
            log "❌ Basic database queries failed after migration"
            return 1
        fi
        
        # Check if application can connect
        if ! curl -f -s "http://localhost:${PORT:-4000}/health" > /dev/null 2>&1; then
            log "❌ Application health check failed after migration"
            return 1
        fi
        
        log "✅ Migration validation passed"
        return 0
    else
        log "⚠️ Migration validation skipped"
        return 0
    fi
}

# Function to rollback migration
rollback_migration() {
    if [ "$ROLLBACK_ON_FAILURE" = true ]; then
        log "🔄 Rolling back migration..."
        
        # Find the latest backup
        local latest_backup=$(find /backups -name "pre_migration_backup_*.sql.gz" -type f -printf '%T@ %p\n' 2>/dev/null | sort -n | tail -1 | cut -d' ' -f2-)
        
        if [ -z "$latest_backup" ]; then
            log "❌ No backup found for rollback"
            return 1
        fi
        
        log "📁 Restoring from backup: $latest_backup"
        
        # Stop application
        docker stop backend-backend-1 2>/dev/null || true
        
        # Restore database
        gunzip -c "$latest_backup" | PGPASSWORD="$POSTGRES_PASSWORD" psql \
            -h ${POSTGRES_HOST:-postgres_host} \
            -U ${POSTGRES_USER} \
            -d ${POSTGRES_DB} \
            -v ON_ERROR_STOP=1
        
        # Restart application
        docker compose -f docker-compose.prod-secure.yml --env-file .env.production up -d backend
        
        log "✅ Migration rollback completed"
        return 0
    else
        log "⚠️ Rollback disabled"
        return 0
    fi
}

# Function to deploy feature with migrations
deploy_feature() {
    local feature_name="$1"
    local dry_run=${2:-false}
    
    log "🚀 Deploying feature: $feature_name"
    
    # Step 1: Check for pending migrations
    if ! check_migrations; then
        log "📋 Proceeding with pending migrations..."
    else
        log "✅ No migrations needed"
    fi
    
    # Step 2: Create backup
    local backup_file=""
    if [ "$dry_run" = false ]; then
        backup_file=$(create_migration_backup)
    fi
    
    # Step 3: Run migrations
    if ! run_migrations "$dry_run"; then
        log "❌ Feature deployment failed during migration"
        if [ "$dry_run" = false ] && [ -n "$backup_file" ]; then
            rollback_migration
        fi
        exit 1
    fi
    
    # Step 4: Validate
    if ! validate_migration; then
        log "❌ Feature deployment failed during validation"
        if [ "$dry_run" = false ] && [ -n "$backup_file" ]; then
            rollback_migration
        fi
        exit 1
    fi
    
    # Step 5: Restart application with new code
    if [ "$dry_run" = false ]; then
        log "🔄 Restarting application with new feature..."
        docker compose -f docker-compose.prod-secure.yml --env-file .env.production up -d --build backend
    fi
    
    log "🎉 Feature '$feature_name' deployed successfully"
}

# Function to show migration status
show_status() {
    log "📊 Migration Status Report"
    echo ""
    
    # Check migration status
    echo "🔍 Database Migration Status:"
    docker run --rm --network backend_app-network \
        --env-file .env.production \
        -w /app \
        -e DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST:-postgres_host}:${POSTGRES_PORT:-5432}/${POSTGRES_DB}?schema=public" \
        backend-backend \
        npx prisma migrate status --schema ./prisma/schema.prisma
    
    echo ""
    echo "📁 Available Backups:"
    ls -la /backups/pre_migration_backup_*.sql.gz 2>/dev/null || echo "No migration backups found"
    
    echo ""
    echo "🏥 Application Health:"
    if curl -f -s "http://localhost:${PORT:-4000}/health" > /dev/null 2>&1; then
        echo "✅ Application is healthy"
    else
        echo "❌ Application health check failed"
    fi
}

# Main execution
main() {
    case "${1:-help}" in
        "check-migrations")
            check_migrations
            ;;
        "backup")
            create_migration_backup
            ;;
        "migrate")
            run_migrations false
            ;;
        "validate")
            validate_migration
            ;;
        "rollback")
            rollback_migration
            ;;
        "deploy-feature")
            if [ -z "$2" ]; then
                echo "Error: Feature name required"
                echo "Usage: $0 deploy-feature <feature-name> [--dry-run]"
                exit 1
            fi
            local dry_run=false
            if [ "$3" = "--dry-run" ]; then
                dry_run=true
            fi
            deploy_feature "$2" "$dry_run"
            ;;
        "status")
            show_status
            ;;
        "help"|*)
            usage
            ;;
    esac
}

# Run main function
main "$@"
