# Ubuntu Server FFmpeg Setup Guide

## 🎯 **Recommended: Use npm packages (No system installation needed)**

Your project already includes FFmpeg as npm dependencies, and the code is configured to use them automatically:

- **ffmpeg-static@5.2.0** - FFmpeg 6.0 binary 
- **@ffmpeg-installer/ffmpeg@1.1.0** - Alternative FFmpeg binary

## 📋 **Deployment Steps**

### 1. Deploy Your Updated Code
```bash
# Upload your code to Ubuntu server
rsync -avz --exclude node_modules --exclude .git ./ username@your-server:/path/to/video-processing/

# Or if using git:
ssh username@your-server
cd /path/to/video-processing
git pull origin main
```

### 2. Install Dependencies (Ubuntu server)
```bash
ssh username@your-server
cd /path/to/video-processing

# Install Node.js dependencies (this includes FFmpeg binaries)
npm install
# or if using pnpm:
pnpm install
```

### 3. Verify FFmpeg Detection
```bash
# Start your application and check logs
pm2 restart all
pm2 logs --lines 50

# You should see:
# ✅ Using newer FFmpeg from ffmpeg-static package
# 🎥 FFmpeg Path: /path/to/node_modules/ffmpeg-static/ffmpeg
```

## 🛠️ **Alternative: System FFmpeg Installation (if needed)**

If you prefer to install FFmpeg system-wide on Ubuntu:

### Option A: Static Build (Recommended)
```bash
# Download latest static build
cd /tmp
wget https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz
tar -xf ffmpeg-release-amd64-static.tar.xz
sudo cp ffmpeg-*-amd64-static/ffmpeg /usr/local/bin/
sudo cp ffmpeg-*-amd64-static/ffprobe /usr/local/bin/
sudo chmod +x /usr/local/bin/ffmpeg /usr/local/bin/ffprobe

# Verify installation
ffmpeg -version
```

### Option B: Ubuntu Package (older version)
```bash
# Install from Ubuntu repositories (may be older)
sudo apt update
sudo apt install ffmpeg

# Verify installation
ffmpeg -version
```

### Option C: Snap Package
```bash
# Install via snap (isolated)
sudo snap install ffmpeg

# Verify installation
ffmpeg -version
```

## 🔍 **Verification Commands**

After deployment, verify everything is working:

```bash
# Check FFmpeg detection in your app
ssh username@your-server
cd /path/to/video-processing
pm2 logs | grep -i ffmpeg

# Expected output:
# ✅ Using newer FFmpeg from ffmpeg-static package
# 🎥 FFmpeg Path: /path/to/node_modules/ffmpeg-static/ffmpeg
```

## 🚨 **Important Notes**

### Why npm packages are preferred:
1. **Version Control**: Exact FFmpeg version locked in package.json
2. **No System Dependencies**: Works regardless of Ubuntu version
3. **Isolated**: Doesn't conflict with system FFmpeg
4. **Consistent**: Same version across all environments

### Your code priority (already implemented):
```typescript
// 1. Try ffmpeg-static (FFmpeg 6.0)
// 2. Try @ffmpeg-installer/ffmpeg 
// 3. Fall back to system FFmpeg
```

## 📝 **Deployment Checklist**

- [ ] Upload updated code to Ubuntu server
- [ ] Run `npm install` or `pnpm install` on server
- [ ] Restart PM2 processes: `pm2 restart all`
- [ ] Check logs for FFmpeg detection: `pm2 logs | grep ffmpeg`
- [ ] Test template processing with subtitles
- [ ] Verify no SIGSEGV errors in logs

## ✅ **Expected Results**

After deployment, you should see:

1. **Logs show**: `✅ Using newer FFmpeg from ffmpeg-static package`
2. **Template processing**: Completes without crashes
3. **Subtitles**: Appear in simple format for templates
4. **No errors**: No more SIGSEGV crashes
5. **Fallback system**: Works if any subtitle issues occur

## 🔧 **Troubleshooting**

If FFmpeg isn't detected:
```bash
# Check if packages installed correctly
ls -la node_modules/ffmpeg-static/
ls -la node_modules/@ffmpeg-installer/ffmpeg/

# Check permissions
chmod +x node_modules/ffmpeg-static/ffmpeg
chmod +x node_modules/@ffmpeg-installer/ffmpeg/ffmpeg
```

The npm package approach should work perfectly with your Ubuntu server!