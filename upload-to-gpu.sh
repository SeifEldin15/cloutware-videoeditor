#!/bin/bash
# Minimal upload script for GPU Docker service
# Only uploads files needed for Docker build

REMOTE="root@ssh7.vast.ai"
PORT="10885"
DEST="/workspace/video-processing"

echo "📦 Uploading only required files for Docker build..."

# Create destination directory
ssh -p $PORT $REMOTE "mkdir -p $DEST/server/utils $DEST/public/fonts"

# Upload Docker files
scp -P $PORT Dockerfile.gpu $REMOTE:$DEST/
scp -P $PORT gpu-server.ts $REMOTE:$DEST/
scp -P $PORT gpu-package.json $REMOTE:$DEST/
scp -P $PORT tsconfig.json $REMOTE:$DEST/
scp -P $PORT docker-ffmpeg-service/ffmpeg-linux.ts $REMOTE:$DEST/
scp -P $PORT rebuild-docker.sh $REMOTE:$DEST/

# Upload server utils (excluding node_modules)
scp -P $PORT server/utils/*.ts $REMOTE:$DEST/server/utils/

# Upload fonts
scp -P $PORT -r public/fonts/* $REMOTE:$DEST/public/fonts/

echo "✅ Upload complete! Now SSH in and run: cd $DEST && ./rebuild-docker.sh"
