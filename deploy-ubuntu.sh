#!/bin/bash

# Ubuntu Deployment Script for Video Processing Service
set -e

echo "🚀 Starting Ubuntu deployment..."

# Check if running on Ubuntu
if ! command -v lsb_release &> /dev/null || [[ $(lsb_release -si) != "Ubuntu" ]]; then
    echo "❌ This script is designed for Ubuntu systems only"
    exit 1
fi

# Set Ubuntu codename for environment detection
export UBUNTU_CODENAME=$(lsb_release -cs)
echo "📍 Detected Ubuntu: $UBUNTU_CODENAME"

# Install system dependencies
echo "📦 Installing system dependencies..."
sudo apt update
sudo apt install -y ffmpeg nodejs npm curl

# Install pnpm if not present
if ! command -v pnpm &> /dev/null; then
    echo "📦 Installing pnpm..."
    curl -fsSL https://get.pnpm.io/install.sh | sh -
    source ~/.bashrc
fi

# Setup environment variables
echo "🔧 Setting up environment..."
./setup-env-ubuntu.sh

# Install dependencies
echo "📦 Installing project dependencies..."
pnpm install

# Build the application
echo "🔨 Building application..."
pnpm run build

# Create systemd service (optional)
echo "⚙️  Setting up systemd service..."
sudo tee /etc/systemd/system/video-processing.service > /dev/null << EOF
[Unit]
Description=Video Processing Service
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$(pwd)
ExecStart=$(which node) .output/server/index.mjs
Restart=always
RestartSec=10
Environment=NODE_ENV=production
EnvironmentFile=$(pwd)/.env

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd and enable service
sudo systemctl daemon-reload
sudo systemctl enable video-processing.service

echo "✅ Deployment complete!"
echo ""
echo "🎯 Next steps:"
echo "1. Set your API keys in .env file or environment variables"
echo "2. Start the service: sudo systemctl start video-processing"
echo "3. Check status: sudo systemctl status video-processing"
echo "4. View logs: journalctl -u video-processing -f"