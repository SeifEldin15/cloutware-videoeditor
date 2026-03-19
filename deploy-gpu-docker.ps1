$ErrorActionPreference = "Stop"

# Configuration - UPDATE THESE FOR YOUR VAST.AI INSTANCE
$VastHost = "70.69.192.6"
$VastPort = "28966"
$VastUser = "root"
$SshKey = "$env:USERPROFILE\.ssh\id_ed25519"
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
scp -P $VastPort -i $SshKey -o StrictHostKeyChecking=no $TarFile "${VastUser}@${VastHost}:/root/${TarFile}"

# Remote deployment script
Write-Host "Building Docker image on remote server..."

$RemoteScript = @"
set -e

echo "Extracting files..."
mkdir -p /root/gpu-service
cd /root/gpu-service
tar -xzf /root/gpu-service.tar.gz
rm -f /root/gpu-service.tar.gz

echo "Setting up file structure..."
# Copy server.ts from gpu-server.ts
cp gpu-server.ts server.ts

# Move utils from server/utils to ./utils (matching import paths)
mkdir -p utils
cp -r server/utils/* utils/

# Overwrite ffmpeg.ts with linux version
cp ffmpeg-linux.ts utils/ffmpeg.ts

echo "Installing Node.js if needed..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
    apt-get install -y nodejs
fi

echo "Installing tsx globally..."
npm install -g tsx

echo "Installing dependencies..."
cp gpu-package.json package.json
npm install

echo "Stopping old service if running..."
pkill -f 'tsx server.ts' 2>/dev/null || true
sleep 2

echo "Starting GPU Video Processing Service..."
export PORT=3000
export USE_GPU=true
nohup tsx server.ts > /var/log/gpu-service.log 2>&1 &

sleep 5

echo ""
echo "Deployment complete!"
echo "Service status:"
ps aux | grep -E 'tsx.*server' | grep -v grep || echo "Service may still be starting..."

echo ""
echo "Recent logs:"
cat /var/log/gpu-service.log | tail -20
"@

# Encode script to Base64
$ScriptBytes = [System.Text.Encoding]::UTF8.GetBytes($RemoteScript.Replace("`r`n", "`n"))
$Base64Script = [System.Convert]::ToBase64String($ScriptBytes)

# Execute via base64 decode
$Command = "echo '$Base64Script' | base64 -d | bash"
ssh -p $VastPort -i $SshKey -o StrictHostKeyChecking=no "${VastUser}@${VastHost}" $Command

# Cleanup Local
Remove-Item $TempDir -Recurse -Force
Remove-Item $TarFile -Force

Write-Host ""
Write-Host "Done! GPU service is running on port 3000"
Write-Host ""
Write-Host "Update your SSH tunnel command to:"
Write-Host "   ssh -p $VastPort -i $SshKey -N -L 8080:localhost:3000 ${VastUser}@${VastHost}"
