$ErrorActionPreference = "Stop"

# Configuration - UPDATE THESE FOR YOUR VAST.AI INSTANCE
$VastHost = "ssh7.vast.ai"
$VastPort = "10885"
$VastUser = "root"
$ImageName = "gpu-video-processor"
$ContainerName = "ffmpeg-gpu"

Write-Host "Deploying GPU Video Processing Service to Vast.ai..."
Write-Host ""

# Create a temporary directory for packaging
$TempDir = Join-Path $env:TEMP "gpu-deploy-$(Get-Random)"
New-Item -ItemType Directory -Force -Path $TempDir | Out-Null

Write-Host "Packaging files..."

# Copy Dockerfile
Copy-Item "Dockerfile.gpu" -Destination "$TempDir/Dockerfile"

# Copy package files
Copy-Item "gpu-package.json" -Destination "$TempDir/gpu-package.json"
Copy-Item "tsconfig.json" -Destination "$TempDir/tsconfig.json"

# Copy server entrypoint
Copy-Item "gpu-server.ts" -Destination "$TempDir/gpu-server.ts"

# Copy ffmpeg wrapper
Copy-Item "ffmpeg-linux.ts" -Destination "$TempDir/ffmpeg-linux.ts"

# Copy Server Utils
New-Item -ItemType Directory -Force -Path "$TempDir/server/utils" | Out-Null
Copy-Item "server/utils/*" -Destination "$TempDir/server/utils" -Recurse

# Copy Public (Fonts)
New-Item -ItemType Directory -Force -Path "$TempDir/public/fonts" | Out-Null
Copy-Item "public/fonts/*" -Destination "$TempDir/public/fonts" -Recurse

# Compress to tar.gz
$TarFile = "gpu-service.tar.gz"
Write-Host "Compressing to $TarFile..."
Push-Location $TempDir
tar -czf $TarFile *
Pop-Location
Move-Item "$TempDir/$TarFile" . -Force

# Upload to Vast.ai
Write-Host "Uploading to Vast.ai ${VastHost}:${VastPort}..."
scp -P $VastPort -o StrictHostKeyChecking=no $TarFile "${VastUser}@${VastHost}:/root/${TarFile}"

# Remote deployment script
Write-Host "Building Docker image on remote server..."

$RemoteScript = @"
set -e

echo "Extracting files..."
mkdir -p /root/gpu-service
cd /root/gpu-service
tar -xzf /root/gpu-service.tar.gz
rm -f /root/gpu-service.tar.gz

echo "Building Docker image with GPU support..."
docker build -t gpu-video-processor -f Dockerfile .

echo "Stopping old container if exists..."
docker stop ffmpeg-gpu 2>/dev/null || true
docker rm ffmpeg-gpu 2>/dev/null || true

echo "Starting container with GPU..."
docker run -d \
  --name ffmpeg-gpu \
  --gpus all \
  -p 3000:3000 \
  -e USE_GPU=true \
  -e NVIDIA_VISIBLE_DEVICES=all \
  --restart unless-stopped \
  gpu-video-processor

echo ""
echo "Deployment complete!"
echo "Container status:"
docker ps | grep ffmpeg-gpu

echo ""
echo "Container logs:"
sleep 3
docker logs ffmpeg-gpu
"@

# Encode script to Base64
$ScriptBytes = [System.Text.Encoding]::UTF8.GetBytes($RemoteScript.Replace("`r`n", "`n"))
$Base64Script = [System.Convert]::ToBase64String($ScriptBytes)

# Execute via base64 decode
$Command = "echo '$Base64Script' | base64 -d | bash"
ssh -p $VastPort -o StrictHostKeyChecking=no "${VastUser}@${VastHost}" $Command

# Cleanup Local
Remove-Item $TempDir -Recurse -Force
Remove-Item $TarFile -Force

Write-Host ""
Write-Host "Done! GPU service is running on port 3000"
Write-Host ""
Write-Host "Update your SSH tunnel command to:"
Write-Host "   ssh -p $VastPort -N -L 8085:localhost:3000 ${VastUser}@${VastHost}"
