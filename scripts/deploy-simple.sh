#!/bin/bash

# Simple Deployment Script
# This script handles the deployment of the video processing application

set -e  # Exit on any error

echo "🚀 Starting deployment to server 18.144.88.135..."
echo "=================================================="

# Configuration
DEPLOY_DIR="/var/www/cloutware-videoeditor"
REPO_URL="https://github.com/SeifEldin15/cloutware-videoeditor.git"
APP_NAME="video-processing"
PORT=3000

# Create deployment directory if it doesn't exist
echo "📁 Preparing deployment directory..."
sudo mkdir -p $DEPLOY_DIR
sudo chown $USER:$USER $DEPLOY_DIR

# Navigate to deployment directory
cd $DEPLOY_DIR

# Handle Git repository
if [ ! -d ".git" ]; then
    echo "📥 Cloning repository for the first time..."
    git clone $REPO_URL .
else
    echo "📥 Pulling latest changes..."
    git fetch origin
    git reset --hard origin/main
    git clean -fd
fi

echo "📦 Installing dependencies..."
npm install

# Stop existing PM2 process if running
echo "🛑 Stopping existing application..."
pm2 stop $APP_NAME 2>/dev/null || echo "No existing process found"
pm2 delete $APP_NAME 2>/dev/null || echo "No existing process to delete"

# Start the application with PM2
echo "🚀 Starting application..."
pm2 start npm --name "$APP_NAME" -- run dev -- --host 0.0.0.0 --port $PORT

# Save PM2 process list
pm2 save

# Show status
echo "✅ Deployment completed successfully!"
echo "🌐 Application is running on http://18.144.88.135:$PORT"
echo ""
pm2 status

# Show logs command
echo ""
echo "📋 To view logs, run: pm2 logs $APP_NAME"
echo "📋 To stop the app, run: pm2 stop $APP_NAME"
echo "📋 To restart the app, run: pm2 restart $APP_NAME"