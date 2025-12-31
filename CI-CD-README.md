# CI/CD Pipeline for Ubuntu Server - Video Processing Service

This directory contains all the necessary files and scripts to set up a complete CI/CD pipeline for deploying the video processing service to an Ubuntu server.

## 🏗️ Architecture Overview

The CI/CD setup includes:
- **GitHub Actions** for automated testing and deployment
- **PM2** for process management
- **Nginx** as reverse proxy
- **Docker** support (optional)
- **Monitoring and logging** setup

## 📁 Files Structure

```
├── .github/workflows/deploy.yml    # GitHub Actions CI/CD pipeline
├── ecosystem.config.js             # PM2 configuration
├── Dockerfile                      # Docker containerization
├── docker-compose.yml              # Docker Compose setup
├── nginx.conf                      # Nginx configuration
├── healthcheck.js                  # Docker health check
└── scripts/
    ├── setup-ubuntu-server.sh      # Server setup script
    └── deploy-manual.sh             # Manual deployment script
```

## 🚀 Quick Start

### 1. Server Setup

Run this on your Ubuntu server:
```bash
curl -sSL https://raw.githubusercontent.com/SeifEldin15/cloutware-videoeditor/main/scripts/setup-ubuntu-server.sh | bash
```

Or download and run manually:
```bash
chmod +x scripts/setup-ubuntu-server.sh
./scripts/setup-ubuntu-server.sh
```

### 2. GitHub Actions Setup

Add these secrets to your GitHub repository:
- `HOST`: Your server IP address
- `USERNAME`: SSH username
- `PRIVATE_KEY`: SSH private key content
- `PORT`: SSH port (usually 22)

### 3. Manual Deployment

If you prefer manual deployment:
```bash
chmod +x scripts/deploy-manual.sh
./scripts/deploy-manual.sh
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in your deployment directory:
```env
NODE_ENV=production
PORT=3000
NUXT_HOST=0.0.0.0
NUXT_PORT=3000
# Add other environment variables as needed
```

### PM2 Configuration

The `ecosystem.config.js` file is configured for:
- Cluster mode with maximum instances
- Auto-restart on crashes
- Memory limit management
- Log rotation
- Health monitoring

### Nginx Configuration

Features included:
- Reverse proxy to Node.js app
- File upload support (500MB max)
- Rate limiting
- SSL-ready configuration (commented out)
- Static file serving for uploads

## 📊 Monitoring

### PM2 Monitoring
```bash
pm2 status           # Check application status
pm2 logs             # View logs
pm2 monit            # Real-time monitoring
pm2 restart all      # Restart all processes
```

### System Monitoring
```bash
# Check Nginx status
sudo systemctl status nginx

# Check application logs
tail -f /var/log/video-processing/out.log

# Monitor system resources
htop
```

## 🐳 Docker Deployment (Alternative)

### Build and Run with Docker
```bash
# Build image
docker build -t video-processing .

# Run with Docker Compose
docker-compose up -d

# Check status
docker-compose ps
```

### Docker Health Checks
The container includes a health check script that monitors the application status.

## 🔒 Security Considerations

### Firewall Rules
The setup script configures UFW with:
- Port 22 (SSH)
- Port 80 (HTTP)
- Port 443 (HTTPS)

### SSL Certificate Setup
For production, uncomment and configure SSL in `nginx.conf`:
1. Obtain SSL certificates (Let's Encrypt recommended)
2. Update certificate paths
3. Enable HTTPS server block

### Rate Limiting
Nginx is configured with rate limiting:
- 10 requests per second baseline
- Burst of 20 requests allowed

## 🔄 Deployment Process

### Automated (GitHub Actions)
1. Code pushed to `main` branch
2. Tests run on Ubuntu runner
3. Application built and packaged
4. Deployed to server via SSH
5. PM2 restarts application
6. Health check performed

### Manual Process
1. Clone repository
2. Install dependencies
3. Build application
4. Deploy to `/opt/video-processing/current`
5. Restart services

## 🎯 Performance Optimization

### Node.js Optimization
- Cluster mode for multi-core utilization
- Memory limit management
- Graceful shutdown handling

### Nginx Optimization
- HTTP/2 support ready
- Static file caching
- Gzip compression (can be added)

### FFmpeg Considerations
- Ensure sufficient disk space for video processing
- Monitor CPU and memory usage during video operations
- Consider queue system for heavy processing

## 🔍 Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   sudo lsof -i :3000
   sudo kill -9 PID
   ```

2. **PM2 Not Starting**
   ```bash
   pm2 kill
   pm2 start ecosystem.config.js
   ```

3. **Nginx Configuration Errors**
   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

4. **FFmpeg Not Found**
   ```bash
   sudo apt-get install ffmpeg
   which ffmpeg
   ```

### Log Locations
- Application logs: `/var/log/video-processing/`
- Nginx logs: `/var/log/nginx/`
- PM2 logs: `~/.pm2/logs/`

## 🚦 Health Checks

The system includes multiple health check mechanisms:
- Docker health check script
- PM2 process monitoring
- Nginx upstream health checks
- GitHub Actions deployment verification

## 📈 Scaling Considerations

### Horizontal Scaling
- Use load balancer (HAProxy/Nginx)
- Database clustering if needed
- Shared file storage for uploads

### Vertical Scaling
- Adjust PM2 instance count
- Increase memory limits
- Optimize FFmpeg usage

## 🔧 Maintenance

### Regular Tasks
```bash
# Update system packages
sudo apt update && sudo apt upgrade

# Clean up old deployments
ls -t /opt/video-processing/backup-* | tail -n +4 | xargs rm -rf

# Rotate logs
pm2 flush

# Monitor disk space
df -h
```

### Backup Strategy
- Database backups (if applicable)
- Configuration files backup
- Upload files backup to cloud storage

## 📞 Support

For issues related to:
- **CI/CD Pipeline**: Check GitHub Actions logs
- **Application**: Check PM2 logs and status
- **Server Issues**: Check system logs and Nginx status
- **FFmpeg**: Verify installation and permissions

Remember to test deployments in a staging environment before production!
