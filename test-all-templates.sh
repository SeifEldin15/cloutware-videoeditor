#!/bin/bash

# Test All Templates Script
# Generates videos with all 8 template styles to test functionality
# Usage: ./test-all-templates.sh

API_URL="http://localhost:3000/api/encode-template"
OUTPUT_DIR="./all_templates_test"
TEST_VIDEO="https://dkkaakuajsyehonlipbu.supabase.co/storage/v1/object/public/videos/tiktok/6736250773027767302/7362188339048353066"

# Create output directory
mkdir -p "$OUTPUT_DIR"

echo "🎬 Testing All Template Styles"
echo "==============================="
echo "Video: $TEST_VIDEO"
echo "Output Directory: $OUTPUT_DIR"
echo "API: $API_URL"
echo ""

# Function to test a template
test_template() {
    local template="$1"
    local srt_content="$2"
    local output_name="${template}_test"
    
    echo "🚀 Testing $template template..."
    
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
        if [ -f "$OUTPUT_DIR/${output_name}.mp4" ]; then
            size=$(ls -lh "$OUTPUT_DIR/${output_name}.mp4" | awk '{print $5}')
            file_size_bytes=$(wc -c < "$OUTPUT_DIR/${output_name}.mp4")
            
            if [ $file_size_bytes -gt 1000 ]; then
                echo "✅ $template: SUCCESS - $size"
            else
                echo "⚠️  $template: File too small (${size}) - might be corrupted"
            fi
        else
            echo "❌ $template: File not created"
        fi
    else
        echo "❌ $template: API request failed"
    fi
    echo ""
}

# Test content for different templates
GIRLBOSS_SRT="1
00:00:00,000 --> 00:00:03,000
GIRLBOSS ENERGY TAKES OVER! 💅✨

2
00:00:03,000 --> 00:00:06,000
OWN YOUR POWER RIGHT NOW! 👑

3
00:00:06,000 --> 00:00:09,000
MANIFEST YOUR DREAMS TODAY! ⭐"

HORMOZI_SRT="1
00:00:00,000 --> 00:00:02,500
ATTENTION EVERYONE RIGHT NOW! 🚨💰

2
00:00:02,500 --> 00:00:05,000
This will CHANGE your ENTIRE LIFE! 🔥

3
00:00:05,000 --> 00:00:07,500
Don't miss this AMAZING OPPORTUNITY TODAY! 💎"

TIKTOK_SRT="1
00:00:00,000 --> 00:00:02,500
TIKTOK STYLE LOOKS SO GOOD! 🎵💫

2
00:00:02,500 --> 00:00:05,000
Single color VIBES ARE AMAZING! 🔥✨

3
00:00:05,000 --> 00:00:07,500
Social media CONTENT IS READY! 📱"

THINTOBOLD_SRT="1
00:00:00,000 --> 00:00:03,000
THIN TO BOLD TRANSFORMATION EFFECT

2
00:00:03,000 --> 00:00:06,000
ELEGANT TRANSITIONS LOOK VERY SOPHISTICATED

3
00:00:06,000 --> 00:00:09,000
PROFESSIONAL CONTENT STYLE WORKS PERFECTLY"

WAVYCOLORS_SRT="1
00:00:00,000 --> 00:00:04,000
RAINBOW COLORS CREATE AMAZING EFFECTS! 🌈✨

2
00:00:04,000 --> 00:00:08,000
WAVY MAGIC FLOWS BEAUTIFULLY EVERYWHERE! 🔮

3
00:00:08,000 --> 00:00:12,000
COLORFUL VIBES MAKE EVERYTHING BETTER! 🎨"

SHRINKINGPAIRS_SRT="1
00:00:00,000 --> 00:00:03,000
SHRINKING PAIRS EFFECT CREATES AMAZING VISUAL IMPACT

2
00:00:03,000 --> 00:00:06,000
WATCH IT SHRINK WITH PERFECT TIMING! ⚡

3
00:00:06,000 --> 00:00:09,000
DYNAMIC EFFECTS WORK BEAUTIFULLY HERE! 💥"

REVEALENLARGE_SRT="1
00:00:00,000 --> 00:00:03,000
REVEAL AND ENLARGE CREATES DRAMATIC EFFECTS! 🌟

2
00:00:03,000 --> 00:00:06,000
COLOR CYCLING MAGIC WORKS SO WELL! 🎨

3
00:00:06,000 --> 00:00:09,000
AMAZING EFFECTS REVEAL EVERYTHING PERFECTLY! ✨"

BASIC_SRT="1
00:00:00,000 --> 00:00:03,000
Professional Template Works Great For Business

2
00:00:03,000 --> 00:00:06,000
Clean and Simple Design Looks Perfect

3
00:00:06,000 --> 00:00:09,000
Perfect for Business and Corporate Content"

echo "📋 Testing all 8 templates..."
echo ""

# Test all templates
test_template "girlboss" "$GIRLBOSS_SRT"
test_template "hormozi" "$HORMOZI_SRT"
test_template "tiktokstyle" "$TIKTOK_SRT"
test_template "thintobold" "$THINTOBOLD_SRT"
test_template "wavycolors" "$WAVYCOLORS_SRT"
test_template "shrinkingpairs" "$SHRINKINGPAIRS_SRT"
test_template "revealenlarge" "$REVEALENLARGE_SRT"
test_template "basic" "$BASIC_SRT"

echo "🎉 All template tests completed!"
echo ""
echo "📂 Check the '$OUTPUT_DIR' directory for output videos:"
echo "   - girlboss_test.mp4 (multiple words, 2 per group)"
echo "   - hormozi_test.mp4 (multiple words, 4 per group)"
echo "   - tiktokstyle_test.mp4 (multiple words, 2 per group)"
echo "   - thintobold_test.mp4 (normal mode, 4 words)"
echo "   - wavycolors_test.mp4 (multiple words, 1 per group)"
echo "   - shrinkingpairs_test.mp4 (multiple words, 4 per group)"
echo "   - revealenlarge_test.mp4 (multiple words, 4 per group)"
echo "   - basic_test.mp4 (normal mode, 1 word)"
echo ""
echo "📊 File sizes summary:"
ls -lh "$OUTPUT_DIR"/*.mp4 2>/dev/null | awk '{print $9 ": " $5}' || echo "No files generated" 