#!/bin/bash

# Test Template Functionality Script
# Tests the new template-based API with the provided example video
# Usage: ./test-template-functionality.sh [template_name]

API_URL="http://localhost:3000/api/encode-template"
OUTPUT_DIR="./template_test_outputs"
TEST_VIDEO="https://dkkaakuajsyehonlipbu.supabase.co/storage/v1/object/public/videos/tiktok/6736250773027767302/7362188339048353066"

# Create output directory
mkdir -p "$OUTPUT_DIR"

echo "🎬 Testing Template-Based Video Processing"
echo "=========================================="
echo "Video: $TEST_VIDEO"
echo "API: $API_URL"
echo ""

# Function to test template functionality
test_template() {
    local template="$1"
    local srt_content="$2"
    local output_name="${template}_template_test"
    
    echo "🚀 Testing $template template..."
    echo ""
    
    # Make the API request
    curl -X POST "$API_URL" \
        -H "Content-Type: application/json" \
        -d "{
            \"url\": \"$TEST_VIDEO\",
            \"srtContent\": \"$srt_content\",
            \"templateName\": \"$template\",
            \"outputName\": \"$output_name\"
        }" \
        --output "$OUTPUT_DIR/${output_name}.mp4" \
        --progress-bar
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ $template template test completed successfully!"
        echo "📁 Output file: $OUTPUT_DIR/${output_name}.mp4"
        
        # Show file size
        if [ -f "$OUTPUT_DIR/${output_name}.mp4" ]; then
            size=$(ls -lh "$OUTPUT_DIR/${output_name}.mp4" | awk '{print $5}')
            echo "📊 File size: $size"
        fi
    else
        echo ""
        echo "❌ $template template test failed!"
    fi
    echo ""
}

# Example SRT content
EXAMPLE_SRT="1
00:00:00,000 --> 00:00:03,000
Welcome to our template system! ✨

2
00:00:03,000 --> 00:00:06,000
This is a test of the $1 style 🎬

3
00:00:06,000 --> 00:00:09,000
Looks amazing, right? 🔥"

# Get template from command line or default to girlboss
TEMPLATE=${1:-girlboss}

# First, list available templates
echo "📋 Available templates:"
curl -X GET "$API_URL" -s | jq '.templates[]? | {name: .name, key: .key, description: .description}' 2>/dev/null || echo "Templates available (install jq for formatted output)"
echo ""

if [ "$TEMPLATE" = "list" ]; then
    echo "Use: ./test-template-functionality.sh [template_name]"
    echo "Available templates: girlboss, hormozi, tiktokstyle, thintobold, wavycolors, shrinkingpairs, revealenlarge, basic"
    exit 0
fi

# Test the specified template
echo "Testing with template: $TEMPLATE"
echo ""

# Customize SRT content for the template
case $TEMPLATE in
    "girlboss")
        SRT_CONTENT="1
00:00:00,000 --> 00:00:03,000
GIRLBOSS ENERGY! 💅✨

2
00:00:03,000 --> 00:00:06,000
Template system WORKS! 👑

3
00:00:06,000 --> 00:00:09,000
So POWERFUL! ⭐"
        ;;
    "hormozi")
        SRT_CONTENT="1
00:00:00,000 --> 00:00:02,500
ATTENTION! 🚨💰

2
00:00:02,500 --> 00:00:05,000
Template system is LIVE! 🔥

3
00:00:05,000 --> 00:00:07,500
This CHANGES everything! 💎"
        ;;
    "basic")
        SRT_CONTENT="1
00:00:00,000 --> 00:00:03,000
Professional Template

2
00:00:03,000 --> 00:00:06,000
Clean and Simple

3
00:00:06,000 --> 00:00:09,000
Perfect for Business"
        ;;
    *)
        SRT_CONTENT="$EXAMPLE_SRT"
        ;;
esac

# Run the test
test_template "$TEMPLATE" "$SRT_CONTENT"

echo "💡 Usage examples:"
echo "   ./test-template-functionality.sh girlboss"
echo "   ./test-template-functionality.sh hormozi"
echo "   ./test-template-functionality.sh basic"
echo "   ./test-template-functionality.sh list        # Show available templates"
echo ""
echo "🔗 API Endpoints:"
echo "   GET  $API_URL    # List templates"
echo "   POST $API_URL    # Process with template"
echo ""
echo "📝 Required fields for POST:"
echo "   - url: Video URL"
echo "   - srtContent: SRT subtitle content"
echo "   - templateName: Template name"
echo "   - outputName: Output filename (optional)" 