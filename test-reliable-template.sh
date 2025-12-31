#!/bin/bash

# Test Reliable Template Functionality Script
# Tests the new reliable template-based API that follows encode.ts pattern
# Usage: ./test-reliable-template.sh [template_name]

API_URL="http://localhost:3000/api/encode-template"
OUTPUT_DIR="./reliable_template_outputs"
TEST_VIDEO="https://dkkaakuajsyehonlipbu.supabase.co/storage/v1/object/public/videos/tiktok/6736250773027767302/7362188339048353066"

# Create output directory
mkdir -p "$OUTPUT_DIR"

echo "🎬 Testing Reliable Template-Based Video Processing"
echo "=================================================="
echo "Video: $TEST_VIDEO"
echo "API: $API_URL"
echo ""

# Function to test template functionality
test_template() {
    local template="$1"
    local srt_content="$2"
    local output_name="${template}_reliable_test"
    
    echo "🚀 Testing $template template (reliable endpoint)..."
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
        
        # Show file size and basic validation
        if [ -f "$OUTPUT_DIR/${output_name}.mp4" ]; then
            size=$(ls -lh "$OUTPUT_DIR/${output_name}.mp4" | awk '{print $5}')
            echo "📊 File size: $size"
            
            # Basic video validation
            file_size_bytes=$(wc -c < "$OUTPUT_DIR/${output_name}.mp4")
            if [ $file_size_bytes -gt 1000 ]; then
                echo "✅ File appears to be a valid video (>1KB)"
            else
                echo "⚠️  Warning: File is very small, might be corrupted"
            fi
        fi
    else
        echo ""
        echo "❌ $template template test failed!"
    fi
    echo ""
}

# Get template from command line or default to girlboss
TEMPLATE=${1:-girlboss}

# First, list available templates
echo "📋 Available templates:"
curl -X GET "$API_URL" -s | jq '.templates[]? | {name: .name, key: .key, description: .description}' 2>/dev/null || echo "Templates available (install jq for formatted output)"
echo ""

if [ "$TEMPLATE" = "list" ]; then
    echo "Use: ./test-reliable-template.sh [template_name]"
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
Reliable template works! 👑

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
Reliable system is LIVE! 🔥

3
00:00:05,000 --> 00:00:07,500
This WORKS perfectly! 💎"
        ;;
    "basic")
        SRT_CONTENT="1
00:00:00,000 --> 00:00:03,000
Reliable Professional Template

2
00:00:03,000 --> 00:00:06,000
Clean and Simple Design

3
00:00:06,000 --> 00:00:09,000
Perfect for Business Use"
        ;;
    *)
        SRT_CONTENT="1
00:00:00,000 --> 00:00:03,000
Welcome to reliable templates! ✨

2
00:00:03,000 --> 00:00:06,000
Testing the $TEMPLATE style 🎬

3
00:00:06,000 --> 00:00:09,000
Should work perfectly! 🔥"
        ;;
esac

# Run the test
test_template "$TEMPLATE" "$SRT_CONTENT"

echo "💡 Usage examples:"
echo "   ./test-reliable-template.sh girlboss"
echo "   ./test-reliable-template.sh hormozi"
echo "   ./test-reliable-template.sh basic"
echo "   ./test-reliable-template.sh list        # Show available templates"
echo ""
echo "🔗 API Endpoints (reliable version):"
echo "   GET  $API_URL    # List templates"
echo "   POST $API_URL    # Process with template"
echo ""
echo "📝 Required fields for POST:"
echo "   - url: Video URL"
echo "   - srtContent: SRT subtitle content"
echo "   - templateName: Template name"
echo "   - outputName: Output filename (optional)"
echo ""
echo "🎯 Testing your exact failing request:"
echo "curl -X POST $API_URL -H \"Content-Type: application/json\" -d '{"
echo "  \"url\": \"$TEST_VIDEO\","
echo "  \"srtContent\": \"1\\n00:00:00,000 --> 00:00:03,000\\nGIRLBOSS ENERGY! 💅✨\\n\\n2\\n00:00:03,000 --> 00:00:06,000\\nOWN YOUR POWER! 👑\","
echo "  \"templateName\": \"girlboss\""
echo "}' --output test_girlboss.mp4" 