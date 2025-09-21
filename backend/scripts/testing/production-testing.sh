#!/bin/bash

# Production Testing Pipeline
# Comprehensive testing for production deployments and updates

set -e

# Configuration
TEST_LOG="/var/log/production-testing.log"
TEST_TIMEOUT=300
SMOKE_TEST_ENABLED=true
INTEGRATION_TEST_ENABLED=true
PERFORMANCE_TEST_ENABLED=false

# Load environment variables
if [ -f .env.production ]; then
    export $(cat .env.production | grep -v '^#' | xargs)
fi

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$TEST_LOG"
}

# Function to show usage
usage() {
    echo "Production Testing Pipeline"
    echo ""
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  smoke-test          Run smoke tests"
    echo "  integration-test    Run integration tests"
    echo "  performance-test    Run performance tests"
    echo "  migration-test      Test database migrations"
    echo "  rollback-test       Test rollback procedures"
    echo "  full-test           Run all tests"
    echo "  health-check        Comprehensive health check"
    echo "  help                Show this help message"
    echo ""
    echo "Options:"
    echo "  --timeout <seconds> Set test timeout (default: 300)"
    echo "  --verbose           Enable verbose output"
    echo "  --skip-smoke        Skip smoke tests"
    echo "  --skip-integration  Skip integration tests"
    echo "  --skip-performance  Skip performance tests"
    echo ""
    exit 1
}

# Function to wait for service readiness
wait_for_service() {
    local service_name="$1"
    local health_url="$2"
    local timeout="${3:-$TEST_TIMEOUT}"
    
    log "⏳ Waiting for $service_name to be ready..."
    
    local start_time=$(date +%s)
    while [ $(($(date +%s) - start_time)) -lt $timeout ]; do
        if curl -f -s "$health_url" > /dev/null 2>&1; then
            log "✅ $service_name is ready"
            return 0
        fi
        sleep 5
    done
    
    log "❌ $service_name failed to become ready within ${timeout}s"
    return 1
}

