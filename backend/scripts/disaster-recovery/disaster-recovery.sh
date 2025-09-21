#!/bin/bash

# Disaster Recovery Script
# Comprehensive disaster recovery procedures for production backend

set -e

# Configuration
BACKUP_DIR="/backups"
LOG_FILE="/var/log/disaster-recovery.log"
RECOVERY_DIR="/tmp/disaster-recovery"
MAX_RETRIES=3

# Load environment variables
if [ -f .env.production ]; then
    export $(cat .env.production | grep -v '^#' | xargs)
fi

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Function to show usage
usage() {
    echo "Disaster Recovery Script"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  assess           Assess system status and identify issues"
    echo "  backup           Create emergency backup before recovery"
    echo "  restore          Restore from latest backup"
    echo "  restart          Restart all services"
    echo "  full-recovery    Perform full disaster recovery procedure"
    echo "  validate         Validate system after recovery"
    echo "  help             Show this help message"
    echo ""
    exit 1
}

# Function to assess system status
assess_system() {
    log "🔍 Assessing system status..."
    
    local issues_found=false
    
    # Check if containers are running
    if ! docker ps | grep -q "backend-backend"; then
        log "❌ Backend container is not running"
        issues_found=true
    fi
    
    if ! docker ps | grep -q "postgres_host"; then
        log "❌ PostgreSQL container is not running"
        issues_found=true
    fi
    
    if ! docker ps | grep -q "redis_host"; then
        log "❌ Redis container is not running"
        issues_found=true
    fi
    
    # Check database connectivity
    if ! pg_isready -h ${POSTGRES_HOST:-postgres_host} -U ${POSTGRES_USER} -d ${POSTGRES_DB} > /dev/null 2>&1; then
        log "❌ PostgreSQL is not accepting connections"
        issues_found=true
    fi
    
    # Check Redis connectivity
    if ! redis-cli -h ${REDIS_HOST:-redis_host} -p ${REDIS_PORT:-6379} ping > /dev/null 2>&1; then
        log "❌ Redis is not responding"
        issues_found=true
    fi
    
    # Check application health
    if ! curl -f -s "http://localhost:${PORT:-4000}/health" > /dev/null 2>&1; then
        log "❌ Application health check failed"
        issues_found=true
    fi
    
    # Check disk space
    local disk_usage=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ "$disk_usage" -gt 90 ]; then
        log "❌ Critical: Disk usage is ${disk_usage}%"
        issues_found=true
    elif [ "$disk_usage" -gt 80 ]; then
        log "⚠️ Warning: Disk usage is ${disk_usage}%"
    fi
    
    # Check backup availability
    local latest_backup=$(find "$BACKUP_DIR" -name "postgres_backup_*.sql.gz" -type f -printf '%T@ %p\n' 2>/dev/null | sort -n | tail -1 | cut -d' ' -f2-)
    if [ -z "$latest_backup" ]; then
        log "❌ No backup files found"
        issues_found=true
    else
        local backup_age=$(($(date +%s) - $(stat -c %Y "$latest_backup")))
        local backup_age_hours=$((backup_age / 3600))
        log "📁 Latest backup: $latest_backup (${backup_age_hours}h ago)"
    fi
    
    if [ "$issues_found" = true ]; then
        log "❌ System assessment: Issues detected - recovery recommended"
        return 1
    else
        log "✅ System assessment: All systems operational"
        return 0
    fi
}

# Function to create emergency backup
create_emergency_backup() {
    log "💾 Creating emergency backup..."
    
    # Create recovery directory
    mkdir -p "$RECOVERY_DIR"
    
    # Backup current state
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local emergency_backup="$RECOVERY_DIR/emergency_backup_$timestamp"
    
    # Backup database
    if pg_isready -h ${POSTGRES_HOST:-postgres_host} -U ${POSTGRES_USER} -d ${POSTGRES_DB} > /dev/null 2>&1; then
        log "📊 Backing up database..."
        PGPASSWORD="$POSTGRES_PASSWORD" pg_dump -h ${POSTGRES_HOST:-postgres_host} -U ${POSTGRES_USER} -d ${POSTGRES_DB} --verbose --clean --no-owner --no-privileges > "${emergency_backup}_database.sql"
        gzip "${emergency_backup}_database.sql"
        log "✅ Database backup created"
    else
        log "⚠️ Database not accessible, skipping database backup"
    fi
    
    # Backup Redis
    if redis-cli -h ${REDIS_HOST:-redis_host} -p ${REDIS_PORT:-6379} ping > /dev/null 2>&1; then
        log "🔴 Backing up Redis..."
        redis-cli -h ${REDIS_HOST:-redis_host} -p ${REDIS_PORT:-6379} --rdb "${emergency_backup}_redis.rdb"
        gzip "${emergency_backup}_redis.rdb"
        log "✅ Redis backup created"
    else
        log "⚠️ Redis not accessible, skipping Redis backup"
    fi
    
    # Backup configuration files
    log "📋 Backing up configuration files..."
    cp .env.production "${emergency_backup}_env.production" 2>/dev/null || true
    cp docker-compose.prod.yml "${emergency_backup}_docker-compose.yml" 2>/dev/null || true
    
    log "✅ Emergency backup completed: $emergency_backup"
}

