# Ubuntu Environment Setup Guide

This guide explains how to properly set up environment variables for the video processing service on Ubuntu.

## Quick Setup

1. **Run the setup script:**
   ```bash
   chmod +x setup-env-ubuntu.sh
   ./setup-env-ubuntu.sh
   ```

2. **Set your API keys securely:**
   ```bash
   # Method A: Export environment variables
   export ASSEMBLYAI_API_KEY="your_actual_assemblyai_api_key"
   export ELEVENLABS_API_KEY="your_actual_elevenlabs_api_key"
   
   # Method B: Create .env.local file (recommended for production)
   echo "ASSEMBLYAI_API_KEY=your_actual_assemblyai_api_key" > .env.local
   echo "ELEVENLABS_API_KEY=your_actual_elevenlabs_api_key" >> .env.local
   chmod 600 .env.local
   ```

## Environment Variables

### Required API Keys
- `ASSEMBLYAI_API_KEY`: Your AssemblyAI API key for speech-to-text
- `ELEVENLABS_API_KEY`: Your ElevenLabs API key for text-to-speech

### Ubuntu-Specific Variables
- `UBUNTU_CODENAME`: Automatically detected Ubuntu version codename
- `FFMPEG_PATH`: Path to system FFmpeg binary (`/usr/bin/ffmpeg`)
- `FFPROBE_PATH`: Path to system FFprobe binary (`/usr/bin/ffprobe`)

### Server Configuration
- `NODE_ENV`: Environment mode (`production`, `development`)
- `PORT`: Server port (default: 3000)
- `HOST`: Server host (default: 0.0.0.0)

## Deployment Strategies

### 1. Systemd Service (Recommended)
The deployment script automatically creates a systemd service that:
- Loads environment variables from `.env` file
- Automatically restarts on failure
- Starts on system boot

```bash
# Deploy with systemd service
chmod +x deploy-ubuntu.sh
./deploy-ubuntu.sh
```

### 2. Docker Deployment
```bash
# Create Dockerfile with environment support
docker build -t video-processing .
docker run -d \
  --name video-processing \
  --env-file .env.local \
  -p 3000:3000 \
  video-processing
```

### 3. PM2 Process Manager
```bash
# Install PM2
npm install -g pm2

# Create ecosystem file
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'video-processing',
    script: '.output/server/index.mjs',
    env_file: '.env',
    env: {
      NODE_ENV: 'production',
      UBUNTU_CODENAME: process.env.UBUNTU_CODENAME
    }
  }]
}
EOF

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## Security Best Practices

1. **Never commit API keys to version control**
   ```bash
   # Add to .gitignore
   echo ".env.local" >> .gitignore
   echo ".env.production" >> .gitignore
   ```

2. **Use secure file permissions**
   ```bash
   chmod 600 .env*
   ```

3. **Use environment-specific files**
   - `.env` - Default values and non-sensitive config
   - `.env.local` - Local development secrets
   - `.env.production` - Production secrets

## Troubleshooting

### FFmpeg Issues
```bash
# Verify FFmpeg installation
/usr/bin/ffmpeg -version

# Install if missing
sudo apt update && sudo apt install ffmpeg
```

### Permission Issues
```bash
# Fix file permissions
chmod 600 .env*
chown $USER:$USER .env*
```

### Service Logs
```bash
# View systemd service logs
journalctl -u video-processing -f

# Check service status
sudo systemctl status video-processing
```

## CI/CD Integration

For automated deployments, set environment variables in your CI/CD platform:

### GitHub Actions
```yaml
env:
  ASSEMBLYAI_API_KEY: ${{ secrets.ASSEMBLYAI_API_KEY }}
  ELEVENLABS_API_KEY: ${{ secrets.ELEVENLABS_API_KEY }}
```

### Environment Variable Injection
```bash
# In deployment script
envsubst < .env.template > .env
```