#!/bin/bash
# Debug script for Ubuntu video processing issues
# Run this on your Ubuntu server to diagnose the 0-byte video problem

echo "🔍 Video Processing Debug Script"
echo "=================================="

# Check FFmpeg installation
echo "1. Checking FFmpeg installation..."
which ffmpeg
ffmpeg -version | head -1

# Check available encoders
echo "2. Checking H.264 encoder availability..."
ffmpeg -encoders 2>/dev/null | grep -i h264

# Check system resources
echo "3. System Resources:"
echo "CPU Cores: $(nproc)"
echo "Memory: $(free -h | grep Mem:)"
echo "Disk Space: $(df -h /tmp | tail -1)"

# Check Node.js and pnpm
echo "4. Runtime Environment:"
echo "Node.js: $(node --version)"
echo "pnpm: $(pnpm --version)"

# Check if PM2 processes are running
echo "5. PM2 Process Status:"
pm2 list

# Check recent logs
echo "6. Recent Application Logs:"
echo "Last 10 lines from PM2 logs:"
pm2 logs video-processing --lines 10 --nostream || echo "No PM2 logs found"

# Test a simple FFmpeg command
echo "7. Testing FFmpeg with a simple command..."
cd /tmp
echo "Creating a test video..."
ffmpeg -f lavfi -i testsrc=duration=5:size=320x240:rate=1 -c:v libx264 test_output.mp4 -y 2>/dev/null
if [ -f test_output.mp4 ] && [ -s test_output.mp4 ]; then
    echo "✅ FFmpeg basic test: PASSED ($(stat --printf="%s" test_output.mp4) bytes)"
    rm test_output.mp4
else
    echo "❌ FFmpeg basic test: FAILED"
fi

# Check permissions
echo "8. Permission Check:"
echo "Current user: $(whoami)"
echo "Temp directory permissions: $(ls -ld /tmp)"

# Check if video-processing directory exists and permissions
if [ -d "/opt/video-processing" ]; then
    echo "App directory permissions: $(ls -ld /opt/video-processing)"
    echo "Current directory contents: $(ls -la /opt/video-processing/current/ 2>/dev/null | wc -l) files"
else
    echo "❌ /opt/video-processing not found"
fi

# Check network connectivity (for downloading test videos)
echo "9. Network Test:"
curl -I -s --max-time 5 https://www.google.com > /dev/null && echo "✅ Internet connectivity: OK" || echo "❌ Internet connectivity: FAILED"

echo ""
echo "🔧 Recommendations:"
echo "- If FFmpeg test failed: sudo apt update && sudo apt install ffmpeg"
echo "- If permission issues: check /tmp write permissions"
echo "- If network issues: check firewall and DNS"
echo "- Check PM2 logs for specific error messages"

echo ""
echo "📋 To test video processing manually:"
echo 'curl -X POST http://localhost:3000/api/encode-template \\'
echo '  -H "Content-Type: application/json" \\'
echo '  -d '"'"'{"url":"https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4","srtContent":"1\n00:00:00,000 --> 00:00:03,000\nTest subtitle","templateName":"basic"}'"'"' \\'
echo '  --output test_result.mp4'
