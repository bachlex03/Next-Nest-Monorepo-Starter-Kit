#!/bin/bash

# Database Backup Script
# This script creates automated backups of PostgreSQL and Redis data

set -e

# Configuration
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# Load environment variables
if [ -f .env.production ]; then
    export $(cat .env.production | grep -v '^#' | xargs)
fi

echo "🔄 Starting backup process at $(date)"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# PostgreSQL Backup
echo "📊 Creating PostgreSQL backup..."
PG_BACKUP_FILE="$BACKUP_DIR/postgres_backup_$DATE.sql"
PGDUMP_CMD="pg_dump -h ${POSTGRES_HOST:-postgres_host} -U ${POSTGRES_USER} -d ${POSTGRES_DB} --verbose --clean --no-owner --no-privileges"

if PGPASSWORD="$POSTGRES_PASSWORD" $PGDUMP_CMD > "$PG_BACKUP_FILE"; then
    echo "✅ PostgreSQL backup created: $PG_BACKUP_FILE"
    
    # Compress the backup
    gzip "$PG_BACKUP_FILE"
    echo "✅ PostgreSQL backup compressed: $PG_BACKUP_FILE.gz"
else
    echo "❌ PostgreSQL backup failed!"
    exit 1
fi

# Redis Backup
echo "🔴 Creating Redis backup..."
REDIS_BACKUP_FILE="$BACKUP_DIR/redis_backup_$DATE.rdb"
REDIS_DUMP_CMD="redis-cli -h ${REDIS_HOST:-redis_host} -p ${REDIS_PORT:-6379} --rdb"

if $REDIS_DUMP_CMD "$REDIS_BACKUP_FILE"; then
    echo "✅ Redis backup created: $REDIS_BACKUP_FILE"
    
    # Compress the backup
    gzip "$REDIS_BACKUP_FILE"
    echo "✅ Redis backup compressed: $REDIS_BACKUP_FILE.gz"
else
    echo "❌ Redis backup failed!"
    exit 1
fi

# Cleanup old backups
echo "🧹 Cleaning up old backups (older than $RETENTION_DAYS days)..."
find "$BACKUP_DIR" -name "*.gz" -type f -mtime +$RETENTION_DAYS -delete
echo "✅ Old backups cleaned up"

# Create backup manifest
MANIFEST_FILE="$BACKUP_DIR/backup_manifest_$DATE.json"
cat > "$MANIFEST_FILE" << EOF
{
  "backup_date": "$(date -Iseconds)",
  "postgres_backup": "$PG_BACKUP_FILE.gz",
  "redis_backup": "$REDIS_BACKUP_FILE.gz",
  "backup_size_postgres": "$(du -h "$PG_BACKUP_FILE.gz" | cut -f1)",
  "backup_size_redis": "$(du -h "$REDIS_BACKUP_FILE.gz" | cut -f1)",
  "database_name": "${POSTGRES_DB}",
  "retention_days": $RETENTION_DAYS
}
EOF

echo "✅ Backup manifest created: $MANIFEST_FILE"

# Optional: Upload to cloud storage (uncomment and configure as needed)
# echo "☁️ Uploading to cloud storage..."
# aws s3 cp "$PG_BACKUP_FILE.gz" s3://your-backup-bucket/database/
# aws s3 cp "$REDIS_BACKUP_FILE.gz" s3://your-backup-bucket/redis/

echo "🎉 Backup process completed successfully at $(date)"
echo "📁 Backup location: $BACKUP_DIR"
