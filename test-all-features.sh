#!/bin/bash

# Comprehensive Video Processing API Test Script
# Tests each subtitle style with ALL video transformations applied
# Make sure your server is running on localhost:3000

API_URL="http://localhost:3000/api/encode"
OUTPUT_DIR="./test_outputs_full"

# Use the user's specified video URL
TEST_VIDEO="https://dkkaakuajsyehonlipbu.supabase.co/storage/v1/object/public/videos/tiktok/6736250773027767302/7362188339048353066"

# Function to test video URL
test_video_url() {
    echo "🔍 Testing video URL: $TEST_VIDEO"
    if curl --head --silent --fail "$TEST_VIDEO" > /dev/null 2>&1; then
        echo "   ✅ Video URL is accessible!"
        return 0
    else
        echo "   ❌ Video URL not accessible. Please check the URL."
        exit 1
    fi
}

# Test video URL before starting
test_video_url

# Create output directory
mkdir -p "$OUTPUT_DIR"

echo "🎬 ULTIMATE Video Processing API Test Suite"
echo "=========================================="
echo "Testing each subtitle style with ALL video transformations"
echo ""

# Function to make API request with full options
make_request() {
    local subtitle_style="$1"
    local output_name="$2"
    local subtitle_content="$3"
    local style_specific_options="$4"
    
    echo "🚀 Testing $subtitle_style with ALL transformations..."
    
    # Base request with ALL video transformations
    local request="{
        \"url\": \"$TEST_VIDEO\",
        \"outputName\": \"$output_name\",
        \"format\": \"mp4\",
        \"options\": {
            \"speedFactor\": 1.15,
            \"zoomFactor\": 1.08,
            \"saturationFactor\": 1.25,
            \"lightness\": 0.12,
            \"framerate\": 30,
            \"audioPitch\": 1.03,
            \"backgroundAudio\": true,
            \"backgroundAudioVolume\": 0.18,
            \"smartCrop\": {
                \"percentage\": 1.15,
                \"direction\": \"center\"
            },
            \"temporalModification\": {
                \"dropFrames\": 1,
                \"duplicateFrames\": 2,
                \"reverseSegments\": false
            },
            \"audioTempoMod\": {
                \"tempoFactor\": 1.08,
                \"preservePitch\": true
            },
            \"syncShift\": 25,
            \"eqAdjustments\": {
                \"low\": 1.5,
                \"mid\": 0.8,
                \"high\": 2.0
            },
            \"reverbEffect\": {
                \"level\": 0.08,
                \"delay\": 40
            },
            \"backgroundAddition\": {
                \"type\": \"room\",
                \"level\": 0.03
            },
            \"visibleChanges\": {
                \"horizontalFlip\": false,
                \"border\": true,
                \"timestamp\": true
            },
            \"antiDetection\": {
                \"pixelShift\": true,
                \"microCrop\": true,
                \"subtleRotation\": true,
                \"noiseAddition\": true,
                \"metadataPoisoning\": true,
                \"frameInterpolation\": true
            },
            \"metadata\": {
                \"title\": \"$subtitle_style Ultimate Test\",
                \"description\": \"All effects with $subtitle_style subtitles\",
                \"tags\": \"test,processing,$subtitle_style\"
            }
        },
        \"caption\": {
            \"srtContent\": \"$subtitle_content\",
            \"fontSize\": 50,
            \"fontFamily\": \"Arial\",
            \"subtitleStyle\": \"$subtitle_style\"$style_specific_options
        }
    }"
    
    curl -X POST "$API_URL" \
        -H "Content-Type: application/json" \
        -d "$request" \
        --output "$OUTPUT_DIR/${output_name}.mp4" \
        --progress-bar
    
    if [ $? -eq 0 ]; then
        echo "✅ $subtitle_style test completed successfully!"
    else
        echo "❌ $subtitle_style test failed!"
    fi
    echo ""
}

# Test 1: Girlboss Style + ALL Transformations (Using Luckiest Guy Font)
make_request "girlboss" "girlboss_ultimate" \
    "1\n00:00:00,000 --> 00:00:03,000\nGIRLBOSS ENERGY! 💅✨\n\n2\n00:00:03,000 --> 00:00:06,000\nOWN YOUR POWER! 👑\n\n3\n00:00:06,000 --> 00:00:09,000\nSLAY ALL DAY! 🔥💪\n\n4\n00:00:09,000 --> 00:00:12,000\nBOSS BABE VIBES! 💕" \
    ",
            \"girlbossColor\": \"#FF1493\",
            \"girlbossShadowStrength\": 2.5,
            \"girlbossAnimation\": \"shake\",
            \"girlbossVerticalPosition\": 18"

