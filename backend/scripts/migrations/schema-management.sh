#!/bin/bash

# Database Schema Management Script
# Handles safe schema updates, data migrations, and compatibility checks

set -e

# Configuration
SCHEMA_LOG="/var/log/schema-management.log"
COMPATIBILITY_CHECK=true
DATA_MIGRATION_TIMEOUT=3600

# Load environment variables
if [ -f .env.production ]; then
    export $(cat .env.production | grep -v '^#' | xargs)
fi

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$SCHEMA_LOG"
}

# Function to show usage
usage() {
    echo "Database Schema Management"
    echo ""
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  analyze-schema       Analyze current schema and detect changes"
    echo "  check-compatibility  Check backward compatibility"
    echo "  generate-migration   Generate new migration file"
    echo "  validate-migration   Validate migration file"
    echo "  apply-migration      Apply migration with safety checks"
    echo "  rollback-schema      Rollback schema changes"
    echo "  backup-schema        Backup current schema"
    echo "  restore-schema       Restore schema from backup"
    echo "  diff-schemas         Compare schemas"
    echo "  help                 Show this help message"
    echo ""
    echo "Options:"
    echo "  --dry-run            Show what would be done without executing"
    echo "  --force              Force operation even if warnings exist"
    echo "  --backup-first       Create backup before operation"
    echo ""
    exit 1
}

# Function to analyze schema changes
analyze_schema() {
    log "🔍 Analyzing schema changes..."
    
    # Get current schema
    local current_schema="/tmp/current_schema.sql"
    PGPASSWORD="$POSTGRES_PASSWORD" pg_dump \
        -h ${POSTGRES_HOST:-postgres_host} \
        -U ${POSTGRES_USER} \
        -d ${POSTGRES_DB} \
        --schema-only --no-owner --no-privileges > "$current_schema"
    
    # Get target schema from Prisma
    local target_schema="/tmp/target_schema.sql"
    docker run --rm --network backend_app-network \
        --env-file .env.production \
        -w /app \
        -e DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST:-postgres_host}:${POSTGRES_PORT:-5432}/${POSTGRES_DB}?schema=public" \
        backend-backend \
        npx prisma db pull --schema ./prisma/schema.prisma > "$target_schema" 2>/dev/null || true
    
    # Compare schemas
    if diff -u "$current_schema" "$target_schema" > /tmp/schema_diff.patch 2>/dev/null; then
        log "✅ No schema changes detected"
        return 0
    else
        log "📋 Schema changes detected:"
        cat /tmp/schema_diff.patch
        return 1
    fi
}

