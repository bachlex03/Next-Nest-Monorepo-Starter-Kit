#!/bin/bash

# Comprehensive Health Check Script
# Monitors all services and triggers alerts if issues are detected

set -e

# Configuration
LOG_FILE="/var/log/health-check.log"
ALERT_THRESHOLD=3
CHECK_INTERVAL=30
MAX_RETRIES=3

# Load environment variables
if [ -f .env.production ]; then
    export $(cat .env.production | grep -v '^#' | xargs)
fi

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Function to check PostgreSQL
check_postgres() {
    local status="healthy"
    local details=""
    
    # Check if PostgreSQL is accepting connections
    if ! pg_isready -h ${POSTGRES_HOST:-postgres_host} -U ${POSTGRES_USER} -d ${POSTGRES_DB} > /dev/null 2>&1; then
        status="unhealthy"
        details="PostgreSQL connection failed"
    else
        # Check database size
        local db_size=$(PGPASSWORD="$POSTGRES_PASSWORD" psql -h ${POSTGRES_HOST:-postgres_host} -U ${POSTGRES_USER} -d ${POSTGRES_DB} -t -c "SELECT pg_size_pretty(pg_database_size('${POSTGRES_DB}'));" 2>/dev/null | xargs)
        details="Database size: $db_size"
        
        # Check for long-running queries
        local long_queries=$(PGPASSWORD="$POSTGRES_PASSWORD" psql -h ${POSTGRES_HOST:-postgres_host} -U ${POSTGRES_USER} -d ${POSTGRES_DB} -t -c "SELECT COUNT(*) FROM pg_stat_activity WHERE state = 'active' AND query_start < NOW() - INTERVAL '5 minutes';" 2>/dev/null | xargs)
        if [ "$long_queries" -gt 0 ]; then
            details="$details, Long queries: $long_queries"
        fi
    fi
    
    echo "$status|$details"
}

# Function to check Redis
check_redis() {
    local status="healthy"
    local details=""
    
    # Check if Redis is responding
    if ! redis-cli -h ${REDIS_HOST:-redis_host} -p ${REDIS_PORT:-6379} ping > /dev/null 2>&1; then
        status="unhealthy"
        details="Redis connection failed"
    else
        # Get Redis info
        local memory_usage=$(redis-cli -h ${REDIS_HOST:-redis_host} -p ${REDIS_PORT:-6379} info memory | grep used_memory_human | cut -d: -f2 | tr -d '\r')
        local connected_clients=$(redis-cli -h ${REDIS_HOST:-redis_host} -p ${REDIS_PORT:-6379} info clients | grep connected_clients | cut -d: -f2 | tr -d '\r')
        details="Memory: $memory_usage, Clients: $connected_clients"
    fi
    
    echo "$status|$details"
}

# Function to check application
check_application() {
    local status="healthy"
    local details=""
    
    # Check if application is responding
    if ! curl -f -s "http://localhost:${PORT:-4000}/health" > /dev/null 2>&1; then
        status="unhealthy"
        details="Application health endpoint failed"
    else
        # Get response time
        local response_time=$(curl -o /dev/null -s -w '%{time_total}' "http://localhost:${PORT:-4000}/health")
        details="Response time: ${response_time}s"
        
        # Check memory usage of the application
        local app_pid=$(pgrep -f "node dist/src/main.js")
        if [ -n "$app_pid" ]; then
            local memory_usage=$(ps -p $app_pid -o %mem= | xargs)
            details="$details, Memory usage: ${memory_usage}%"
        fi
    fi
    
    echo "$status|$details"
}

# Function to check disk space
check_disk_space() {
    local status="healthy"
    local details=""
    
    local disk_usage=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ "$disk_usage" -gt 80 ]; then
        status="warning"
        details="Disk usage: ${disk_usage}%"
    elif [ "$disk_usage" -gt 90 ]; then
        status="critical"
        details="Disk usage: ${disk_usage}%"
    else
        details="Disk usage: ${disk_usage}%"
    fi
    
    echo "$status|$details"
}