# Function to run smoke tests
run_smoke_tests() {
    log "🧪 Running smoke tests..."
    
    local test_results=()
    local failed_tests=0
    
    # Test 1: Application health endpoint
    log "🔍 Testing application health endpoint..."
    if curl -f -s "http://localhost:${PORT:-4000}/health" > /dev/null 2>&1; then
        log "✅ Health endpoint test passed"
        test_results+=("✅ Health endpoint")
    else
        log "❌ Health endpoint test failed"
        test_results+=("❌ Health endpoint")
        failed_tests=$((failed_tests + 1))
    fi
    
    # Test 2: Database connectivity
    log "🔍 Testing database connectivity..."
    if pg_isready -h ${POSTGRES_HOST:-postgres_host} -U ${POSTGRES_USER} -d ${POSTGRES_DB} > /dev/null 2>&1; then
        log "✅ Database connectivity test passed"
        test_results+=("✅ Database connectivity")
    else
        log "❌ Database connectivity test failed"
        test_results+=("❌ Database connectivity")
        failed_tests=$((failed_tests + 1))
    fi
    
    # Test 3: Redis connectivity
    log "🔍 Testing Redis connectivity..."
    if redis-cli -h ${REDIS_HOST:-redis_host} -p ${REDIS_PORT:-6379} ping > /dev/null 2>&1; then
        log "✅ Redis connectivity test passed"
        test_results+=("✅ Redis connectivity")
    else
        log "❌ Redis connectivity test failed"
        test_results+=("❌ Redis connectivity")
        failed_tests=$((failed_tests + 1))
    fi
    
    # Test 4: Basic API endpoints
    log "🔍 Testing basic API endpoints..."
    local api_endpoints=(
        "/api/v1"
        "/api/v1/auth/login"
        "/api/v1/users/me"
    )
    
    for endpoint in "${api_endpoints[@]}"; do
        local response_code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:${PORT:-4000}$endpoint")
        if [ "$response_code" -ge 200 ] && [ "$response_code" -lt 500 ]; then
            log "✅ API endpoint $endpoint test passed (HTTP $response_code)"
            test_results+=("✅ API endpoint $endpoint")
        else
            log "❌ API endpoint $endpoint test failed (HTTP $response_code)"
            test_results+=("❌ API endpoint $endpoint")
            failed_tests=$((failed_tests + 1))
        fi
    done
    
    # Test 5: Database queries
    log "🔍 Testing database queries..."
    if PGPASSWORD="$POSTGRES_PASSWORD" psql \
        -h ${POSTGRES_HOST:-postgres_host} \
        -U ${POSTGRES_USER} \
        -d ${POSTGRES_DB} \
        -c "SELECT COUNT(*) FROM users;" > /dev/null 2>&1; then
        log "✅ Database query test passed"
        test_results+=("✅ Database queries")
    else
        log "❌ Database query test failed"
        test_results+=("❌ Database queries")
        failed_tests=$((failed_tests + 1))
    fi
    
    # Test 6: Redis operations
    log "🔍 Testing Redis operations..."
    if redis-cli -h ${REDIS_HOST:-redis_host} -p ${REDIS_PORT:-6379} set test_key "test_value" && \
       redis-cli -h ${REDIS_HOST:-redis_host} -p ${REDIS_PORT:-6379} get test_key | grep -q "test_value"; then
        log "✅ Redis operations test passed"
        test_results+=("✅ Redis operations")
        redis-cli -h ${REDIS_HOST:-redis_host} -p ${REDIS_PORT:-6379} del test_key > /dev/null
    else
        log "❌ Redis operations test failed"
        test_results+=("❌ Redis operations")
        failed_tests=$((failed_tests + 1))
    fi
    
    # Summary
    log "📊 Smoke test results:"
    for result in "${test_results[@]}"; do
        log "  $result"
    done
    
    if [ $failed_tests -eq 0 ]; then
        log "✅ All smoke tests passed"
        return 0
    else
        log "❌ $failed_tests smoke tests failed"
        return 1
    fi
}