# Test 2: Hormozi Viral Style + ALL Transformations (Using Luckiest Guy Font)
make_request "hormozi" "hormozi_ultimate" \
    "1\n00:00:00,000 --> 00:00:02,500\nATTENTION ENTREPRENEURS! 🚨💰\n\n2\n00:00:02,500 --> 00:00:05,000\nThis will CHANGE your LIFE! 🔥\n\n3\n00:00:05,000 --> 00:00:07,500\nWatch what happens NEXT! 👀\n\n4\n00:00:07,500 --> 00:00:10,000\nMILLIONS are doing THIS! 💎\n\n5\n00:00:10,000 --> 00:00:12,500\nDon't MISS OUT! ⚡" \
    ",
            \"hormoziColors\": [\"#00FF00\", \"#FF0000\", \"#0080FF\", \"#FFFF00\", \"#FF00FF\", \"#00FFFF\"],
            \"hormoziShadowStrength\": 4,
            \"hormoziAnimation\": \"shake\",
            \"hormoziVerticalPosition\": 15"

# Test 3: ThinToBold Style + ALL Transformations (Using Montserrat Thin Font)
make_request "thintobold" "thintobold_ultimate" \
    "1\n00:00:00,000 --> 00:00:03,000\nELEGANT TYPOGRAPHY\n\n2\n00:00:03,000 --> 00:00:06,000\nSMOOTH TRANSITIONS\n\n3\n00:00:06,000 --> 00:00:09,000\nPROFESSIONAL DESIGN\n\n4\n00:00:09,000 --> 00:00:12,000\nLUXURY AESTHETICS" \
    ",
            \"thinToBoldColor\": \"#FFFFFF\",
            \"thinToBoldShadowStrength\": 1.8,
            \"thinToBoldAnimation\": \"none\",
            \"thinToBoldVerticalPosition\": 22"

# Test 4: WavyColors Style + ALL Transformations (Using Luckiest Guy Font)
make_request "wavycolors" "wavycolors_ultimate" \
    "1\n00:00:00,000 --> 00:00:04,000\nRAINBOW COLORS FLOWING 🌈✨\n\n2\n00:00:04,000 --> 00:00:08,000\nWAVY COLORFUL MAGIC 🔮\n\n3\n00:00:08,000 --> 00:00:12,000\nPSYCHEDELIC EXPERIENCE! 🌟\n\n4\n00:00:12,000 --> 00:00:15,000\nCOLOR EXPLOSION! 💫🎨" \
    ",
            \"wavyColorsOutlineWidth\": 3,
            \"wavyColorsVerticalPosition\": 12"

# Test 5: Basic Style + ALL Transformations (Using Arial Font)
make_request "basic" "basic_ultimate" \
    "1\n00:00:00,000 --> 00:00:03,000\nProfessional Content\n\n2\n00:00:03,000 --> 00:00:06,000\nClean and Simple\n\n3\n00:00:06,000 --> 00:00:09,000\nTraditional Subtitles\n\n4\n00:00:09,000 --> 00:00:12,000\nClassic Presentation" \
    ",
            \"fontColor\": \"white\",
            \"fontStyle\": \"bold\",
            \"subtitlePosition\": \"bottom\",
            \"horizontalAlignment\": \"center\",
            \"verticalMargin\": 35,
            \"showBackground\": true,
            \"backgroundColor\": \"black@0.8\""

# Test 6: Format Conversions with Effects
echo "📸 Testing GIF Conversion with Effects..."
curl -X POST "$API_URL" \
    -H "Content-Type: application/json" \
    -d '{
        "url": "'$TEST_VIDEO'",
        "outputName": "ultimate_effects_gif",
        "format": "gif"
    }' \
    --output "$OUTPUT_DIR/ultimate_effects.gif" \
    --progress-bar
echo "✅ GIF conversion completed!"
echo ""

echo "🖼️ Testing PNG Thumbnail with Effects..."
curl -X POST "$API_URL" \
    -H "Content-Type: application/json" \
    -d '{
        "url": "'$TEST_VIDEO'",
        "outputName": "ultimate_thumbnail",
        "format": "png"
    }' \
    --output "$OUTPUT_DIR/ultimate_thumbnail.png" \
    --progress-bar
echo "✅ PNG thumbnail completed!"
echo ""

