#!/bin/bash

# Multiple Word Mode Test Script
# Tests each animation style with multiple word mode (3 words per group)
# Usage: ./test-word-mode-multiple.sh [style_name]
# Example: ./test-word-mode-multiple.sh girlboss

API_URL="http://localhost:3000/api/encode"
OUTPUT_DIR="./test_outputs_single"
TEST_VIDEO="https://dkkaakuajsyehonlipbu.supabase.co/storage/v1/object/public/videos/tiktok/6736250773027767302/7362188339048353066"

# Get style from command line argument or default to girlboss
STYLE=${1:-girlboss}
WORDS_PER_GROUP=3

# Create output directory
mkdir -p "$OUTPUT_DIR"

echo "🎬 Multiple Word Mode Test - $STYLE"
echo "======================================="
echo "🔤 Word Mode: MULTIPLE ($WORDS_PER_GROUP words per group)"
echo "Video: $TEST_VIDEO"
echo "Output: $OUTPUT_DIR/${STYLE}_multiple_word.mp4"
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

# Function to test different styles with multiple word mode
test_multiple_word_style() {
    local style="$1"
    local output_name="${style}_multiple_word"
    
    echo "🚀 Testing $style style with MULTIPLE WORD MODE..."
    echo "📋 Words will appear in groups of $WORDS_PER_GROUP with full styling"
    
    case $style in
        "girlboss")
            curl -X POST "$API_URL" \
                -H "Content-Type: application/json" \
                -d '{
                    "url": "'$TEST_VIDEO'",
                    "outputName": "'$output_name'",
                    "format": "mp4",
                    "caption": {
                        "srtContent": "1\n00:00:00,000 --> 00:00:09,000\nThis amazing girlboss energy flows through stunning visual effects perfectly\n\n2\n00:00:09,000 --> 00:00:18,000\nEvery word group showcases the incredible power of modern typography animations",
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
                        "wordMode": "multiple",
                        "wordsPerGroup": '$WORDS_PER_GROUP'
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
                        "srtContent": "1\n00:00:00,000 --> 00:00:12,000\nAttention entrepreneurs this revolutionary system will absolutely change everything completely forever and transform your business\n\n2\n00:00:12,000 --> 00:00:24,000\nWatch these incredible word groups appear with maximum viral energy impact guaranteed to showcase perfect color alternation",
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
                        "wordMode": "multiple",
                        "wordsPerGroup": '$WORDS_PER_GROUP'
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
                        "srtContent": "1\n00:00:00,000 --> 00:00:09,000\nElegant professional presentation showcases sophisticated styling through refined typography excellence\n\n2\n00:00:09,000 --> 00:00:18,000\nEach carefully crafted word group demonstrates the ultimate power of modern design principles",
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
                        "wordMode": "multiple",
                        "wordsPerGroup": '$WORDS_PER_GROUP'
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
                        "srtContent": "1\n00:00:00,000 --> 00:00:09,000\nRainbow colors flowing through amazing wavy magic creates spectacular visual experiences\n\n2\n00:00:09,000 --> 00:00:18,000\nEach vibrant word group cycles through beautiful color transformations with perfect timing",
                        "subtitleStyle": "wavycolors",
                        "fontFamily": "Luckiest Guy",
                        "fontSize": 50,
                        "wavyColorsOutlineWidth": 3,
                        "verticalPosition": 12,
                        "outlineWidth": 2,
                        "outlineColor": "#000000",
                        "outlineBlur": 1,
                        "wordMode": "multiple",
                        "wordsPerGroup": '$WORDS_PER_GROUP'
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
                        "srtContent": "1\n00:00:00,000 --> 00:00:09,000\nProfessional content demonstrates clean simple presentation through organized word grouping\n\n2\n00:00:09,000 --> 00:00:18,000\nEach word group maintains traditional subtitle styling while improving reading comprehension flow",
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
                        "wordMode": "multiple",
                        "wordsPerGroup": '$WORDS_PER_GROUP'
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
        echo "✅ $style multiple word mode test completed successfully!"
        echo "📁 Output file: $OUTPUT_DIR/${output_name}.mp4"
        
        # Show file size
        if [ -f "$OUTPUT_DIR/${output_name}.mp4" ]; then
            size=$(ls -lh "$OUTPUT_DIR/${output_name}.mp4" | awk '{print $5}')
            echo "📊 File size: $size"
        fi
        
        echo ""
        echo "🎯 Expected Result:"
        echo "   - Words should appear in groups of $WORDS_PER_GROUP"
        echo "   - Each group should have equal timing distribution"
        echo "   - All style effects should be preserved per group"
        echo "   - Animations should apply to each word group"
        echo "   - Better reading flow compared to single word mode"
    else
        echo "❌ $style multiple word mode test failed!"
    fi
}

# Test the specified style
test_multiple_word_style "$STYLE"

echo ""
echo "💡 Usage examples:"
echo "   ./test-word-mode-multiple.sh girlboss"
echo "   ./test-word-mode-multiple.sh hormozi"
echo "   ./test-word-mode-multiple.sh thintobold"
echo "   ./test-word-mode-multiple.sh wavycolors"
echo "   ./test-word-mode-multiple.sh basic"
echo ""
echo "🔤 Word Mode: MULTIPLE"
echo "📝 Description: Words appear in groups of $WORDS_PER_GROUP for better reading flow"
echo "⏱️  Timing: Original subtitle duration ÷ number of groups = time per group"
echo "📚 Benefits: Improved comprehension while maintaining word-level control" 