# Function to check backup status
check_backup_status() {
    local status="healthy"
    local details=""
    
    local backup_dir="/backups"
    if [ -d "$backup_dir" ]; then
        local latest_backup=$(find "$backup_dir" -name "postgres_backup_*.sql.gz" -type f -printf '%T@ %p\n' | sort -n | tail -1 | cut -d' ' -f2-)
        if [ -n "$latest_backup" ]; then
            local backup_age=$(($(date +%s) - $(stat -c %Y "$latest_backup")))
            local backup_age_hours=$((backup_age / 3600))
            
            if [ "$backup_age_hours" -gt 25 ]; then
                status="warning"
                details="Last backup: ${backup_age_hours}h ago"
            else
                details="Last backup: ${backup_age_hours}h ago"
            fi
        else
            status="critical"
            details="No backups found"
        fi
    else
        status="critical"
        details="Backup directory not found"
    fi
    
    echo "$status|$details"
}

# Function to send alert
send_alert() {
    local service="$1"
    local status="$2"
    local details="$3"
    
    log "🚨 ALERT: $service is $status - $details"
    
    # Send notification (customize as needed)
    # curl -X POST -H 'Content-type: application/json' \
    #     --data "{\"text\":\"🚨 $service is $status - $details\"}" \
    #     "$SLACK_WEBHOOK_URL"
    
    # Log to system log
    logger -t "health-check" "$service is $status - $details"
}

# Main health check function
run_health_check() {
    log "🔍 Starting comprehensive health check"
    
    local overall_status="healthy"
    
    # Check PostgreSQL
    local postgres_result=$(check_postgres)
    local postgres_status=$(echo "$postgres_result" | cut -d'|' -f1)
    local postgres_details=$(echo "$postgres_result" | cut -d'|' -f2)
    
    if [ "$postgres_status" != "healthy" ]; then
        send_alert "PostgreSQL" "$postgres_status" "$postgres_details"
        overall_status="unhealthy"
    fi
    log "📊 PostgreSQL: $postgres_status - $postgres_details"
    
    # Check Redis
    local redis_result=$(check_redis)
    local redis_status=$(echo "$redis_result" | cut -d'|' -f1)
    local redis_details=$(echo "$redis_result" | cut -d'|' -f2)
    
    if [ "$redis_status" != "healthy" ]; then
        send_alert "Redis" "$redis_status" "$redis_details"
        overall_status="unhealthy"
    fi
    log "🔴 Redis: $redis_status - $redis_details"
    
    # Check Application
    local app_result=$(check_application)
    local app_status=$(echo "$app_result" | cut -d'|' -f1)
    local app_details=$(echo "$app_result" | cut -d'|' -f2)
    
    if [ "$app_status" != "healthy" ]; then
        send_alert "Application" "$app_status" "$app_details"
        overall_status="unhealthy"
    fi
    log "🚀 Application: $app_status - $app_details"
    
    # Check Disk Space
    local disk_result=$(check_disk_space)
    local disk_status=$(echo "$disk_result" | cut -d'|' -f1)
    local disk_details=$(echo "$disk_result" | cut -d'|' -f2)
    
    if [ "$disk_status" != "healthy" ]; then
        send_alert "Disk Space" "$disk_status" "$disk_details"
        if [ "$disk_status" = "critical" ]; then
            overall_status="unhealthy"
        fi
    fi
    log "💾 Disk Space: $disk_status - $disk_details"
    
    # Check Backup Status
    local backup_result=$(check_backup_status)
    local backup_status=$(echo "$backup_result" | cut -d'|' -f1)
    local backup_details=$(echo "$backup_result" | cut -d'|' -f2)
    
    if [ "$backup_status" != "healthy" ]; then
        send_alert "Backup" "$backup_status" "$backup_details"
        if [ "$backup_status" = "critical" ]; then
            overall_status="unhealthy"
        fi
    fi
    log "💾 Backup: $backup_status - $backup_details"
    
    # Overall status
    if [ "$overall_status" = "healthy" ]; then
        log "✅ All systems healthy"
    else
        log "❌ System health issues detected"
        exit 1
    fi
}

# Main execution
main() {
    run_health_check
}

# Run if called directly
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
    main "$@"
fi