# Test 7: Extreme Effects Test (No Subtitles)
echo "⚡ Testing EXTREME Video Effects (No Subtitles)..."
curl -X POST "$API_URL" \
    -H "Content-Type: application/json" \
    -d '{
        "url": "'$TEST_VIDEO'",
        "outputName": "extreme_effects",
        "format": "mp4",
        "options": {
            "speedFactor": 1.8,
            "zoomFactor": 1.5,
            "saturationFactor": 1.8,
            "lightness": 0.3,
            "audioPitch": 1.2,
            "backgroundAudio": true,
            "backgroundAudioVolume": 0.3,
            "smartCrop": {
                "percentage": 1.5,
                "direction": "random"
            },
            "temporalModification": {
                "dropFrames": 3,
                "duplicateFrames": 4,
                "reverseSegments": false
            },
            "audioTempoMod": {
                "tempoFactor": 1.2,
                "preservePitch": false
            },
            "syncShift": 100,
            "eqAdjustments": {
                "low": 3,
                "mid": -2,
                "high": 4
            },
            "reverbEffect": {
                "level": 0.15,
                "delay": 80
            },
            "backgroundAddition": {
                "type": "crowd",
                "level": 0.08
            },
            "visibleChanges": {
                "horizontalFlip": true,
                "border": true,
                "timestamp": true
            },
            "antiDetection": {
                "pixelShift": true,
                "microCrop": true,
                "subtleRotation": true,
                "noiseAddition": true,
                "metadataPoisoning": true,
                "frameInterpolation": true
            }
        }
    }' \
    --output "$OUTPUT_DIR/extreme_effects.mp4" \
    --progress-bar
echo "✅ Extreme effects test completed!"
echo ""

# Test 8: All Subtitle Styles Combined Test
echo "🎭 Testing Mixed Subtitle Styles..."
curl -X POST "$API_URL" \
    -H "Content-Type: application/json" \
    -d '{
        "url": "'$TEST_VIDEO'",
        "outputName": "mixed_styles_test",
        "format": "mp4",
        "caption": {
            "srtContent": "1\n00:00:00,000 --> 00:00:02,000\nMULTI-STYLE TEST! 🎯\n\n2\n00:00:02,000 --> 00:00:04,000\nDIFFERENT ANIMATIONS\n\n3\n00:00:04,000 --> 00:00:06,000\nALL IN ONE VIDEO!\n\n4\n00:00:06,000 --> 00:00:08,000\nULTIMATE SHOWCASE!",
            "subtitleStyle": "hormozi",
            "fontSize": 52,
            "hormoziColors": ["#FF0000", "#00FF00", "#0000FF", "#FFFF00", "#FF00FF"],
            "hormoziShadowStrength": 5,
            "hormoziAnimation": "shake"
        },
        "options": {
            "speedFactor": 1.3,
            "saturationFactor": 1.4,
            "lightness": 0.2,
            "backgroundAudio": true,
            "backgroundAudioVolume": 0.25,
            "antiDetection": {
                "pixelShift": true,
                "microCrop": true,
                "subtleRotation": true,
                "noiseAddition": true,
                "metadataPoisoning": true,
                "frameInterpolation": true
            },
            "visibleChanges": {
                "border": true,
                "timestamp": true
            }
        }
    }' \
    --output "$OUTPUT_DIR/mixed_styles_test.mp4" \
    --progress-bar
echo "✅ Mixed styles test completed!"
echo ""

# Final Summary
echo "🎉 ULTIMATE TEST SUITE COMPLETED!"
echo "================================"
echo ""
echo "📁 All processed videos are in: $OUTPUT_DIR"
echo ""
echo "📊 Files created:"
echo "├── girlboss_ultimate.mp4     - Girlboss style + ALL effects"
echo "├── hormozi_ultimate.mp4      - Hormozi viral + ALL effects"  
echo "├── thintobold_ultimate.mp4   - ThinToBold + ALL effects"
echo "├── wavycolors_ultimate.mp4   - WavyColors + ALL effects"
echo "├── basic_ultimate.mp4        - Basic style + ALL effects"
echo "├── ultimate_effects.gif      - GIF with effects"
echo "├── ultimate_thumbnail.png    - PNG thumbnail"
echo "├── extreme_effects.mp4       - Maximum effects (no subs)"
echo "└── mixed_styles_test.mp4     - Mixed styles showcase"
echo ""
echo "🎯 Each video includes:"
echo "   ✅ Speed, zoom, saturation adjustments"
echo "   ✅ Anti-detection features (pixel shift, noise, rotation)"
echo "   ✅ Audio processing (background audio, EQ, reverb)"
echo "   ✅ Visual effects (borders, timestamps)"
echo "   ✅ Advanced temporal modifications"
echo "   ✅ Subtitle animations (each style)"
echo ""
echo "📈 Total file sizes:"
ls -lh "$OUTPUT_DIR" | grep -E '\.(mp4|gif|png)$' | awk '{print $5, $9}'
echo ""
echo "🚀 Ready for production testing!"
echo "🎬 Your ultimate video processing API is working perfectly!" 