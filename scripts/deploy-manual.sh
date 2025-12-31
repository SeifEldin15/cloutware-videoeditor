#!/bin/bash

# Manual Deployment Script for Ubuntu Server
# Use this script to deploy manually without CI/CD

set -e

PROJECT_DIR="/opt/video-processing"
REPO_URL="https://github.com/SeifEldin15/cloutware-videoeditor.git"
BRANCH="main"

echo "🚀 Starting manual deployment..."

# Navigate to project directory
cd $PROJECT_DIR

# Backup current deployment
if [ -d "current" ]; then
    echo "📦 Backing up current deployment..."
    mv current backup-$(date +%Y%m%d-%H%M%S)
fi

# Clone fresh copy
echo "📥 Cloning repository..."
git clone $REPO_URL temp-clone
cd temp-clone
git checkout $BRANCH

# Create deployment directory
echo "📁 Preparing deployment..."
mv ../temp-clone ../current
cd ../current

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install --frozen-lockfile

# Build application
echo "🔨 Building application..."
pnpm run build

# Create necessary directories
mkdir -p uploads temp

# Set permissions
sudo chown -R $USER:$USER /opt/video-processing
chmod -R 755 /opt/video-processing

# Restart application with PM2
echo "🔄 Restarting application..."
pm2 restart video-processing || pm2 start ecosystem.config.js

# Restart Nginx
echo "🌐 Restarting Nginx..."
sudo systemctl restart nginx

# Clean up old backups (keep last 3)
echo "🧹 Cleaning up old backups..."
cd /opt/video-processing
ls -t backup-* | tail -n +4 | xargs rm -rf 2>/dev/null || true

# Health check
echo "🏥 Performing health check..."
sleep 5
pm2 status video-processing

echo "✅ Deployment completed successfully!"
echo "🔗 Application should be available at: http://$(hostname -I | awk '{print $1}')"
