# PowerShell script to set up CI/CD deployment environment
# Run this on your Windows development machine to prepare deployment files

param(
    [string]$ServerIP,
    [string]$Username,
    [string]$PrivateKeyPath,
    [int]$Port = 22
)

Write-Host "🚀 Setting up CI/CD deployment for Video Processing Service..." -ForegroundColor Green

# Check if required parameters are provided
if (-not $ServerIP) {
    $ServerIP = Read-Host "Enter your Ubuntu server IP address"
}

if (-not $Username) {
    $Username = Read-Host "Enter your server username"
}

if (-not $PrivateKeyPath) {
    $PrivateKeyPath = Read-Host "Enter path to your SSH private key"
}

# Validate private key file exists
if (-not (Test-Path $PrivateKeyPath)) {
    Write-Error "Private key file not found at: $PrivateKeyPath"
    exit 1
}

Write-Host "📋 Configuration:" -ForegroundColor Yellow
Write-Host "Server IP: $ServerIP"
Write-Host "Username: $Username"
Write-Host "Private Key: $PrivateKeyPath"
Write-Host "Port: $Port"

# Create .env file for deployment
$envContent = @"
# Server Configuration
SERVER_HOST=$ServerIP
SSH_USER=$Username
SSH_PORT=$Port

# Application Configuration
NODE_ENV=production
PORT=3000
NUXT_HOST=0.0.0.0
NUXT_PORT=3000

# Add your application-specific environment variables here
"@

Write-Host "📝 Creating deployment environment file..." -ForegroundColor Blue
$envContent | Out-File -FilePath ".env.deploy" -Encoding UTF8

# Test SSH connection
Write-Host "🔗 Testing SSH connection..." -ForegroundColor Blue
try {
    $testCommand = "ssh -i `"$PrivateKeyPath`" -p $Port $Username@$ServerIP -o ConnectTimeout=10 'echo Connection successful'"
    Invoke-Expression $testCommand
    Write-Host "✅ SSH connection successful!" -ForegroundColor Green
} catch {
    Write-Warning "⚠️ SSH connection test failed. Please verify your credentials."
    Write-Host "Manual test command: ssh -i `"$PrivateKeyPath`" -p $Port $Username@$ServerIP"
}

# Create GitHub secrets template
$secretsTemplate = @"
# GitHub Repository Secrets Configuration
# Add these secrets to your GitHub repository settings

HOST=$ServerIP
USERNAME=$Username
PORT=$Port
PRIVATE_KEY=<content of your private key file>

# To add the private key content:
# 1. Open your private key file: $PrivateKeyPath
# 2. Copy the entire content including -----BEGIN and -----END lines
# 3. Add it as the PRIVATE_KEY secret in GitHub
"@

Write-Host "🔑 Creating GitHub secrets template..." -ForegroundColor Blue
$secretsTemplate | Out-File -FilePath "github-secrets-template.txt" -Encoding UTF8

# Create deployment checklist
$checklist = @"
# Deployment Checklist for Video Processing Service

## ✅ Pre-deployment Setup
- [ ] Ubuntu server is accessible via SSH
- [ ] Server has Node.js 22+ installed
- [ ] Server has FFmpeg installed
- [ ] Server has PM2 installed globally
- [ ] Server has Nginx installed
- [ ] Firewall is configured (ports 22, 80, 443)

## ✅ GitHub Repository Setup
- [ ] Repository secrets configured:
  - [ ] HOST: $ServerIP
  - [ ] USERNAME: $Username
  - [ ] PORT: $Port
  - [ ] PRIVATE_KEY: (content from $PrivateKeyPath)

## ✅ Server Directory Setup
- [ ] /opt/video-processing directory created
- [ ] Proper permissions set for deployment user
- [ ] Log directory created: /var/log/video-processing

## ✅ First Deployment
- [ ] Push code to main branch to trigger CI/CD
- [ ] Monitor GitHub Actions for successful deployment
- [ ] Verify application is running: http://$ServerIP
- [ ] Check health endpoint: http://$ServerIP/api/health

## ✅ Manual Deployment (Alternative)
- [ ] Clone repository on server
- [ ] Run setup script: ./scripts/setup-ubuntu-server.sh
- [ ] Run deployment script: ./scripts/deploy-manual.sh

## ✅ Monitoring Setup
- [ ] PM2 monitoring configured
- [ ] Log rotation configured
- [ ] Health checks working
- [ ] Nginx reverse proxy functional

## 🔧 Useful Commands
# Check application status
pm2 status video-processing

# View logs
pm2 logs video-processing
tail -f /var/log/video-processing/out.log

# Restart application
pm2 restart video-processing

# Check Nginx status
sudo systemctl status nginx

# Manual deployment
./scripts/deploy-manual.sh

# Health check
curl http://$ServerIP/api/health
"@

Write-Host "📋 Creating deployment checklist..." -ForegroundColor Blue
$checklist | Out-File -FilePath "deployment-checklist.md" -Encoding UTF8

# Create Windows batch file for remote deployment
$batchContent = @"
@echo off
echo 🚀 Deploying Video Processing Service...

REM Set your server details
set SERVER_IP=$ServerIP
set USERNAME=$Username
set PRIVATE_KEY_PATH=$PrivateKeyPath
set PORT=$Port

echo 📦 Building application locally...
call pnpm run build
if errorlevel 1 (
    echo ❌ Build failed!
    exit /b 1
)

echo 📤 Creating deployment package...
if exist deployment rd /s /q deployment
mkdir deployment
xcopy /s /e /y .output deployment\.output\
copy package.json deployment\
copy pnpm-lock.yaml deployment\
if exist ecosystem.config.js copy ecosystem.config.js deployment\

echo 🗜️ Creating archive...
powershell "Compress-Archive -Path deployment\* -DestinationPath deployment.zip -Force"

echo 📡 Uploading to server...
scp -i "%PRIVATE_KEY_PATH%" -P %PORT% deployment.zip %USERNAME%@%SERVER_IP%:/tmp/

echo 🔧 Deploying on server...
ssh -i "%PRIVATE_KEY_PATH%" -p %PORT% %USERNAME%@%SERVER_IP% "cd /opt/video-processing && if [ -d current ]; then mv current backup-$(date +%%Y%%m%%d-%%H%%M%%S); fi && mkdir -p current && cd current && unzip -o /tmp/deployment.zip && pnpm install --prod --frozen-lockfile && pm2 restart video-processing || pm2 start ecosystem.config.js && rm /tmp/deployment.zip"

echo ✅ Deployment completed!
echo 🔗 Application available at: http://%SERVER_IP%

pause
"@

Write-Host "🪟 Creating Windows deployment script..." -ForegroundColor Blue
$batchContent | Out-File -FilePath "deploy-windows.bat" -Encoding UTF8

Write-Host "`n✅ Setup completed! Files created:" -ForegroundColor Green
Write-Host "📄 .env.deploy - Environment configuration"
Write-Host "🔑 github-secrets-template.txt - GitHub secrets guide"
Write-Host "📋 deployment-checklist.md - Deployment checklist"
Write-Host "🪟 deploy-windows.bat - Windows deployment script"

Write-Host "`n📚 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Review and configure GitHub secrets using github-secrets-template.txt"
Write-Host "2. Run server setup script on your Ubuntu server"
Write-Host "3. Follow the deployment checklist"
Write-Host "4. Push to main branch to trigger CI/CD"

Write-Host "`n🔗 Application will be available at: http://$ServerIP" -ForegroundColor Cyan
