# Simple CI/CD Setup Guide

This guide sets up a simple CI/CD pipeline that automatically deploys your video processing application to server `18.144.88.135` whenever you push code to the main branch.

## 🎯 What This Setup Does

1. **Connects** to your server (18.144.88.135)
2. **Clones** the repository (https://github.com/SeifEldin15/cloutware-videoeditor)
3. **Installs** dependencies with `npm install`
4. **Starts** the server with `npm run dev`

## 📋 Prerequisites

### Server Requirements
- Ubuntu server at IP: `18.144.88.135`
- SSH access to the server
- Node.js 18+ installed
- PM2 process manager installed

## 🚀 Quick Setup

### Step 1: Prepare Your Server

SSH into your server and run the existing setup script:

```bash
ssh your-username@18.144.88.135
cd /tmp
wget https://raw.githubusercontent.com/SeifEldin15/cloutware-videoeditor/main/scripts/setup-ubuntu-server.sh
chmod +x setup-ubuntu-server.sh
./setup-ubuntu-server.sh
```

### Step 2: Configure GitHub Secrets

In your GitHub repository, go to **Settings** → **Secrets and variables** → **Actions** and add these secrets:

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `SSH_USERNAME` | SSH username for your server | `ubuntu` or `root` |
| `SSH_PRIVATE_KEY` | Your SSH private key content (NOT the public key) | Contents of your private key file |
| `SSH_PORT` | SSH port (optional, defaults to 22) | `22` |

⚠️ **Important**: Secret names must only contain letters, numbers, and underscores, and must start with a letter or underscore.

#### Setting Up SSH Keys:

**Step 1: Generate SSH Key Pair (if you don't have one)**
```bash
# Generate ED25519 key (recommended)
ssh-keygen -t ed25519 -C "your-email@example.com"
# OR generate RSA key
ssh-keygen -t rsa -b 4096 -C "your-email@example.com"
```

**Step 2: Copy Public Key to Server**
```bash
# Copy your public key to the server
ssh-copy-id your-username@18.144.88.135

# OR manually add it to the server
cat ~/.ssh/id_ed25519.pub  # Copy this content
ssh your-username@18.144.88.135
echo "your-public-key-content" >> ~/.ssh/authorized_keys
```

**Step 3: Get Private Key for GitHub Secret**
```bash
# For ED25519 key
cat ~/.ssh/id_ed25519

# For RSA key  
cat ~/.ssh/id_rsa
```

Copy the **entire private key content** (including `-----BEGIN OPENSSH PRIVATE KEY-----` and `-----END OPENSSH PRIVATE KEY-----`) and paste it as the `SSH_PRIVATE_KEY` secret.

**Note**: You provided a public key (`ssh-ed25519 AAAAC3...`), but GitHub needs the **private key** content for authentication.

### Step 3: Test the Deployment

1. Push any change to the `main` branch
2. Go to **Actions** tab in your GitHub repository
3. Watch the deployment process
4. Once complete, visit: `http://18.144.88.135:3000`

## 📁 Files Created

This setup creates these files in your repository:

```
.github/workflows/deploy.yml    # Main CI/CD workflow
scripts/deploy-simple.sh        # Deployment script
```

## 🔧 How It Works

### The Workflow (`.github/workflows/deploy.yml`)

1. **Triggers**: Runs on every push to `main` branch
2. **Connects**: Uses SSH to connect to your server
3. **Deploys**: Runs the deployment script on the server
4. **Manages**: Uses PM2 to manage the application process

### The Deployment Process

1. **Clone/Update**: Downloads latest code from GitHub
2. **Install**: Runs `npm install` to get dependencies
3. **Stop**: Stops any existing application instance
4. **Start**: Starts the new version with PM2
5. **Verify**: Shows status and provides access information

## 🛠️ Manual Deployment

You can also deploy manually by running:

```bash
ssh your-username@18.144.88.135
cd /var/www/cloutware-videoeditor
./scripts/deploy-simple.sh
```

## 📋 Useful Commands

### On the Server

```bash
# Check application status
pm2 status

# View application logs
pm2 logs video-processing

# Restart application
pm2 restart video-processing

# Stop application
pm2 stop video-processing

# View all PM2 processes
pm2 list
```

### Local Development

```bash
# Trigger manual deployment
git push origin main

# Check deployment status
# Go to GitHub Actions tab in your repository
```

## 🎯 Application Access

- **Application URL**: `http://18.144.88.135:3000`
- **Direct Port**: Application runs on port 3000
- **Process Name**: `video-processing` (in PM2)

## 🔍 Troubleshooting

### Common Issues

1. **❌ SSH secrets are not configured!**
   - **Solution**: Add the required GitHub secrets (see Step 2 above)
   - The workflow will fail with this message if secrets are missing
   - Go to GitHub Settings → Secrets and variables → Actions

2. **SSH Connection Failed**
   - Check your SSH credentials in GitHub secrets
   - Verify server IP and SSH access
   - Ensure SSH key is correctly formatted

3. **Node.js/NPM Not Found**
   - Run the server setup script
   - Manually install Node.js 18+

4. **PM2 Not Found**
   - Install PM2: `sudo npm install -g pm2`

5. **Port 3000 Already in Use**
   - Stop existing processes: `pm2 stop all`
   - Or change port in the workflow

### Debugging Steps

1. **Check GitHub Actions Logs**:
   - Go to your repository → Actions tab
   - Click on the failed workflow run
   - Review the error messages

2. **Verify SSH Setup**:
   ```bash
   # Test SSH connection locally
   ssh your-username@18.144.88.135
   ```

3. **Check Server Status**:
   ```bash
   # SSH into server and check logs
   ssh your-username@18.144.88.135
   pm2 logs video-processing
   
   # Check if application is responding
   curl http://localhost:3000
   
   # Check PM2 status
   pm2 status
   ```

### First-Time Setup Error

If you see this error in GitHub Actions:
```
❌ SSH secrets are not configured!
```

**This is expected!** Follow these steps:

1. **Add GitHub Secrets** (detailed in Step 2 above)
2. **Push another commit** to trigger the workflow again
3. **The deployment should succeed** once secrets are configured

## ✅ Success Indicators

Your deployment is successful when:

1. ✅ GitHub Actions workflow completes without errors
2. ✅ `pm2 status` shows `video-processing` as `online`
3. ✅ You can access `http://18.144.88.135:3000`
4. ✅ Application responds to requests

## 🔄 Updating the Application

Just push your changes to the `main` branch:

```bash
git add .
git commit -m "Update application"
git push origin main
```

The CI/CD pipeline will automatically deploy your changes!

## 📞 Support

If you encounter issues:

1. Check GitHub Actions logs for deployment errors
2. SSH into the server and check `pm2 logs video-processing`
3. Verify all GitHub secrets are correctly set
4. Ensure the server setup script was run successfully