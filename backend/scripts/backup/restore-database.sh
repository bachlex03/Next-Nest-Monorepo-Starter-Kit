#!/bin/bash

# Database Restore Script
# This script restores PostgreSQL and Redis data from backups

set -e

# Configuration
BACKUP_DIR="/backups"

# Load environment variables
if [ -f .env.production ]; then
    export $(cat .env.production | grep -v '^#' | xargs)
fi

# Function to show usage
usage() {
    echo "Usage: $0 [OPTIONS]"
    echo "Options:"
    echo "  -p, --postgres FILE    Restore PostgreSQL from specific backup file"
    echo "  -r, --redis FILE       Restore Redis from specific backup file"
    echo "  -a, --all              Restore both PostgreSQL and Redis"
    echo "  -l, --list             List available backups"
    echo "  -h, --help             Show this help message"
    exit 1
}

# Function to list available backups
list_backups() {
    echo "📁 Available PostgreSQL backups:"
    ls -la "$BACKUP_DIR"/postgres_backup_*.sql.gz 2>/dev/null || echo "No PostgreSQL backups found"
    echo ""
    echo "📁 Available Redis backups:"
    ls -la "$BACKUP_DIR"/redis_backup_*.rdb.gz 2>/dev/null || echo "No Redis backups found"
}

# Function to restore PostgreSQL
restore_postgres() {
    local backup_file="$1"
    
    if [ ! -f "$backup_file" ]; then
        echo "❌ PostgreSQL backup file not found: $backup_file"
        exit 1
    fi
    
    echo "🔄 Restoring PostgreSQL from: $backup_file"
    
    # Decompress if needed
    if [[ "$backup_file" == *.gz ]]; then
        echo "📦 Decompressing backup file..."
        gunzip -c "$backup_file" | PGPASSWORD="$POSTGRES_PASSWORD" psql -h ${POSTGRES_HOST:-postgres_host} -U ${POSTGRES_USER} -d ${POSTGRES_DB} -v ON_ERROR_STOP=1
    else
        PGPASSWORD="$POSTGRES_PASSWORD" psql -h ${POSTGRES_HOST:-postgres_host} -U ${POSTGRES_USER} -d ${POSTGRES_DB} -v ON_ERROR_STOP=1 < "$backup_file"
    fi
    
    echo "✅ PostgreSQL restore completed successfully"
}

# Function to restore Redis
restore_redis() {
    local backup_file="$1"
    
    if [ ! -f "$backup_file" ]; then
        echo "❌ Redis backup file not found: $backup_file"
        exit 1
    fi
    
    echo "🔄 Restoring Redis from: $backup_file"
    
    # Stop Redis temporarily
    echo "⏸️ Stopping Redis service..."
    redis-cli -h ${REDIS_HOST:-redis_host} -p ${REDIS_PORT:-6379} SHUTDOWN SAVE || true
    
    # Wait a moment for Redis to stop
    sleep 2
    
    # Decompress if needed
    if [[ "$backup_file" == *.gz ]]; then
        echo "📦 Decompressing backup file..."
        gunzip -c "$backup_file" > /tmp/redis_restore.rdb
        backup_file="/tmp/redis_restore.rdb"
    fi
    
    # Copy the backup file to Redis data directory
    echo "📋 Copying backup to Redis data directory..."
    cp "$backup_file" /data/dump.rdb
    
    # Restart Redis
    echo "▶️ Starting Redis service..."
    redis-server --appendonly yes --appendfsync everysec &
    
    echo "✅ Redis restore completed successfully"
}

# Parse command line arguments
POSTGRES_FILE=""
REDIS_FILE=""
RESTORE_ALL=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -p|--postgres)
            POSTGRES_FILE="$2"
            shift 2
            ;;
        -r|--redis)
            REDIS_FILE="$2"
            shift 2
            ;;
        -a|--all)
            RESTORE_ALL=true
            shift
            ;;
        -l|--list)
            list_backups
            exit 0
            ;;
        -h|--help)
            usage
            ;;
        *)
            echo "Unknown option: $1"
            usage
            ;;
    esac
done

# Validate arguments
if [ "$RESTORE_ALL" = true ]; then
    # Find the latest backups
    POSTGRES_FILE=$(ls -t "$BACKUP_DIR"/postgres_backup_*.sql.gz 2>/dev/null | head -n1)
    REDIS_FILE=$(ls -t "$BACKUP_DIR"/redis_backup_*.rdb.gz 2>/dev/null | head -n1)
    
    if [ -z "$POSTGRES_FILE" ] || [ -z "$REDIS_FILE" ]; then
        echo "❌ No backups found for restore all operation"
        list_backups
        exit 1
    fi
    
    echo "🔄 Restoring from latest backups:"
    echo "   PostgreSQL: $POSTGRES_FILE"
    echo "   Redis: $REDIS_FILE"
fi

if [ -z "$POSTGRES_FILE" ] && [ -z "$REDIS_FILE" ] && [ "$RESTORE_ALL" = false ]; then
    echo "❌ No restore options specified"
    usage
fi

# Confirmation prompt
echo "⚠️  WARNING: This will overwrite existing data!"
read -p "Are you sure you want to continue? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "❌ Restore cancelled"
    exit 1
fi

# Perform restores
if [ -n "$POSTGRES_FILE" ]; then
    restore_postgres "$POSTGRES_FILE"
fi

if [ -n "$REDIS_FILE" ]; then
    restore_redis "$REDIS_FILE"
fi

echo "🎉 Restore process completed successfully at $(date)"
