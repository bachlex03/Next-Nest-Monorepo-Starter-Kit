#!/bin/bash

# Production Setup Script
# Sets up all production scripts and configurations

set -e

echo "🏗️ Setting up production environment..."

# Make all scripts executable
echo "📝 Making scripts executable..."
find scripts/ -name "*.sh" -exec chmod +x {} \;

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p backups
mkdir -p logs
mkdir -p monitoring

# Set up log rotation
echo "📋 Setting up log rotation..."
sudo tee /etc/logrotate.d/production-backend > /dev/null <<EOF
/var/log/backup.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 0644 root root
}

/var/log/health-check.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 0644 root root
}

/var/log/disaster-recovery.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 0644 root root
}

/var/log/deployment.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 0644 root root
}
EOF

# Set up cron jobs
echo "⏰ Setting up cron jobs..."
(crontab -l 2>/dev/null; echo "# Production Backend Cron Jobs") | crontab -
(crontab -l 2>/dev/null; echo "0 2 * * * $(pwd)/scripts/backup/scheduled-backup.sh >> /var/log/backup.log 2>&1") | crontab -
(crontab -l 2>/dev/null; echo "*/5 * * * * $(pwd)/scripts/monitoring/health-check.sh >> /var/log/health-check.log 2>&1") | crontab -

echo "✅ Production setup completed!"
echo ""
echo "📋 Next steps:"
echo "1. Review and update .env.production with your settings"
echo "2. Deploy with: docker compose -f docker-compose.prod-secure.yml --env-file .env.production up -d"
echo "3. Setup monitoring: docker compose -f docker-compose.prod-secure.yml --profile monitoring up -d"
echo "4. Test backup: ./scripts/backup/backup-database.sh"
echo "5. Test health check: ./scripts/monitoring/health-check.sh"
echo ""
echo "📚 Documentation: See PRODUCTION_STRATEGY.md for detailed information"
