#!/bin/bash

# Quick Local Video Test Script
# Tests with your own video file or URL

API_URL="http://localhost:3000/api/encode"
OUTPUT_DIR="./test_outputs_local"

# Get video source from user
if [ $# -eq 0 ]; then
    echo "🎬 Quick Video Processing Test"
    echo "==============================="
    echo ""
    echo "Usage:"
    echo "  bash test-local-video.sh <VIDEO_PATH_OR_URL>"
    echo ""
    echo "Examples:"
    echo "  bash test-local-video.sh video.mp4"
    echo "  bash test-local-video.sh /full/path/to/video.mp4"
    echo "  bash test-local-video.sh https://your-video-url.com/video.mp4"
    echo ""
    echo "💡 Pro tip: Put your video file in this directory and just use the filename!"
    exit 1
fi

VIDEO_SOURCE="$1"

# Create output directory
mkdir -p "$OUTPUT_DIR"

echo "🎬 Quick Video Processing Test"
echo "==============================="
echo "Video: $VIDEO_SOURCE"
echo "Output: $OUTPUT_DIR"
echo ""

# Test 1: Girlboss Style with Effects
echo "🌸 Testing Girlboss Style..."
curl -X POST "$API_URL" \
    -H "Content-Type: application/json" \
    -d '{
        "url": "'$VIDEO_SOURCE'",
        "outputName": "girlboss_test",
        "format": "mp4",
        "options": {
            "speedFactor": 1.1,
            "saturationFactor": 1.2,
            "lightness": 0.1,
            "backgroundAudio": true,
            "backgroundAudioVolume": 0.15,
            "antiDetection": {
                "pixelShift": true,
                "microCrop": true,
                "noiseAddition": true
            }
        },
        "caption": {
            "srtContent": "1\n00:00:00,000 --> 00:00:03,000\nGIRLBOSS ENERGY! 💅✨\n\n2\n00:00:03,000 --> 00:00:06,000\nOWN YOUR POWER! 👑",
            "subtitleStyle": "girlboss",
            "fontSize": 48,
            "girlbossColor": "#FF1493",
            "girlbossShadowStrength": 2.0,
            "girlbossAnimation": "shake"
        }
    }' \
    --output "$OUTPUT_DIR/girlboss_test.mp4" \
    --progress-bar

if [ $? -eq 0 ]; then
    echo "✅ Girlboss test completed!"
else
    echo "❌ Girlboss test failed!"
fi
echo ""

# Test 2: Hormozi Style with Effects
echo "🚨 Testing Hormozi Viral Style..."
curl -X POST "$API_URL" \
    -H "Content-Type: application/json" \
    -d '{
        "url": "'$VIDEO_SOURCE'",
        "outputName": "hormozi_test",
        "format": "mp4",
        "options": {
            "speedFactor": 1.15,
            "zoomFactor": 1.05,
            "saturationFactor": 1.3,
            "antiDetection": {
                "pixelShift": true,
                "subtleRotation": true,
                "metadataPoisoning": true
            }
        },
        "caption": {
            "srtContent": "1\n00:00:00,000 --> 00:00:02,500\nATTENTION! 🚨💰\n\n2\n00:00:02,500 --> 00:00:05,000\nThis will CHANGE your LIFE! 🔥",
            "subtitleStyle": "hormozi",
            "fontSize": 50,
            "hormoziColors": ["#00FF00", "#FF0000", "#0080FF", "#FFFF00"],
            "hormoziShadowStrength": 3.5,
            "hormoziAnimation": "shake"
        }
    }' \
    --output "$OUTPUT_DIR/hormozi_test.mp4" \
    --progress-bar

if [ $? -eq 0 ]; then
    echo "✅ Hormozi test completed!"
else
    echo "❌ Hormozi test failed!"
fi
echo ""

# Test 3: Format Conversion
echo "📸 Testing GIF Conversion..."
curl -X POST "$API_URL" \
    -H "Content-Type: application/json" \
    -d '{
        "url": "'$VIDEO_SOURCE'",
        "outputName": "test_gif",
        "format": "gif",
        "options": {
            "speedFactor": 1.2,
            "saturationFactor": 1.1
        }
    }' \
    --output "$OUTPUT_DIR/test.gif" \
    --progress-bar

if [ $? -eq 0 ]; then
    echo "✅ GIF conversion completed!"
else
    echo "❌ GIF conversion failed!"
fi
echo ""

# Test 4: PNG Thumbnail
echo "🖼️ Testing PNG Thumbnail..."
curl -X POST "$API_URL" \
    -H "Content-Type: application/json" \
    -d '{
        "url": "'$VIDEO_SOURCE'",
        "outputName": "thumbnail",
        "format": "png"
    }' \
    --output "$OUTPUT_DIR/thumbnail.png" \
    --progress-bar

if [ $? -eq 0 ]; then
    echo "✅ PNG thumbnail completed!"
else
    echo "❌ PNG thumbnail failed!"
fi
echo ""

# Results Summary
echo "🎉 QUICK TEST COMPLETED!"
echo "========================"
echo ""
echo "📁 Results in: $OUTPUT_DIR"
echo ""
echo "📊 Files created:"
ls -la "$OUTPUT_DIR" 2>/dev/null | grep -E '\.(mp4|gif|png)$' || echo "   No files created (check for errors above)"
echo ""
echo "🚀 If all tests passed, your API is working perfectly!"
echo "💡 Run the full ultimate test suite with: bash test-all-features.sh" 