#!/bin/bash

# Ubuntu Environment Setup Script for Video Processing Service
# This script sets up environment variables for deployment

set -e

echo "🚀 Setting up environment variables for Ubuntu deployment..."

# Create the .env file
cat > .env << 'EOF'
# API Keys
ASSEMBLYAI_API_KEY=${ASSEMBLYAI_API_KEY:-your_assemblyai_api_key}
ELEVENLABS_API_KEY=${ELEVENLABS_API_KEY:-your_elevenlabs_api_key}

# Ubuntu specific environment
UBUNTU_CODENAME=${UBUNTU_CODENAME:-$(lsb_release -cs)}
NODE_ENV=${NODE_ENV:-production}

# Server configuration
PORT=${PORT:-3000}
HOST=${HOST:-0.0.0.0}

# FFmpeg paths (Ubuntu specific)
FFMPEG_PATH=/usr/bin/ffmpeg
FFPROBE_PATH=/usr/bin/ffprobe
EOF

echo "✅ Environment file created successfully!"

# Set proper permissions
chmod 600 .env
echo "🔒 Set secure permissions for .env file"

# Verify environment
echo "📋 Current environment variables:"
echo "UBUNTU_CODENAME: $(lsb_release -cs 2>/dev/null || echo 'Not detected')"
echo "NODE_ENV: ${NODE_ENV:-development}"
echo "FFmpeg version: $(/usr/bin/ffmpeg -version 2>/dev/null | head -n1 || echo 'FFmpeg not found')"

echo "🎉 Environment setup complete!"
echo ""
echo "⚠️  IMPORTANT: Make sure to set these environment variables before running:"
echo "   export ASSEMBLYAI_API_KEY='your_actual_assemblyai_api_key'"
echo "   export ELEVENLABS_API_KEY='your_actual_elevenlabs_api_key'"
echo ""
echo "Or create a secure .env.local file with your actual API keys."