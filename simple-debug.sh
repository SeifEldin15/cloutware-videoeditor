#!/bin/bash

echo "🔍 Quick Video Processing Debug Test"
echo "=================================="
echo ""

# Test 1: Check if FFmpeg is working
echo "1. Testing FFmpeg installation..."
if command -v ffmpeg &> /dev/null; then
    echo "✅ FFmpeg found: $(ffmpeg -version | head -n1)"
else
    echo "❌ FFmpeg not found - this is the problem!"
    exit 1
fi

# Test 2: Check disk space
echo ""
echo "2. Checking disk space..."
df -h /tmp
df -h /opt/video-processing

# Test 3: Test a simple FFmpeg command
echo ""
echo "3. Testing simple FFmpeg command..."
ffmpeg -f lavfi -i testsrc=duration=1:size=320x240:rate=1 -t 1 /tmp/test-output.mp4 -y 2>/dev/null
if [ -f /tmp/test-output.mp4 ] && [ -s /tmp/test-output.mp4 ]; then
    echo "✅ FFmpeg basic test successful"
    ls -la /tmp/test-output.mp4
    rm /tmp/test-output.mp4
else
    echo "❌ FFmpeg basic test failed"
fi

# Test 4: Check Node.js process
echo ""
echo "4. Checking Node.js processes..."
ps aux | grep -E "(node|nuxt)" | grep -v grep

# Test 5: Check API health
echo ""
echo "5. Testing API health..."
curl -s http://localhost:3000/api/health || echo "❌ API not responding"

echo ""
echo "Debug complete! Check for any ❌ errors above."
