#!/bin/bash

# Scheduled Backup Script with Health Checks
# This script runs automated backups and includes health monitoring

set -e

# Configuration
BACKUP_DIR="/backups"
LOG_FILE="/var/log/backup.log"
HEALTH_CHECK_URL="http://localhost:${PORT:-4000}/health"
MAX_RETRIES=3
RETRY_DELAY=30

# Load environment variables
if [ -f .env.production ]; then
    export $(cat .env.production | grep -v '^#' | xargs)
fi

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Health check function
check_service_health() {
    local service_name="$1"
    local check_command="$2"
    
    log "🔍 Checking $service_name health..."
    
    for i in $(seq 1 $MAX_RETRIES); do
        if eval "$check_command"; then
            log "✅ $service_name is healthy"
            return 0
        else
            log "⚠️ $service_name health check failed (attempt $i/$MAX_RETRIES)"
            if [ $i -lt $MAX_RETRIES ]; then
                sleep $RETRY_DELAY
            fi
        fi
    done
    
    log "❌ $service_name health check failed after $MAX_RETRIES attempts"
    return 1
}

# Backup with health checks
run_backup_with_health_checks() {
    log "🚀 Starting scheduled backup process"
    
    # Check PostgreSQL health
    if ! check_service_health "PostgreSQL" "pg_isready -h ${POSTGRES_HOST:-postgres_host} -U ${POSTGRES_USER} -d ${POSTGRES_DB}"; then
        log "❌ Skipping backup due to PostgreSQL health check failure"
        exit 1
    fi
    
    # Check Redis health
    if ! check_service_health "Redis" "redis-cli -h ${REDIS_HOST:-redis_host} -p ${REDIS_PORT:-6379} ping"; then
        log "❌ Skipping backup due to Redis health check failure"
        exit 1
    fi
    
    # Check application health (if available)
    if curl -f -s "$HEALTH_CHECK_URL" > /dev/null 2>&1; then
        log "✅ Application health check passed"
    else
        log "⚠️ Application health check failed, but continuing with backup"
    fi
    
    # Run the backup
    if /scripts/backup-database.sh; then
        log "✅ Backup completed successfully"
        
        # Send success notification (customize as needed)
        # curl -X POST -H 'Content-type: application/json' \
        #     --data '{"text":"✅ Database backup completed successfully"}' \
        #     "$SLACK_WEBHOOK_URL"
        
        return 0
    else
        log "❌ Backup failed"
        
        # Send failure notification (customize as needed)
        # curl -X POST -H 'Content-type: application/json' \
        #     --data '{"text":"❌ Database backup failed - immediate attention required"}' \
        #     "$SLACK_WEBHOOK_URL"
        
        exit 1
    fi
}

# Cleanup function
cleanup_on_exit() {
    log "🧹 Cleaning up temporary files..."
    rm -f /tmp/redis_restore.rdb
    log "✅ Cleanup completed"
}

# Set up signal handlers
trap cleanup_on_exit EXIT INT TERM

# Main execution
main() {
    log "🔄 Scheduled backup started"
    
    # Create backup directory if it doesn't exist
    mkdir -p "$BACKUP_DIR"
    
    # Check if backup is already running
    if pgrep -f "backup-database.sh" > /dev/null; then
        log "⚠️ Another backup process is already running, skipping this backup"
        exit 0
    fi
    
    # Run backup with health checks
    run_backup_with_health_checks
    
    log "🎉 Scheduled backup process completed"
}

# Run main function
main "$@"
