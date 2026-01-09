#!/bin/bash
# GPU Video Processing Docker Build Script
# Run this from the vast.ai server

# Navigate to the video-processing directory
cd /workspace/video-processing 2>/dev/null || cd ~/video-processing 2>/dev/null || {
    echo "❌ Could not find video-processing directory"
    exit 1
}

echo "🔨 Building GPU Video Processing Docker Image..."

# Build the Docker image
docker build -f Dockerfile.gpu -t ffmpeg-gpu-service .

if [ $? -eq 0 ]; then
    echo "✅ Docker image built successfully!"
    
    # Stop existing container if running
    docker stop ffmpeg-service 2>/dev/null
    docker rm ffmpeg-service 2>/dev/null
    
    echo "🚀 Starting new container..."
    docker run -d \
        --name ffmpeg-service \
        --gpus all \
        -p 3000:3000 \
        -e USE_GPU=true \
        --restart unless-stopped \
        ffmpeg-gpu-service
    
    echo "✅ Container started! Checking health..."
    sleep 3
    curl -s http://localhost:3000/health || echo "⚠️ Health check failed - container may need more time"
else
    echo "❌ Docker build failed!"
    exit 1
fi
