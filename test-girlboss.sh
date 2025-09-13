#!/bin/bash

# Quick Girlboss Template Test Script
# Usage: ./test-girlboss.sh

SERVER_URL="${1:-http://localhost:3000}"
OUTPUT_DIR="./test_outputs"

echo "🦄 Girlboss Template Video Generation Test"
echo "========================================="
echo ""

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Check if server is running
echo "🔍 Checking server status..."

# Try multiple endpoints to see if server is responsive
SERVER_WORKING=false

# Test root endpoint
if curl -sf "$SERVER_URL" > /dev/null 2>&1; then
    SERVER_WORKING=true
    echo "✅ Server is running (root endpoint accessible)!"
elif curl -sf "$SERVER_URL/health" > /dev/null 2>&1; then
    SERVER_WORKING=true  
    echo "✅ Server is running (health endpoint accessible)!"
elif curl -sf "$SERVER_URL/api" > /dev/null 2>&1; then
    SERVER_WORKING=true
    echo "✅ Server is running (API endpoint accessible)!"
else
    # Try to get more info about what's wrong
    echo "❌ Server is not responding to HTTP requests."
    echo ""
    echo "Troubleshooting info:"
    echo "- PM2 status:"
    pm2 list 2>/dev/null || echo "  PM2 not found or no processes"
    echo "- Port 3000 status:"
    sudo netstat -tulpn | grep :3000 2>/dev/null || echo "  Nothing listening on port 3000"
    echo ""
    echo "💡 Try these solutions:"
    echo "1. Restart the server: pm2 restart video-processing"
    echo "2. Check PM2 logs: pm2 logs video-processing"
    echo "3. Make sure server binds to 0.0.0.0:3000, not just localhost:3000"
    echo "4. Try different URL: ./test-girlboss.sh http://127.0.0.1:3000"
    exit 1
fi

if [ "$SERVER_WORKING" = false ]; then
    exit 1
fi

echo ""

# Test 1: Basic Girlboss Style
echo "🎬 Test 1: Basic Girlboss Style with Custom SRT..."

curl -X POST "$SERVER_URL/api/encode" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://dkkaakuajsyehonlipbu.supabase.co/storage/v1/object/public/videos/tiktok/6736250773027767302/7362188339048353066",
    "outputName": "girlboss_basic_test",
    "format": "mp4",
    "caption": {
      "srtContent": "1\n00:00:00,000 --> 00:00:03,000\nHey gorgeous! 💅✨\n\n2\n00:00:03,000 --> 00:00:06,000\nYou'\''re absolutely slaying today! 👑\n\n3\n00:00:06,000 --> 00:00:09,000\nKeep that boss energy! 🔥💖",
      "subtitleStyle": "girlboss",
      "fontSize": 48,
      "girlbossColor": "#FF1493",
      "girlbossShadowStrength": 2.0,
      "girlbossAnimation": "shake",
      "girlbossVerticalPosition": 20
    }
  }' \
  --output "$OUTPUT_DIR/girlboss_basic_test.mp4"

if [ $? -eq 0 ]; then
    echo "✅ Basic test completed: $OUTPUT_DIR/girlboss_basic_test.mp4"
else
    echo "❌ Basic test failed"
fi

echo ""

# Test 2: Bouncy Animation
echo "🎬 Test 2: Girlboss with Bouncy Animation..."

curl -X POST "$SERVER_URL/api/encode" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://dkkaakuajsyehonlipbu.supabase.co/storage/v1/object/public/videos/tiktok/6736250773027767302/7362188339048353066",
    "outputName": "girlboss_bouncy_test",
    "format": "mp4",
    "caption": {
      "srtContent": "1\n00:00:00,000 --> 00:00:04,000\nBounce into greatness! 🌟\n\n2\n00:00:04,000 --> 00:00:08,000\nEvery step is a power move! 💪\n\n3\n00:00:08,000 --> 00:00:12,000\nYou'\''re unstoppable! 🚀✨",
      "subtitleStyle": "girlboss",
      "fontSize": 52,
      "girlbossColor": "#FF69B4",
      "girlbossShadowStrength": 3.0,
      "girlbossAnimation": "bounce",
      "girlbossVerticalPosition": 15
    }
  }' \
  --output "$OUTPUT_DIR/girlboss_bouncy_test.mp4"

if [ $? -eq 0 ]; then
    echo "✅ Bouncy test completed: $OUTPUT_DIR/girlboss_bouncy_test.mp4"
else
    echo "❌ Bouncy test failed"
fi

echo ""

# Test 3: Glowing Gold
echo "🎬 Test 3: Girlboss with Golden Glow..."

curl -X POST "$SERVER_URL/api/encode" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://dkkaakuajsyehonlipbu.supabase.co/storage/v1/object/public/videos/tiktok/6736250773027767302/7362188339048353066",
    "outputName": "girlboss_glow_test",
    "format": "mp4",
    "caption": {
      "srtContent": "1\n00:00:00,000 --> 00:00:03,500\nShine bright like gold! ✨\n\n2\n00:00:03,500 --> 00:00:07,000\nYour light illuminates everything! 🌟\n\n3\n00:00:07,000 --> 00:00:10,500\nGolden goddess vibes! 👑💛",
      "subtitleStyle": "girlboss",
      "fontSize": 50,
      "girlbossColor": "#FFD700",
      "girlbossShadowStrength": 4.0,
      "girlbossAnimation": "glow",
      "girlbossVerticalPosition": 25
    }
  }' \
  --output "$OUTPUT_DIR/girlboss_glow_test.mp4"

if [ $? -eq 0 ]; then
    echo "✅ Glow test completed: $OUTPUT_DIR/girlboss_glow_test.mp4"
else
    echo "❌ Glow test failed"
fi

echo ""

# Summary
echo "🎉 Test Summary"
echo "==============="
echo "Check the generated videos in: $OUTPUT_DIR"
echo ""
echo "Generated files:"
[ -f "$OUTPUT_DIR/girlboss_basic_test.mp4" ] && echo "✅ girlboss_basic_test.mp4 - Classic shake animation"
[ -f "$OUTPUT_DIR/girlboss_bouncy_test.mp4" ] && echo "✅ girlboss_bouncy_test.mp4 - Bouncy animation"
[ -f "$OUTPUT_DIR/girlboss_glow_test.mp4" ] && echo "✅ girlboss_glow_test.mp4 - Golden glow effect"

echo ""
echo "🎯 To create your own test:"
echo "1. Modify the SRT content in this script"
echo "2. Change colors, animations, or positioning"
echo "3. Run the script again: ./test-girlboss.sh"
echo ""
echo "🎨 Available girlboss parameters:"
echo "- girlbossColor: #FF1493, #FF69B4, #FFD700, #8A2BE2"
echo "- girlbossAnimation: shake, bounce, glow"
echo "- girlbossShadowStrength: 1.0 - 4.0"
echo "- girlbossVerticalPosition: 10 - 30"