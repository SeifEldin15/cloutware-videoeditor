#!/bin/bash

# Video Processing API Test Script
# Make sure your server is running on localhost:3000

API_URL="http://localhost:3000/api/encode"
OUTPUT_DIR="./test_outputs"

# Create output directory
mkdir -p "$OUTPUT_DIR"

echo "🎬 Video Processing API Test Suite"
echo "=================================="
echo ""

# Test 1: Girlboss Style Subtitles
echo "🦄 Testing Girlboss Style Subtitles..."
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4",
    "outputName": "girlboss_test",
    "format": "mp4",
    "caption": {
      "srtContent": "1\n00:00:00,000 --> 00:00:03,000\nGirlboss Energy! 💅\n\n2\n00:00:03,000 --> 00:00:06,000\nShake it up! ✨\n\n3\n00:00:06,000 --> 00:00:09,000\nOwn your power! 👑",
      "subtitleStyle": "girlboss",
      "fontSize": 48,
      "girlbossColor": "#FF1493",
      "girlbossShadowStrength": 2,
      "girlbossAnimation": "shake",
      "girlbossVerticalPosition": 20
    }
  }' \
  --output "$OUTPUT_DIR/girlboss_test.mp4"

echo "✅ Girlboss test completed!"
echo ""

# Test 2: Hormozi Viral Style
echo "🔥 Testing Hormozi Viral Style Subtitles..."
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4",
    "outputName": "hormozi_test",
    "format": "mp4",
    "caption": {
      "srtContent": "1\n00:00:00,000 --> 00:00:02,500\nATTENTION ENTREPRENEURS! 🚨\n\n2\n00:00:02,500 --> 00:00:05,000\nThis will CHANGE your life 💰\n\n3\n00:00:05,000 --> 00:00:08,000\nWatch what happens NEXT! 🔥",
      "subtitleStyle": "hormozi",
      "fontSize": 52,
      "hormoziColors": ["#00FF00", "#FF0000", "#0080FF", "#FFFF00", "#FF00FF"],
      "hormoziShadowStrength": 4,
      "hormoziAnimation": "shake"
    }
  }' \
  --output "$OUTPUT_DIR/hormozi_test.mp4"

echo "✅ Hormozi test completed!"
echo ""

# Test 3: Thin to Bold Style
echo "✨ Testing Thin to Bold Style Subtitles..."
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4",
    "outputName": "thintobold_test",
    "format": "mp4",
    "caption": {
      "srtContent": "1\n00:00:00,000 --> 00:00:03,000\nElegant typography in motion\n\n2\n00:00:03,000 --> 00:00:06,000\nSmooth transitions\n\n3\n00:00:06,000 --> 00:00:09,000\nProfessional presentation",
      "subtitleStyle": "thintobold",
      "fontSize": 46,
      "fontFamily": "Montserrat",
      "thinToBoldColor": "#FFFFFF",
      "thinToBoldShadowStrength": 1.5
    }
  }' \
  --output "$OUTPUT_DIR/thintobold_test.mp4"

echo "✅ Thin to Bold test completed!"
echo ""

# Test 4: Wavy Colors Style
echo "🌈 Testing Wavy Colors Style Subtitles..."
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4",
    "outputName": "wavycolors_test",
    "format": "mp4",
    "caption": {
      "srtContent": "1\n00:00:00,000 --> 00:00:04,000\nRainbow colors flowing 🌈\n\n2\n00:00:04,000 --> 00:00:08,000\nWavy colorful text ✨\n\n3\n00:00:08,000 --> 00:00:12,000\nPsychedelic experience! 🔮",
      "subtitleStyle": "wavycolors",
      "fontSize": 50,
      "wavyColorsOutlineWidth": 3,
      "wavyColorsVerticalPosition": 10
    }
  }' \
  --output "$OUTPUT_DIR/wavycolors_test.mp4"

echo "✅ Wavy Colors test completed!"
echo ""

# Test 5: GIF Conversion
echo "📸 Testing GIF Conversion..."
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4",
    "outputName": "test_gif",
    "format": "gif"
  }' \
  --output "$OUTPUT_DIR/test.gif"

echo "✅ GIF conversion test completed!"
echo ""

# Test 6: PNG Thumbnail
echo "🖼️ Testing PNG Thumbnail Extraction..."
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4",
    "outputName": "thumbnail",
    "format": "png"
  }' \
  --output "$OUTPUT_DIR/thumbnail.png"

echo "✅ PNG thumbnail test completed!"
echo ""

# Test 7: Advanced Video Effects
echo "⚡ Testing Advanced Video Effects..."
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4",
    "outputName": "advanced_effects",
    "format": "mp4",
    "options": {
      "speedFactor": 1.2,
      "zoomFactor": 1.1,
      "saturationFactor": 1.3,
      "lightness": 0.15,
      "backgroundAudio": true,
      "backgroundAudioVolume": 0.2,
      "antiDetection": {
        "pixelShift": true,
        "microCrop": true,
        "subtleRotation": true,
        "noiseAddition": true
      },
      "visibleChanges": {
        "border": true,
        "timestamp": true
      }
    }
  }' \
  --output "$OUTPUT_DIR/advanced_effects.mp4"

echo "✅ Advanced effects test completed!"
echo ""

# Test 8: Ultimate Combined Test
echo "🚀 Testing Ultimate Combined Features..."
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4",
    "outputName": "ultimate_test",
    "format": "mp4",
    "caption": {
      "srtContent": "1\n00:00:00,000 --> 00:00:03,000\nULTIMATE TEST! 🎯\n\n2\n00:00:03,000 --> 00:00:06,000\nAll effects combined 💥\n\n3\n00:00:06,000 --> 00:00:09,000\nMaximum power! ⚡",
      "subtitleStyle": "hormozi",
      "fontSize": 54,
      "hormoziColors": ["#FF0000", "#00FF00", "#0000FF", "#FFFF00"],
      "hormoziShadowStrength": 5,
      "hormoziAnimation": "shake"
    },
    "options": {
      "speedFactor": 1.15,
      "saturationFactor": 1.25,
      "backgroundAudio": true,
      "antiDetection": {
        "pixelShift": true,
        "microCrop": true,
        "subtleRotation": true,
        "noiseAddition": true,
        "metadataPoisoning": true
      }
    }
  }' \
  --output "$OUTPUT_DIR/ultimate_test.mp4"

echo "✅ Ultimate test completed!"
echo ""

echo "🎉 All tests completed!"
echo "📁 Check the '$OUTPUT_DIR' folder for your processed videos"
echo ""
echo "Files created:"
ls -la "$OUTPUT_DIR" 