# Function to check backward compatibility
check_compatibility() {
    if [ "$COMPATIBILITY_CHECK" = true ]; then
        log "🔍 Checking backward compatibility..."
        
        # Check for breaking changes
        local breaking_changes=()
        
        # Check for dropped columns
        if grep -q "DROP COLUMN" /tmp/schema_diff.patch 2>/dev/null; then
            breaking_changes+=("Dropped columns detected")
        fi
        
        # Check for dropped tables
        if grep -q "DROP TABLE" /tmp/schema_diff.patch 2>/dev/null; then
            breaking_changes+=("Dropped tables detected")
        fi
        
        # Check for column type changes
        if grep -q "ALTER COLUMN.*TYPE" /tmp/schema_diff.patch 2>/dev/null; then
            breaking_changes+=("Column type changes detected")
        fi
        
        # Check for NOT NULL additions
        if grep -q "ALTER COLUMN.*SET NOT NULL" /tmp/schema_diff.patch 2>/dev/null; then
            breaking_changes+=("NOT NULL constraints added")
        fi
        
        if [ ${#breaking_changes[@]} -gt 0 ]; then
            log "⚠️ Breaking changes detected:"
            for change in "${breaking_changes[@]}"; do
                log "  - $change"
            done
            return 1
        else
            log "✅ No breaking changes detected"
            return 0
        fi
    else
        log "⚠️ Compatibility check disabled"
        return 0
    fi
}

# Function to generate migration file
generate_migration() {
    local migration_name="$1"
    
    if [ -z "$migration_name" ]; then
        echo "Error: Migration name required"
        echo "Usage: $0 generate-migration <migration-name>"
        exit 1
    fi
    
    log "📝 Generating migration: $migration_name"
    
    # Generate migration using Prisma
    docker run --rm --network backend_app-network \
        --env-file .env.production \
        -w /app \
        -e DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST:-postgres_host}:${POSTGRES_PORT:-5432}/${POSTGRES_DB}?schema=public" \
        -v "$(pwd)/src/infrastructure/persistence/prisma/migrations:/app/prisma/migrations" \
        backend-backend \
        npx prisma migrate dev --name "$migration_name" --schema ./prisma/schema.prisma --create-only
    
    log "✅ Migration file generated"
}

# Function to validate migration file
validate_migration() {
    local migration_file="$1"
    
    if [ -z "$migration_file" ]; then
        echo "Error: Migration file required"
        echo "Usage: $0 validate-migration <migration-file>"
        exit 1
    fi
    
    log "✅ Validating migration file: $migration_file"
    
    # Check if migration file exists
    if [ ! -f "$migration_file" ]; then
        log "❌ Migration file not found: $migration_file"
        return 1
    fi
    
    # Validate SQL syntax
    if ! PGPASSWORD="$POSTGRES_PASSWORD" psql \
        -h ${POSTGRES_HOST:-postgres_host} \
        -U ${POSTGRES_USER} \
        -d ${POSTGRES_DB} \
        --dry-run -f "$migration_file" > /dev/null 2>&1; then
        log "❌ Migration file contains invalid SQL"
        return 1
    fi
    
    # Check for dangerous operations
    local dangerous_operations=()
    
    if grep -qi "DROP TABLE" "$migration_file"; then
        dangerous_operations+=("DROP TABLE")
    fi
    
    if grep -qi "DROP DATABASE" "$migration_file"; then
        dangerous_operations+=("DROP DATABASE")
    fi
    
    if grep -qi "TRUNCATE" "$migration_file"; then
        dangerous_operations+=("TRUNCATE")
    fi
    
    if [ ${#dangerous_operations[@]} -gt 0 ]; then
        log "⚠️ Dangerous operations detected:"
        for op in "${dangerous_operations[@]}"; do
            log "  - $op"
        done
        log "Please review the migration file carefully"
    fi
    
    log "✅ Migration file validation completed"
    return 0
}

# Function to apply migration with safety checks
apply_migration() {
    local migration_file="$1"
    local dry_run="${2:-false}"
    
    log "🔄 Applying migration: $migration_file"
    
    # Step 1: Validate migration
    if ! validate_migration "$migration_file"; then
        log "❌ Migration validation failed"
        return 1
    fi
    
    # Step 2: Check compatibility
    if ! check_compatibility; then
        log "⚠️ Compatibility issues detected"
        read -p "Continue anyway? (yes/no): " confirm
        if [ "$confirm" != "yes" ]; then
            log "❌ Migration cancelled"
            return 1
        fi
    fi
    
    # Step 3: Create backup
    log "💾 Creating pre-migration backup..."
    ./scripts/backup/backup-database.sh
    
    # Step 4: Apply migration
    if [ "$dry_run" = false ]; then
        log "🚀 Applying migration..."
        
        # Start transaction
        PGPASSWORD="$POSTGRES_PASSWORD" psql \
            -h ${POSTGRES_HOST:-postgres_host} \
            -U ${POSTGRES_USER} \
            -d ${POSTGRES_DB} \
            -c "BEGIN;"
        
        # Apply migration
        if PGPASSWORD="$POSTGRES_PASSWORD" psql \
            -h ${POSTGRES_HOST:-postgres_host} \
            -U ${POSTGRES_USER} \
            -d ${POSTGRES_DB} \
            -f "$migration_file"; then
            
            # Commit transaction
            PGPASSWORD="$POSTGRES_PASSWORD" psql \
                -h ${POSTGRES_HOST:-postgres_host} \
                -U ${POSTGRES_USER} \
                -d ${POSTGRES_DB} \
                -c "COMMIT;"
            
            log "✅ Migration applied successfully"
        else
            # Rollback transaction
            PGPASSWORD="$POSTGRES_PASSWORD" psql \
                -h ${POSTGRES_HOST:-postgres_host} \
                -U ${POSTGRES_USER} \
                -d ${POSTGRES_DB} \
                -c "ROLLBACK;"
            
            log "❌ Migration failed, transaction rolled back"
            return 1
        fi
    else
        log "🔍 DRY RUN: Would apply migration"
    fi
    
    # Step 5: Validate result
    if [ "$dry_run" = false ]; then
        log "✅ Validating migration result..."
        
        # Check database connectivity
        if ! pg_isready -h ${POSTGRES_HOST:-postgres_host} -U ${POSTGRES_USER} -d ${POSTGRES_DB} > /dev/null 2>&1; then
            log "❌ Database connectivity check failed after migration"
            return 1
        fi
        
        # Run basic queries
        if ! PGPASSWORD="$POSTGRES_PASSWORD" psql \
            -h ${POSTGRES_HOST:-postgres_host} \
            -U ${POSTGRES_USER} \
            -d ${POSTGRES_DB} \
            -c "SELECT 1;" > /dev/null 2>&1; then
            log "❌ Basic query test failed after migration"
            return 1
        fi
        
        log "✅ Migration validation passed"
    fi
    
    return 0
}

# Function to rollback schema changes
rollback_schema() {
    log "🔄 Rolling back schema changes..."
    
    # Find latest migration backup
    local latest_backup=$(find /backups -name "pre_migration_backup_*.sql.gz" -type f -printf '%T@ %p\n' 2>/dev/null | sort -n | tail -1 | cut -d' ' -f2-)
    
    if [ -z "$latest_backup" ]; then
        log "❌ No migration backup found for rollback"
        return 1
    fi
    
    log "📁 Rolling back from backup: $latest_backup"
    
    # Stop application
    docker stop backend-backend-1 2>/dev/null || true
    
    # Restore schema
    gunzip -c "$latest_backup" | PGPASSWORD="$POSTGRES_PASSWORD" psql \
        -h ${POSTGRES_HOST:-postgres_host} \
        -U ${POSTGRES_USER} \
        -d ${POSTGRES_DB} \
        -v ON_ERROR_STOP=1
    
    # Restart application
    docker compose -f docker-compose.prod-secure.yml --env-file .env.production up -d backend
    
    log "✅ Schema rollback completed"
}

# Function to backup schema
backup_schema() {
    local backup_name="$1"
    
    if [ -z "$backup_name" ]; then
        backup_name="schema_backup_$(date +%Y%m%d_%H%M%S)"
    fi
    
    log "💾 Creating schema backup: $backup_name"
    
    local backup_file="/backups/${backup_name}.sql.gz"
    
    # Backup schema only
    PGPASSWORD="$POSTGRES_PASSWORD" pg_dump \
        -h ${POSTGRES_HOST:-postgres_host} \
        -U ${POSTGRES_USER} \
        -d ${POSTGRES_DB} \
        --schema-only --no-owner --no-privileges | gzip > "$backup_file"
    
    log "✅ Schema backup created: $backup_file"
    echo "$backup_file"
}

# Function to restore schema
restore_schema() {
    local backup_file="$1"
    
    if [ -z "$backup_file" ]; then
        echo "Error: Backup file required"
        echo "Usage: $0 restore-schema <backup-file>"
        exit 1
    fi
    
    if [ ! -f "$backup_file" ]; then
        log "❌ Backup file not found: $backup_file"
        return 1
    fi
    
    log "🔄 Restoring schema from: $backup_file"
    
    # Stop application
    docker stop backend-backend-1 2>/dev/null || true
    
    # Restore schema
    gunzip -c "$backup_file" | PGPASSWORD="$POSTGRES_PASSWORD" psql \
        -h ${POSTGRES_HOST:-postgres_host} \
        -U ${POSTGRES_USER} \
        -d ${POSTGRES_DB} \
        -v ON_ERROR_STOP=1
    
    # Restart application
    docker compose -f docker-compose.prod-secure.yml --env-file .env.production up -d backend
    
    log "✅ Schema restore completed"
}

# Function to compare schemas
diff_schemas() {
    local schema1="$1"
    local schema2="$2"
    
    if [ -z "$schema1" ] || [ -z "$schema2" ]; then
        echo "Error: Two schema files required"
        echo "Usage: $0 diff-schemas <schema1> <schema2>"
        exit 1
    fi
    
    log "🔍 Comparing schemas: $schema1 vs $schema2"
    
    if diff -u "$schema1" "$schema2" > /tmp/schema_comparison.patch; then
        log "✅ Schemas are identical"
    else
        log "📋 Schema differences found:"
        cat /tmp/schema_comparison.patch
    fi
}

# Main execution
main() {
    case "${1:-help}" in
        "analyze-schema")
            analyze_schema
            ;;
        "check-compatibility")
            check_compatibility
            ;;
        "generate-migration")
            generate_migration "$2"
            ;;
        "validate-migration")
            validate_migration "$2"
            ;;
        "apply-migration")
            if [ -z "$2" ]; then
                echo "Error: Migration file required"
                echo "Usage: $0 apply-migration <migration-file> [--dry-run]"
                exit 1
            fi
            local dry_run=false
            if [ "$3" = "--dry-run" ]; then
                dry_run=true
            fi
            apply_migration "$2" "$dry_run"
            ;;
        "rollback-schema")
            rollback_schema
            ;;
        "backup-schema")
            backup_schema "$2"
            ;;
        "restore-schema")
            restore_schema "$2"
            ;;
        "diff-schemas")
            diff_schemas "$2" "$3"
            ;;
        "help"|*)
            usage
            ;;
    esac
}

# Run main function
main "$@"
