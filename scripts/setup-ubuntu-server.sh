#!/bin/bash

# Ubuntu Server Deployment Script for Video Processing Service
# Run this script on your Ubuntu server to set up the environment

set -e

echo "🚀 Setting up Video Processing Service on Ubuntu Server..."

# Update system packages
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js 22.x
echo "🔧 Installing Node.js 22.x..."
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install pnpm
echo "📦 Installing pnpm..."
curl -fsSL https://get.pnpm.io/install.sh | sh -
source ~/.bashrc
export PATH="$HOME/.local/share/pnpm:$PATH"

# Install PM2 globally
echo "🔄 Installing PM2..."
sudo npm install -g pm2

# Install FFmpeg
echo "🎬 Installing FFmpeg..."
sudo apt-get install -y ffmpeg

# Install Docker (optional)
echo "🐳 Installing Docker..."
sudo apt-get install -y apt-transport-https ca-certificates curl gnupg lsb-release
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Add user to docker group
sudo usermod -aG docker $USER

# Install Nginx
echo "🌐 Installing Nginx..."
sudo apt-get install -y nginx

# Create application directory
echo "📁 Creating application directory..."
sudo mkdir -p /opt/video-processing
sudo chown $USER:$USER /opt/video-processing

# Create log directory
echo "📋 Creating log directory..."
sudo mkdir -p /var/log/video-processing
sudo chown $USER:$USER /var/log/video-processing

# Create uploads and temp directories
echo "📂 Creating upload and temp directories..."
mkdir -p /opt/video-processing/uploads
mkdir -p /opt/video-processing/temp

# Setup PM2 startup
echo "🔧 Setting up PM2 startup..."
pm2 startup
echo "⚠️  Please run the command shown above to setup PM2 startup"

# Create systemd service (alternative to PM2)
echo "⚙️ Creating systemd service..."
sudo tee /etc/systemd/system/video-processing.service > /dev/null <<EOF
[Unit]
Description=Video Processing Service
Documentation=https://nuxtjs.org
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=/opt/video-processing/current
ExecStart=/usr/bin/node .output/server/index.mjs
Restart=on-failure
RestartSec=5s
StandardOutput=journal
StandardError=journal
SyslogIdentifier=video-processing
KillMode=mixed
KillSignal=SIGINT
TimeoutStopSec=5
Environment=NODE_ENV=production
Environment=PORT=3000
Environment=NUXT_HOST=0.0.0.0

[Install]
WantedBy=multi-user.target
EOF

# Create Nginx configuration
echo "🌐 Configuring Nginx..."
sudo tee /etc/nginx/sites-available/video-processing > /dev/null <<EOF
server {
    listen 80;
    server_name _;
    
    client_max_body_size 500M;
    client_body_timeout 300s;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }
}
EOF

# Enable Nginx site
sudo ln -sf /etc/nginx/sites-available/video-processing /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Create firewall rules
echo "🔒 Configuring firewall..."
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw --force enable

# Create deployment script
echo "📝 Creating deployment script..."
tee /opt/video-processing/deploy.sh > /dev/null <<EOF
#!/bin/bash
set -e

echo "🚀 Deploying Video Processing Service..."

# Navigate to deployment directory
cd /opt/video-processing

# Backup current deployment
if [ -d "current" ]; then
    mv current backup-\$(date +%Y%m%d-%H%M%S) || true
fi

# Clone or pull latest code
if [ ! -d "repo" ]; then
    git clone YOUR_REPOSITORY_URL repo
else
    cd repo
    git pull origin main
    cd ..
fi

# Create new deployment
cp -r repo current
cd current

# Install dependencies
pnpm install --frozen-lockfile

# Build application
pnpm run build

# Restart service
pm2 restart video-processing || pm2 start ecosystem.config.js

# Clean up old backups (keep last 3)
cd /opt/video-processing
ls -t backup-* | tail -n +4 | xargs rm -rf || true

echo "✅ Deployment completed successfully!"
EOF

chmod +x /opt/video-processing/deploy.sh

echo "✅ Ubuntu server setup completed!"
echo ""
echo "📋 Next steps:"
echo "1. Configure your repository URL in /opt/video-processing/deploy.sh"
echo "2. Set up GitHub secrets for CI/CD:"
echo "   - HOST: Your server IP address"
echo "   - USERNAME: Your server username"
echo "   - PRIVATE_KEY: Your SSH private key"
echo "   - PORT: SSH port (default: 22)"
echo "3. Run PM2 startup command shown above"
echo "4. Deploy your application: /opt/video-processing/deploy.sh"
echo "5. Start Nginx: sudo systemctl start nginx"
echo "6. Enable services: sudo systemctl enable nginx"
echo ""
echo "🔗 Your application will be available at: http://YOUR_SERVER_IP"