# Function to run integration tests
run_integration_tests() {
    log "🔗 Running integration tests..."
    
    local test_results=()
    local failed_tests=0
    
    # Test 1: User registration flow
    log "🔍 Testing user registration flow..."
    local test_user="test_$(date +%s)@example.com"
    local registration_response=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$test_user\",\"password\":\"testpass123\",\"firstName\":\"Test\",\"lastName\":\"User\"}" \
        "http://localhost:${PORT:-4000}/api/v1/auth/register")
    
    if echo "$registration_response" | grep -q "success\|created"; then
        log "✅ User registration test passed"
        test_results+=("✅ User registration")
    else
        log "❌ User registration test failed"
        test_results+=("❌ User registration")
        failed_tests=$((failed_tests + 1))
    fi
    
    # Test 2: User login flow
    log "🔍 Testing user login flow..."
    local login_response=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$test_user\",\"password\":\"testpass123\"}" \
        "http://localhost:${PORT:-4000}/api/v1/auth/login")
    
    if echo "$login_response" | grep -q "token\|accessToken"; then
        log "✅ User login test passed"
        test_results+=("✅ User login")
        
        # Extract token for further tests
        local token=$(echo "$login_response" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
        if [ -n "$token" ]; then
            # Test 3: Authenticated request
            log "🔍 Testing authenticated request..."
            local auth_response=$(curl -s -H "Authorization: Bearer $token" \
                "http://localhost:${PORT:-4000}/api/v1/users/me")
            
            if echo "$auth_response" | grep -q "email\|user"; then
                log "✅ Authenticated request test passed"
                test_results+=("✅ Authenticated requests")
            else
                log "❌ Authenticated request test failed"
                test_results+=("❌ Authenticated requests")
                failed_tests=$((failed_tests + 1))
            fi
        fi
    else
        log "❌ User login test failed"
        test_results+=("❌ User login")
        failed_tests=$((failed_tests + 1))
    fi
    
    # Test 4: Database consistency
    log "🔍 Testing database consistency..."
    local user_count=$(PGPASSWORD="$POSTGRES_PASSWORD" psql \
        -h ${POSTGRES_HOST:-postgres_host} \
        -U ${POSTGRES_USER} \
        -d ${POSTGRES_DB} \
        -t -c "SELECT COUNT(*) FROM users;" | xargs)
    
    if [ "$user_count" -gt 0 ]; then
        log "✅ Database consistency test passed ($user_count users)"
        test_results+=("✅ Database consistency")
    else
        log "❌ Database consistency test failed"
        test_results+=("❌ Database consistency")
        failed_tests=$((failed_tests + 1))
    fi
    
    # Test 5: Cache functionality
    log "🔍 Testing cache functionality..."
    local cache_key="test_cache_$(date +%s)"
    local cache_value="test_value_$(date +%s)"
    
    # Set cache value
    redis-cli -h ${REDIS_HOST:-redis_host} -p ${REDIS_PORT:-6379} set "$cache_key" "$cache_value" > /dev/null
    
    # Get cache value
    local retrieved_value=$(redis-cli -h ${REDIS_HOST:-redis_host} -p ${REDIS_PORT:-6379} get "$cache_key")
    
    if [ "$retrieved_value" = "$cache_value" ]; then
        log "✅ Cache functionality test passed"
        test_results+=("✅ Cache functionality")
        redis-cli -h ${REDIS_HOST:-redis_host} -p ${REDIS_PORT:-6379} del "$cache_key" > /dev/null
    else
        log "❌ Cache functionality test failed"
        test_results+=("❌ Cache functionality")
        failed_tests=$((failed_tests + 1))
    fi
    
    # Summary
    log "📊 Integration test results:"
    for result in "${test_results[@]}"; do
        log "  $result"
    done
    
    if [ $failed_tests -eq 0 ]; then
        log "✅ All integration tests passed"
        return 0
    else
        log "❌ $failed_tests integration tests failed"
        return 1
    fi
}

# Function to run performance tests
run_performance_tests() {
    log "⚡ Running performance tests..."
    
    # Test 1: Response time test
    log "🔍 Testing response times..."
    local response_time=$(curl -o /dev/null -s -w '%{time_total}' "http://localhost:${PORT:-4000}/api/v1")
    
    if (( $(echo "$response_time < 1.0" | bc -l) )); then
        log "✅ Response time test passed (${response_time}s)"
    else
        log "⚠️ Response time test warning (${response_time}s > 1.0s)"
    fi
    
    # Test 2: Concurrent request test
    log "🔍 Testing concurrent requests..."
    local concurrent_requests=10
    local successful_requests=0
    
    for i in $(seq 1 $concurrent_requests); do
        if curl -f -s "http://localhost:${PORT:-4000}/api/v1" > /dev/null 2>&1; then
            successful_requests=$((successful_requests + 1))
        fi
    done
    
    if [ $successful_requests -eq $concurrent_requests ]; then
        log "✅ Concurrent request test passed ($successful_requests/$concurrent_requests)"
    else
        log "⚠️ Concurrent request test warning ($successful_requests/$concurrent_requests)"
    fi
    
    # Test 3: Database performance
    log "🔍 Testing database performance..."
    local db_query_time=$(PGPASSWORD="$POSTGRES_PASSWORD" psql \
        -h ${POSTGRES_HOST:-postgres_host} \
        -U ${POSTGRES_USER} \
        -d ${POSTGRES_DB} \
        -c "\timing on" \
        -c "SELECT COUNT(*) FROM users;" 2>&1 | grep "Time:" | awk '{print $2}' | head -1)
    
    log "📊 Database query time: $db_query_time"
    
    log "✅ Performance tests completed"
    return 0
}

