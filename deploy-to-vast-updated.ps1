$ErrorActionPreference = "Stop"

# Configuration
$VastHost = "ssh7.vast.ai"
$VastPort = "10885"
$VastUser = "root"
$RemoteDir = "/root/ffmpeg-service"

# Create a temporary directory for packaging
$TempDir = Join-Path $env:TEMP "ffmpeg-deploy-$(Get-Random)"
New-Item -ItemType Directory -Force -Path $TempDir | Out-Null

Write-Host "Packaging files..."

# Copy Service Code
New-Item -ItemType Directory -Force -Path "$TempDir/docker-ffmpeg-service" | Out-Null
Copy-Item "docker-ffmpeg-service/*" -Destination "$TempDir/docker-ffmpeg-service" -Recurse

# Copy Server Utils
New-Item -ItemType Directory -Force -Path "$TempDir/server/utils" | Out-Null
Copy-Item "server/utils/*" -Destination "$TempDir/server/utils" -Recurse

# Copy Public (Fonts)
New-Item -ItemType Directory -Force -Path "$TempDir/public" | Out-Null
Copy-Item "public/*" -Destination "$TempDir/public" -Recurse

# Compress to tar.gz
$TarFile = "ffmpeg-service.tar.gz"
Write-Host ("Compressing to {0}..." -f $TarFile)
Push-Location $TempDir
tar -czf "$TarFile" *
Pop-Location
Move-Item "$TempDir/$TarFile" . -Force

# Upload to Vast.ai
Write-Host ("Uploading to Vast.ai {0}:{1}..." -f $VastHost, $VastPort)
scp -P $VastPort -o StrictHostKeyChecking=no $TarFile ${VastUser}@${VastHost}:/root/${TarFile}

# Prepare Remote Script (Using Base64 to avoid line-ending issues)
Write-Host "Deploying on remote server (Direct Node.js)..."

$RemoteScriptContent = @"
set -e
export DEBIAN_FRONTEND=noninteractive

# Update and Install Dependencies (Node.js + FFmpeg)
echo "Installing Dependencies..."
apt-get update
# Install curl, unzip, fonts, and FFmpeg 6 or fallback to default
apt-get install -y curl unzip fonts-liberation fontconfig

# Check for ffmpeg and install if missing
if ! command -v ffmpeg &> /dev/null; then
    apt-get install -y ffmpeg
fi

# Install Node.js 22 if not present
if ! command -v node &> /dev/null; then
    echo "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
    apt-get install -y nodejs
fi

# Prepare Directory Structure
echo "Setting up application..."
mkdir -p $RemoteDir/utils
mkdir -p $RemoteDir/public

# Extract Uploaded Files to temporary location
mkdir -p /root/temp_extract
tar -xzf /root/${TarFile} -C /root/temp_extract

# Move files to correct service structure
# 1. Base files from docker-ffmpeg-service
cp -rf /root/temp_extract/docker-ffmpeg-service/* $RemoteDir/

# 2. Utils from server/utils
cp -rf /root/temp_extract/server/utils/* $RemoteDir/utils/

# 3. Public fonts
cp -rf /root/temp_extract/public/* $RemoteDir/public/

# 4. Overwrite ffmpeg wrapper with Linux version
cp -f /root/temp_extract/docker-ffmpeg-service/ffmpeg-linux.ts $RemoteDir/utils/ffmpeg.ts

# 5. Cleanup unused heavy files (same as Dockerfile logic)
rm -f $RemoteDir/utils/ocr-*.ts \
      $RemoteDir/utils/text-detection*.ts \
      $RemoteDir/utils/video-text-*.ts \
      $RemoteDir/utils/elevenlabs.ts \
      $RemoteDir/utils/spell-checker.ts \
      $RemoteDir/utils/transcription.ts \
      $RemoteDir/utils/text-replacement-processor.ts

# Cleanup temp
rm -rf /root/temp_extract
rm -f /root/${TarFile}

# Setup and Start
cd $RemoteDir
echo "Installing NPM packages..."
npm install
npm install -g pm2 tsx

echo "Starting Service..."
pm2 delete ffmpeg-service 2>/dev/null || true
# Start with tsx direct execution
pm2 start "tsx server.ts" --name ffmpeg-service

echo "✅ Deployment complete. Service running on port 8080."
pm2 status
"@

# Encode script to Base64
$ScriptBytes = [System.Text.Encoding]::UTF8.GetBytes($RemoteScriptContent.Replace("`r`n", "`n"))
$Base64Script = [System.Convert]::ToBase64String($ScriptBytes)

# Execute via base64 decode
$Command = "echo '$Base64Script' | base64 -d | bash"

ssh -p $VastPort -o StrictHostKeyChecking=no ${VastUser}@${VastHost} $Command

# Cleanup Local
Remove-Item $TempDir -Recurse -Force
Remove-Item $TarFile -Force

Write-Host "Done! Service is deployed."
