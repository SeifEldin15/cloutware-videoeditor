#!/bin/bash
# Quick Ubuntu Video Processing Diagnostic
# Run this on your Ubuntu server to test the video processing

echo "🔍 Quick Video Processing Test"
echo "=============================="

# Test 1: Check if the server is responding
echo "1. Testing server health..."
curl -f http://localhost:3000/api/health 2>/dev/null && echo "✅ Server is running" || echo "❌ Server not responding"

# Test 2: Check FFmpeg installation
echo ""
echo "2. Testing FFmpeg..."
ffmpeg -version 2>/dev/null | head -1 && echo "✅ FFmpeg installed" || echo "❌ FFmpeg not found"

# Test 3: Test permissions in temp directory
echo ""
echo "3. Testing temp directory permissions..."
TEST_FILE="/tmp/test_$(date +%s).txt"
echo "test" > "$TEST_FILE" 2>/dev/null && rm "$TEST_FILE" && echo "✅ Temp directory writable" || echo "❌ Temp directory not writable"

# Test 4: Test a simple video processing request
echo ""
echo "4. Testing video processing API..."
curl -X POST http://localhost:3000/api/encode-template \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4",
    "srtContent": "1\n00:00:00,000 --> 00:00:03,000\nTest subtitle\n\n2\n00:00:03,000 --> 00:00:06,000\nSecond subtitle",
    "templateName": "basic",
    "outputName": "test_output"
  }' \
  --max-time 60 \
  --output test_result.mp4 \
  --silent \
  --show-error

# Check result
if [ -f "test_result.mp4" ]; then
    SIZE=$(stat --printf="%s" test_result.mp4 2>/dev/null || echo "0")
    if [ "$SIZE" -gt "0" ]; then
        echo "✅ Video processing SUCCESS: Generated ${SIZE} bytes"
        rm test_result.mp4
    else
        echo "❌ Video processing FAILED: 0-byte file generated"
        echo "Checking error response..."
        head -c 500 test_result.mp4 2>/dev/null || echo "No readable content"
        rm -f test_result.mp4
    fi
else
    echo "❌ Video processing FAILED: No output file"
fi

# Test 5: Check recent logs for errors
echo ""
echo "5. Checking recent errors..."
if command -v pm2 >/dev/null 2>&1; then
    echo "PM2 logs (last 5 lines):"
    pm2 logs video-processing --lines 5 --nostream 2>/dev/null | tail -5
else
    echo "PM2 not found, checking system logs..."
    journalctl -u video-processing --lines 5 --no-pager 2>/dev/null || echo "No system logs found"
fi

echo ""
echo "🔧 If video processing failed, common issues:"
echo "- FFmpeg not installed or not in PATH"
echo "- Network connectivity issues (can't download source video)"  
echo "- Insufficient disk space in /tmp"
echo "- Permission issues with temporary files"
echo "- Server memory/CPU limits"
echo ""
echo "Run 'pm2 logs video-processing --lines 50' for detailed error logs"