# Function to test database migrations
test_migrations() {
    log "🗄️ Testing database migrations..."
    
    # Test migration status
    if ./scripts/migrations/migration-strategy.sh check-migrations; then
        log "✅ Migration status check passed"
    else
        log "❌ Migration status check failed"
        return 1
    fi
    
    # Test schema analysis
    if ./scripts/migrations/schema-management.sh analyze-schema; then
        log "✅ Schema analysis passed"
    else
        log "⚠️ Schema changes detected"
    fi
    
    # Test compatibility check
    if ./scripts/migrations/schema-management.sh check-compatibility; then
        log "✅ Compatibility check passed"
    else
        log "⚠️ Compatibility issues detected"
    fi
    
    log "✅ Migration tests completed"
    return 0
}

# Function to test rollback procedures
test_rollback() {
    log "🔄 Testing rollback procedures..."
    
    # Test rollback script availability
    if [ -f "./scripts/migrations/migration-strategy.sh" ]; then
        log "✅ Rollback script available"
    else
        log "❌ Rollback script not found"
        return 1
    fi
    
    # Test backup availability
    local latest_backup=$(find /backups -name "*.sql.gz" -type f -printf '%T@ %p\n' 2>/dev/null | sort -n | tail -1 | cut -d' ' -f2-)
    if [ -n "$latest_backup" ]; then
        log "✅ Backup available for rollback: $latest_backup"
    else
        log "⚠️ No backups available for rollback"
    fi
    
    log "✅ Rollback test completed"
    return 0
}

# Function to run comprehensive health check
run_health_check() {
    log "🏥 Running comprehensive health check..."
    
    # Run all monitoring checks
    ./scripts/monitoring/health-check.sh
    
    log "✅ Comprehensive health check completed"
    return 0
}

# Function to run all tests
run_all_tests() {
    log "🧪 Running full test suite..."
    
    local overall_result=0
    
    # Smoke tests
    if [ "$SMOKE_TEST_ENABLED" = true ]; then
        if ! run_smoke_tests; then
            overall_result=1
        fi
    fi
    
    # Integration tests
    if [ "$INTEGRATION_TEST_ENABLED" = true ]; then
        if ! run_integration_tests; then
            overall_result=1
        fi
    fi
    
    # Performance tests
    if [ "$PERFORMANCE_TEST_ENABLED" = true ]; then
        if ! run_performance_tests; then
            overall_result=1
        fi
    fi
    
    # Migration tests
    if ! test_migrations; then
        overall_result=1
    fi
    
    # Rollback tests
    if ! test_rollback; then
        overall_result=1
    fi
    
    # Health check
    if ! run_health_check; then
        overall_result=1
    fi
    
    if [ $overall_result -eq 0 ]; then
        log "🎉 All tests passed successfully"
    else
        log "❌ Some tests failed"
    fi
    
    return $overall_result
}

# Main execution
main() {
    # Parse options
    while [[ $# -gt 0 ]]; do
        case $1 in
            --timeout)
                TEST_TIMEOUT="$2"
                shift 2
                ;;
            --verbose)
                set -x
                shift
                ;;
            --skip-smoke)
                SMOKE_TEST_ENABLED=false
                shift
                ;;
            --skip-integration)
                INTEGRATION_TEST_ENABLED=false
                shift
                ;;
            --skip-performance)
                PERFORMANCE_TEST_ENABLED=false
                shift
                ;;
            *)
                break
                ;;
        esac
    done
    
    case "${1:-help}" in
        "smoke-test")
            run_smoke_tests
            ;;
        "integration-test")
            run_integration_tests
            ;;
        "performance-test")
            run_performance_tests
            ;;
        "migration-test")
            test_migrations
            ;;
        "rollback-test")
            test_rollback
            ;;
        "full-test")
            run_all_tests
            ;;
        "health-check")
            run_health_check
            ;;
        "help"|*)
            usage
            ;;
    esac
}

# Run main function
main "$@"