# Function to restart services
restart_services() {
    log "🔄 Restarting services..."
    
    # Stop all services
    log "⏹️ Stopping services..."
    docker compose -f docker-compose.prod.yml down || true
    
    # Wait for services to stop
    sleep 10
    
    # Start services
    log "▶️ Starting services..."
    docker compose -f docker-compose.prod.yml --env-file .env.production up -d
    
    # Wait for services to be ready
    log "⏳ Waiting for services to be ready..."
    sleep 30
    
    # Check if services are healthy
    local retries=0
    while [ $retries -lt $MAX_RETRIES ]; do
        if assess_system; then
            log "✅ Services restarted successfully"
            return 0
        else
            log "⚠️ Services not ready yet, retrying in 30 seconds..."
            sleep 30
            retries=$((retries + 1))
        fi
    done
    
    log "❌ Services failed to start properly"
    return 1
}

# Function to restore from backup
restore_from_backup() {
    log "🔄 Restoring from backup..."
    
    # Find latest backup
    local latest_backup=$(find "$BACKUP_DIR" -name "postgres_backup_*.sql.gz" -type f -printf '%T@ %p\n' 2>/dev/null | sort -n | tail -1 | cut -d' ' -f2-)
    
    if [ -z "$latest_backup" ]; then
        log "❌ No backup files found for restore"
        return 1
    fi
    
    log "📁 Restoring from: $latest_backup"
    
    # Stop application to prevent data corruption
    log "⏹️ Stopping application..."
    docker stop backend-backend-1 2>/dev/null || true
    
    # Restore database
    log "📊 Restoring database..."
    gunzip -c "$latest_backup" | PGPASSWORD="$POSTGRES_PASSWORD" psql -h ${POSTGRES_HOST:-postgres_host} -U ${POSTGRES_USER} -d ${POSTGRES_DB} -v ON_ERROR_STOP=1
    
    # Restart application
    log "▶️ Starting application..."
    docker compose -f docker-compose.prod.yml --env-file .env.production up -d backend
    
    log "✅ Restore completed"
}

# Function to validate system
validate_system() {
    log "✅ Validating system after recovery..."
    
    # Run comprehensive health check
    if assess_system; then
        log "✅ System validation passed"
        
        # Test critical functionality
        log "🧪 Testing critical functionality..."
        
        # Test database queries
        if PGPASSWORD="$POSTGRES_PASSWORD" psql -h ${POSTGRES_HOST:-postgres_host} -U ${POSTGRES_USER} -d ${POSTGRES_DB} -c "SELECT COUNT(*) FROM users;" > /dev/null 2>&1; then
            log "✅ Database queries working"
        else
            log "❌ Database queries failed"
            return 1
        fi
        
        # Test Redis operations
        if redis-cli -h ${REDIS_HOST:-redis_host} -p ${REDIS_PORT:-6379} set test_key "test_value" && redis-cli -h ${REDIS_HOST:-redis_host} -p ${REDIS_PORT:-6379} get test_key | grep -q "test_value"; then
            log "✅ Redis operations working"
            redis-cli -h ${REDIS_HOST:-redis_host} -p ${REDIS_PORT:-6379} del test_key > /dev/null
        else
            log "❌ Redis operations failed"
            return 1
        fi
        
        # Test API endpoints
        if curl -f -s "http://localhost:${PORT:-4000}/api/v1" > /dev/null 2>&1; then
            log "✅ API endpoints working"
        else
            log "❌ API endpoints failed"
            return 1
        fi
        
        log "🎉 System validation completed successfully"
        return 0
    else
        log "❌ System validation failed"
        return 1
    fi
}

# Function to perform full recovery
full_recovery() {
    log "🚨 Starting full disaster recovery procedure..."
    
    # Step 1: Assess system
    log "Step 1: System assessment"
    assess_system || true
    
    # Step 2: Create emergency backup
    log "Step 2: Emergency backup"
    create_emergency_backup
    
    # Step 3: Restart services
    log "Step 3: Service restart"
    if ! restart_services; then
        log "❌ Service restart failed, attempting restore..."
        restore_from_backup
    fi
    
    # Step 4: Validate system
    log "Step 4: System validation"
    if validate_system; then
        log "🎉 Full disaster recovery completed successfully"
        return 0
    else
        log "❌ Disaster recovery failed - manual intervention required"
        return 1
    fi
}

# Main execution
main() {
    case "${1:-help}" in
        "assess")
            assess_system
            ;;
        "backup")
            create_emergency_backup
            ;;
        "restore")
            restore_from_backup
            ;;
        "restart")
            restart_services
            ;;
        "full-recovery")
            full_recovery
            ;;
        "validate")
            validate_system
            ;;
        "help"|*)
            usage
            ;;
    esac
}

# Run main function
main "$@"
