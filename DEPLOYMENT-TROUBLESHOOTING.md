# 🚀 Deployment Troubleshooting Guide

## Common Issues and Solutions

### 1. **Git Authentication Error** ❌
```
fatal: could not read Username for 'https://github.com': No such device or address
```

**Solutions (in order of preference):**

#### Option A: Use GitHub Personal Access Token (Recommended)
1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token with `repo` permissions
3. Add to GitHub repository secrets as `GITHUB_TOKEN`
4. The deployment script will automatically use it

#### Option B: Add SSH Deploy Key
1. On your server, generate SSH key: `ssh-keygen -t ed25519 -C "deploy@yourserver"`
2. Add public key to GitHub repository → Settings → Deploy keys
3. The deployment script will try SSH first

#### Option C: Make Repository Public
1. Go to repository Settings → General → Danger Zone
2. Change repository visibility to Public
3. The deployment script will use public HTTPS

### 2. **Build Failures** 🔨

**Common causes:**
- Out of disk space (check with `df -h`)
- Node.js version mismatch
- Missing environment variables

**Solutions:**
```bash
# Check disk space
df -h

# Clean up if needed
npm cache clean --force
sudo apt-get autoremove -y
sudo apt-get autoclean

# Check Node.js version
node --version
npm --version
```

### 3. **PM2 Process Issues** ⚙️

**Check PM2 status:**
```bash
pm2 status
pm2 logs video-processing
```

**Restart if needed:**
```bash
pm2 restart video-processing
```

**Reset PM2 completely:**
```bash
pm2 kill
pm2 start npm --name "video-processing" -- start
```

### 4. **Port Already in Use** 🔌

**Find and kill process using port 3000:**
```bash
sudo lsof -i :3000
sudo kill -9 <PID>
```

### 5. **SSH Connection Issues** 🔐

**Test SSH connection:**
```bash
ssh -i /path/to/key username@18.144.88.135
```

**Check SSH secrets in GitHub:**
- `SSH_USERNAME` - your server username (e.g., ubuntu)
- `SSH_PRIVATE_KEY` - your SSH private key content
- `SSH_PORT` - 22 (optional)

## Monitoring Commands

**Check application status:**
```bash
pm2 status
pm2 monit
```

**View logs:**
```bash
pm2 logs video-processing
pm2 logs video-processing --lines 50
```

**Check system resources:**
```bash
htop
df -h
free -h
```

## Manual Deployment

If automated deployment fails, you can deploy manually:

```bash
# SSH to server
ssh username@18.144.88.135

# Clean up
cd $HOME
rm -rf cloutware-videoeditor

# Clone (use appropriate method)
git clone https://github.com/SeifEldin15/cloutware-videoeditor.git
# OR with token:
# git clone https://TOKEN@github.com/SeifEldin15/cloutware-videoeditor.git

cd cloutware-videoeditor

# Install and build
npm install
npm run build

# Start with PM2
pm2 stop video-processing || true
pm2 delete video-processing || true
pm2 start npm --name "video-processing" -- start
```

## Health Check URLs

After deployment, verify these URLs work:
- Main app: http://18.144.88.135:3000
- Health check: http://18.144.88.135:3000/api/health (if implemented)

## Getting Help

1. Check GitHub Actions logs in repository
2. SSH to server and check PM2 logs
3. Review this troubleshooting guide
4. Check the server's system resources

---

*Last updated: $(date)*