#!/bin/bash

# Single Word Mode Test Script
# Tests each animation style with single word mode (each word appears individually)
# Usage: ./test-word-mode-single.sh [style_name]
# Example: ./test-word-mode-single.sh girlboss

API_URL="http://localhost:3000/api/encode"
OUTPUT_DIR="./test_outputs_single"
TEST_VIDEO="https://dkkaakuajsyehonlipbu.supabase.co/storage/v1/object/public/videos/tiktok/6736250773027767302/7362188339048353066"

# Get style from command line argument or default to girlboss
STYLE=${1:-girlboss}

# Create output directory
mkdir -p "$OUTPUT_DIR"

echo "🎬 Single Word Mode Test - $STYLE"
echo "====================================="
echo "🔤 Word Mode: SINGLE (each word appears individually)"
echo "Video: $TEST_VIDEO"
echo "Output: $OUTPUT_DIR/${STYLE}_single_word.mp4"
echo ""

# Show font assignment for this style
case $STYLE in
    "girlboss"|"hormozi"|"wavycolors")
        echo "✨ Font: Luckiest Guy (Bold, Impact style)"
        ;;
    "thintobold")
        echo "🎨 Font: Montserrat Thin → Montserrat + 120% scaling (Elegant transformation)"
        ;;
    "basic")
        echo "📝 Font: Arial (Professional, Clean)"
        ;;
esac
echo ""

