#!/bin/bash

# Fixed Template Test Script
# Tests all templates with proper error handling to prevent corrupt files
# Usage: ./test-all-templates-fixed.sh

API_URL="http://localhost:3000/api/encode-template"
OUTPUT_DIR="./all_templates_test_fixed"
TEST_VIDEO="https://dkkaakuajsyehonlipbu.supabase.co/storage/v1/object/public/videos/tiktok/6736250773027767302/7362188339048353066"

# Create output directory
mkdir -p "$OUTPUT_DIR"

echo "🎬 Testing All Template Styles (Fixed Version)"
echo "==============================================="
echo "Video: $TEST_VIDEO"
echo "Output Directory: $OUTPUT_DIR"
echo "API: $API_URL"
echo ""

# Function to test a template with proper error handling
test_template_fixed() {
    local template="$1"
    local srt_content="$2"
    local output_name="${template}_test"
    
    echo "🚀 Testing $template template..."
    
    # Create temporary files for response and headers
    local temp_response="/tmp/response_${template}.tmp"
    local temp_headers="/tmp/headers_${template}.tmp"
    
    # Make the API request with headers capture
    curl -X POST "$API_URL" \
        -H "Content-Type: application/json" \
        -d "{
            \"url\": \"$TEST_VIDEO\",
            \"srtContent\": \"$srt_content\",
            \"templateName\": \"$template\",
            \"outputName\": \"$output_name\"
        }" \
        -D "$temp_headers" \
        -o "$temp_response" \
        -s -w "HTTP_CODE:%{http_code};SIZE:%{size_download}"
    
    local curl_output="$?"
    local response_info=$(cat)
    
    # Extract HTTP code and size from curl output
    local http_code=$(echo "$response_info" | grep -o "HTTP_CODE:[0-9]*" | cut -d: -f2)
    local response_size=$(echo "$response_info" | grep -o "SIZE:[0-9]*" | cut -d: -f2)
    
    echo "HTTP Code: $http_code, Size: $response_size bytes"
    
    # Check if request was successful
    if [ "$curl_output" -ne 0 ]; then
        echo "❌ $template: cURL request failed"
        cleanup_temp_files "$temp_response" "$temp_headers"
        return 1
    fi
    
    # Check HTTP status code
    if [ "$http_code" != "200" ]; then
        echo "❌ $template: HTTP error $http_code"
        if [ -f "$temp_response" ]; then
            echo "Error response:"
            cat "$temp_response"
        fi
        cleanup_temp_files "$temp_response" "$temp_headers"
        return 1
    fi
    
    # Check content type
    local content_type=$(grep -i "content-type" "$temp_headers" | cut -d: -f2 | tr -d ' \r\n' | head -1)
    echo "Content-Type: $content_type"
    
    # Validate response size
    if [ "$response_size" -lt 1000 ]; then
        echo "⚠️  $template: Response too small ($response_size bytes), likely an error"
        if [ -f "$temp_response" ]; then
            echo "Response content:"
            head -c 500 "$temp_response"
        fi
        cleanup_temp_files "$temp_response" "$temp_headers"
        return 1
    fi
    
    # Check if content type indicates video
    if [[ "$content_type" == *"video"* ]] || [[ "$content_type" == *"octet-stream"* ]] || [[ "$content_type" == *"mp4"* ]]; then
        # Content type looks good, check file signature
        local file_type=$(file "$temp_response")
        
        if echo "$file_type" | grep -q "MP4\|ISO Media\|video"; then
            # Valid video file, move to output directory
            mv "$temp_response" "$OUTPUT_DIR/${output_name}.mp4"
            local final_size=$(ls -lh "$OUTPUT_DIR/${output_name}.mp4" | awk '{print $5}')
            echo "✅ $template: SUCCESS - Valid video file ($final_size)"
            cleanup_temp_files "" "$temp_headers"
            return 0
        else
            echo "❌ $template: File doesn't appear to be a valid video"
            echo "File type: $file_type"
            cleanup_temp_files "$temp_response" "$temp_headers"
            return 1
        fi
    else
        # Wrong content type, probably JSON error
        echo "❌ $template: Wrong content type (expected video, got $content_type)"
        if [ -f "$temp_response" ]; then
            echo "Response content:"
            head -c 500 "$temp_response"
        fi
        cleanup_temp_files "$temp_response" "$temp_headers"
        return 1
    fi
}

# Helper function to cleanup temporary files
cleanup_temp_files() {
    local response_file="$1"
    local headers_file="$2"
    
    [ -f "$response_file" ] && rm -f "$response_file"
    [ -f "$headers_file" ] && rm -f "$headers_file"
}

# Test content for different templates (updated for your word settings)
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

echo "📋 Testing all 8 templates with error validation..."
echo ""

# Test all templates
success_count=0
total_count=8

echo "Testing girlboss..."
test_template_fixed "girlboss" "$GIRLBOSS_SRT" && ((success_count++))

echo "Testing hormozi..."
test_template_fixed "hormozi" "$HORMOZI_SRT" && ((success_count++))

echo "Testing tiktokstyle..."
test_template_fixed "tiktokstyle" "$TIKTOK_SRT" && ((success_count++))

echo "Testing thintobold..."
test_template_fixed "thintobold" "$THINTOBOLD_SRT" && ((success_count++))

echo "Testing wavycolors..."
test_template_fixed "wavycolors" "$WAVYCOLORS_SRT" && ((success_count++))

echo "Testing shrinkingpairs..."
test_template_fixed "shrinkingpairs" "$SHRINKINGPAIRS_SRT" && ((success_count++))

echo "Testing revealenlarge..."
test_template_fixed "revealenlarge" "$REVEALENLARGE_SRT" && ((success_count++))

echo "Testing basic..."
test_template_fixed "basic" "$BASIC_SRT" && ((success_count++))

echo ""
echo "🎉 Template testing completed!"
echo "📊 Results: $success_count/$total_count templates successful"
echo ""

if [ "$success_count" -gt 0 ]; then
    echo "📂 Valid video files created in '$OUTPUT_DIR':"
    ls -lh "$OUTPUT_DIR"/*.mp4 2>/dev/null | awk '{print "   " $9 ": " $5}' || echo "   No valid videos created"
else
    echo "❌ No valid videos were created. Run ./debug-template-api.sh to diagnose issues."
fi

echo ""
echo "💡 If videos are still corrupt, try:"
echo "   1. ./debug-template-api.sh girlboss  # Diagnose specific issues"
echo "   2. Check server logs for errors"
echo "   3. Verify API endpoint is working: curl -X GET $API_URL" 