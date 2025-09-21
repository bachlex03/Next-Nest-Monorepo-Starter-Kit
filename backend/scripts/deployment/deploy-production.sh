#!/bin/bash

# Production Deployment Script
# Automated deployment with safety checks and rollback capabilities

set -e

# Configuration
LOG_FILE="/var/log/deployment.log"
BACKUP_BEFORE_DEPLOY=true
HEALTH_CHECK_TIMEOUT=300
ROLLBACK_ON_FAILURE=true

# Load environment variables
if [ -f .env.production ]; then
    export $(cat .env.production | grep -v '^#' | xargs)
fi

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Function to create deployment backup
create_deployment_backup() {
    if [ "$BACKUP_BEFORE_DEPLOY" = true ]; then
        log "💾 Creating deployment backup..."
        /scripts/backup/backup-database.sh
        log "✅ Deployment backup completed"
    fi
}

# Function to check pre-deployment health
check_pre_deployment_health() {
    log "🔍 Checking pre-deployment health..."
    
    # Check if current system is healthy
    if ! /scripts/monitoring/health-check.sh > /dev/null 2>&1; then
        log "❌ Pre-deployment health check failed - aborting deployment"
        exit 1
    fi
    
    log "✅ Pre-deployment health check passed"
}

# Function to perform deployment
perform_deployment() {
    log "🚀 Starting deployment..."
    
    # Pull latest images
    log "📥 Pulling latest images..."
    docker compose -f docker-compose.prod.yml pull
    
    # Build new images
    log "🔨 Building new images..."
    docker compose -f docker-compose.prod.yml build --no-cache
    
    # Stop current services gracefully
    log "⏹️ Stopping current services..."
    docker compose -f docker-compose.prod.yml down --timeout 30
    
    # Start new services
    log "▶️ Starting new services..."
    docker compose -f docker-compose.prod.yml --env-file .env.production up -d
    
    log "✅ Deployment completed"
}

# Function to wait for health check
wait_for_health_check() {
    log "⏳ Waiting for health check..."
    
    local start_time=$(date +%s)
    local timeout=$HEALTH_CHECK_TIMEOUT
    
    while [ $(($(date +%s) - start_time)) -lt $timeout ]; do
        if /scripts/monitoring/health-check.sh > /dev/null 2>&1; then
            log "✅ Health check passed"
            return 0
        fi
        
        log "⏳ Health check in progress... ($(($(date +%s) - start_time))s elapsed)"
        sleep 10
    done
    
    log "❌ Health check timeout after ${timeout}s"
    return 1
}

# Function to rollback deployment
rollback_deployment() {
    if [ "$ROLLBACK_ON_FAILURE" = true ]; then
        log "🔄 Rolling back deployment..."
        
        # Stop current services
        docker compose -f docker-compose.prod.yml down
        
        # Restore from backup
        /scripts/disaster-recovery/disaster-recovery.sh restore
        
        # Restart services
        docker compose -f docker-compose.prod.yml --env-file .env.production up -d
        
        log "✅ Rollback completed"
    fi
}

# Function to run post-deployment tasks
run_post_deployment_tasks() {
    log "🧹 Running post-deployment tasks..."
    
    # Clean up old images
    log "🗑️ Cleaning up old Docker images..."
    docker image prune -f
    
    # Clean up old containers
    log "🗑️ Cleaning up old containers..."
    docker container prune -f
    
    # Update monitoring
    log "📊 Updating monitoring..."
    # Add any monitoring updates here
    
    log "✅ Post-deployment tasks completed"
}

# Main deployment function
main() {
    log "🚀 Starting production deployment process"
    
    # Pre-deployment checks
    check_pre_deployment_health
    create_deployment_backup
    
    # Perform deployment
    if perform_deployment; then
        # Wait for health check
        if wait_for_health_check; then
            # Run post-deployment tasks
            run_post_deployment_tasks
            log "🎉 Deployment completed successfully"
            exit 0
        else
            log "❌ Health check failed after deployment"
            rollback_deployment
            exit 1
        fi
    else
        log "❌ Deployment failed"
        rollback_deployment
        exit 1
    fi
}

# Run main function
main "$@"