# Function to test different styles with single word mode
test_single_word_style() {
    local style="$1"
    local output_name="${style}_single_word"
    
    echo "🚀 Testing $style style with SINGLE WORD MODE..."
    echo "📋 Each word will appear individually with full styling"
    
    case $style in
        "girlboss")
            curl -X POST "$API_URL" \
                -H "Content-Type: application/json" \
                -d '{
                    "url": "'$TEST_VIDEO'",
                    "outputName": "'$output_name'",
                    "format": "mp4",
                    "caption": {
                        "srtContent": "1\n00:00:00,000 --> 00:00:06,000\nThis is amazing girlboss energy right here\n\n2\n00:00:06,000 --> 00:00:12,000\nEach word appears with stunning visual effects",
                        "subtitleStyle": "girlboss",
                        "fontFamily": "Luckiest Guy",
                        "fontSize": 48,
                        "girlbossColor": "#FF1493",
                        "girlbossShadowStrength": 2.0,
                        "girlbossAnimation": "shake",
                        "verticalPosition": 18,
                        "outlineWidth": 3,
                        "outlineColor": "#000000",
                        "outlineBlur": 1,
                        "wordMode": "single",
                        "wordsPerGroup": 1
                    }
                }' \
                --output "$OUTPUT_DIR/${output_name}.mp4" \
                --progress-bar
            ;;
        "hormozi")
            curl -X POST "$API_URL" \
                -H "Content-Type: application/json" \
                -d '{
                    "url": "'$TEST_VIDEO'",
                    "outputName": "'$output_name'",
                    "format": "mp4",
                    "caption": {
                        "srtContent": "1\n00:00:00,000 --> 00:00:08,000\nAttention entrepreneurs this revolutionary system will absolutely change everything completely forever\n\n2\n00:00:08,000 --> 00:00:16,000\nWatch every single word appear with maximum viral energy and alternating colors guaranteed",
                        "subtitleStyle": "hormozi",
                        "fontFamily": "Luckiest Guy",
                        "fontSize": 50,
                        "hormoziColors": ["#00FF00", "#FF0000", "#0080FF", "#FFFF00"],
                        "hormoziShadowStrength": 3.5,
                        "hormoziAnimation": "shake",
                        "verticalPosition": 15,
                        "outlineWidth": 2,
                        "outlineColor": "#000000",
                        "outlineBlur": 0,
                        "wordMode": "single",
                        "wordsPerGroup": 1
                    }
                }' \
                --output "$OUTPUT_DIR/${output_name}.mp4" \
                --progress-bar
            ;;
        "thintobold")
            curl -X POST "$API_URL" \
                -H "Content-Type: application/json" \
                -d '{
                    "url": "'$TEST_VIDEO'",
                    "outputName": "'$output_name'",
                    "format": "mp4",
                    "caption": {
                        "srtContent": "1\n00:00:00,000 --> 00:00:06,000\nElegant professional presentation with sophisticated styling\n\n2\n00:00:06,000 --> 00:00:12,000\nEach word showcases refined typography excellence",
                        "subtitleStyle": "thintobold",
                        "fontFamily": "Montserrat Thin",
                        "fontSize": 50,
                        "thinToBoldColor": "#FFFFFF",
                        "thinToBoldShadowStrength": 1.8,
                        "thinToBoldAnimation": "none",
                        "verticalPosition": 22,
                        "outlineWidth": 2,
                        "outlineColor": "#000000",
                        "outlineBlur": 1,
                        "wordMode": "single",
                        "wordsPerGroup": 1
                    }
                }' \
                --output "$OUTPUT_DIR/${output_name}.mp4" \
                --progress-bar
            ;;
        "wavycolors")
            curl -X POST "$API_URL" \
                -H "Content-Type: application/json" \
                -d '{
                    "url": "'$TEST_VIDEO'",
                    "outputName": "'$output_name'",
                    "format": "mp4",
                    "caption": {
                        "srtContent": "1\n00:00:00,000 --> 00:00:06,000\nRainbow colors flowing through amazing wavy magic\n\n2\n00:00:06,000 --> 00:00:12,000\nEach word cycles through beautiful color transformations",
                        "subtitleStyle": "wavycolors",
                        "fontFamily": "Luckiest Guy",
                        "fontSize": 50,
                        "wavyColorsOutlineWidth": 3,
                        "verticalPosition": 12,
                        "outlineWidth": 2,
                        "outlineColor": "#000000",
                        "outlineBlur": 1,
                        "wordMode": "single",
                        "wordsPerGroup": 1
                    }
                }' \
                --output "$OUTPUT_DIR/${output_name}.mp4" \
                --progress-bar
            ;;
        "basic")
            curl -X POST "$API_URL" \
                -H "Content-Type: application/json" \
                -d '{
                    "url": "'$TEST_VIDEO'",
                    "outputName": "'$output_name'",
                    "format": "mp4",
                    "caption": {
                        "srtContent": "1\n00:00:00,000 --> 00:00:06,000\nProfessional content with clean simple presentation\n\n2\n00:00:06,000 --> 00:00:12,000\nEach word appears with traditional subtitle styling",
                        "subtitleStyle": "basic",
                        "fontSize": 48,
                        "fontColor": "white",
                        "fontStyle": "bold",
                        "subtitlePosition": "bottom",
                        "horizontalAlignment": "center",
                        "verticalPosition": 35,
                        "showBackground": true,
                        "backgroundColor": "black@0.8",
                        "outlineWidth": 3,
                        "outlineColor": "#000000",
                        "outlineBlur": 0,
                        "wordMode": "single",
                        "wordsPerGroup": 1
                    }
                }' \
                --output "$OUTPUT_DIR/${output_name}.mp4" \
                --progress-bar
            ;;
        *)
            echo "❌ Unknown style: $style"
            echo "Available styles: girlboss, hormozi, thintobold, wavycolors, basic"
            exit 1
            ;;
    esac
    
    if [ $? -eq 0 ]; then
        echo "✅ $style single word mode test completed successfully!"
        echo "📁 Output file: $OUTPUT_DIR/${output_name}.mp4"
        
        # Show file size
        if [ -f "$OUTPUT_DIR/${output_name}.mp4" ]; then
            size=$(ls -lh "$OUTPUT_DIR/${output_name}.mp4" | awk '{print $5}')
            echo "📊 File size: $size"
        fi
        
        echo ""
        echo "🎯 Expected Result:"
        echo "   - Each word should appear individually"
        echo "   - Words should have equal timing distribution"
        echo "   - All style effects should be preserved per word"
        echo "   - Animations should apply to each individual word"
    else
        echo "❌ $style single word mode test failed!"
    fi
}

# Test the specified style
test_single_word_style "$STYLE"

echo ""
echo "💡 Usage examples:"
echo "   ./test-word-mode-single.sh girlboss"
echo "   ./test-word-mode-single.sh hormozi"
echo "   ./test-word-mode-single.sh thintobold"
echo "   ./test-word-mode-single.sh wavycolors"
echo "   ./test-word-mode-single.sh basic"
echo ""
echo "🔤 Word Mode: SINGLE"
echo "📝 Description: Each word appears individually with its own timing"
echo "⏱️  Timing: Original subtitle duration ÷ number of words = time per word" 