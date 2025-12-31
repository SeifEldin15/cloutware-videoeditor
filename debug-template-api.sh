#!/bin/bash

# Debug Template API Script
# Diagnoses issues with template video generation
# Usage: ./debug-template-api.sh [template_name]

API_URL="http://localhost:3000/api/encode-template"
OUTPUT_DIR="./debug_outputs"
TEST_VIDEO="https://dkkaakuajsyehonlipbu.supabase.co/storage/v1/object/public/videos/tiktok/6736250773027767302/7362188339048353066"

# Get template from command line or default to girlboss
TEMPLATE=${1:-girlboss}

# Create output directory
mkdir -p "$OUTPUT_DIR"

echo "🔍 Debugging Template API"
echo "========================="
echo "Template: $TEMPLATE"
echo "API: $API_URL"
echo ""

# Step 1: Test API connectivity
echo "1️⃣ Testing API connectivity..."
response=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL")
if [ "$response" = "200" ]; then
    echo "✅ API is accessible (HTTP $response)"
else
    echo "❌ API not accessible (HTTP $response)"
    echo "💡 Make sure your server is running on port 3000"
    exit 1
fi
echo ""

# Step 2: List available templates
echo "2️⃣ Listing available templates..."
template_response=$(curl -s -X GET "$API_URL")
echo "Raw response:"
echo "$template_response"
echo ""

# Check if response looks like JSON (basic validation)
if [[ "$template_response" == *"{"* && "$template_response" == *"}"* ]]; then
    echo "✅ Templates response appears to be JSON"
    
    # Try to extract templates with jq if available
    if command -v jq >/dev/null 2>&1; then
        if echo "$template_response" | jq . > /dev/null 2>&1; then
            available_templates=$(echo "$template_response" | jq -r '.templates[]?.key // empty' | tr '\n' ' ')
            echo "Available templates: $available_templates"
        else
            echo "⚠️  Response has JSON-like structure but jq parsing failed"
            echo "Template names visible in response: $(echo "$template_response" | grep -o '"key": "[^"]*"' | cut -d'"' -f4 | tr '\n' ' ')"
        fi
    else
        echo "⚠️  jq not available, extracting template names manually"
        echo "Template names visible in response: $(echo "$template_response" | grep -o '"key": "[^"]*"' | cut -d'"' -f4 | tr '\n' ' ')"
    fi
else
    echo "❌ Templates response doesn't appear to be JSON"
    echo "Response content:"
    echo "$template_response"
    echo "⚠️  Continuing anyway to test video processing..."
fi
echo ""

# Step 3: Test video processing with detailed response
echo "3️⃣ Testing video processing with $TEMPLATE template..."

SRT_CONTENT="1
00:00:00,000 --> 00:00:03,000
TEST CONTENT FOR DEBUGGING

2
00:00:03,000 --> 00:00:06,000
THIS IS A SIMPLE TEST"

# Create request JSON
request_json="{
    \"url\": \"$TEST_VIDEO\",
    \"srtContent\": \"$SRT_CONTENT\",
    \"templateName\": \"$TEMPLATE\",
    \"outputName\": \"debug_test\"
}"

echo "Request JSON:"
echo "$request_json"
echo ""

# Make request and capture both headers and response
echo "Making API request..."
response_file="$OUTPUT_DIR/response.txt"
headers_file="$OUTPUT_DIR/headers.txt"

curl -X POST "$API_URL" \
    -H "Content-Type: application/json" \
    -d "$request_json" \
    -v \
    -D "$headers_file" \
    -o "$response_file" \
    2>&1

echo ""
echo "4️⃣ Analyzing response..."

# Check response headers
echo "Response headers:"
cat "$headers_file"
echo ""

# Check content type
content_type=$(grep -i "content-type" "$headers_file" | cut -d: -f2 | tr -d ' \r\n')
echo "Content-Type: $content_type"

# Check response size
response_size=$(wc -c < "$response_file")
echo "Response size: $response_size bytes"

# Check if response is JSON (error) or binary (video)
if [ "$response_size" -lt 1000 ]; then
    echo "⚠️  Response is very small, likely an error"
    echo "Response content:"
    cat "$response_file"
    echo ""
    
    # Try to parse as JSON
    if cat "$response_file" | jq . >/dev/null 2>&1; then
        echo "❌ Response is JSON error message:"
        cat "$response_file" | jq .
    fi
else
    echo "✅ Response is large enough to be a video"
    
    # Check first few bytes to see if it looks like MP4
    file_type=$(file "$response_file")
    echo "File type detection: $file_type"
    
    if echo "$file_type" | grep -q "MP4\|video"; then
        echo "✅ Response appears to be a valid video file"
        mv "$response_file" "$OUTPUT_DIR/debug_${TEMPLATE}.mp4"
        echo "📁 Saved as: $OUTPUT_DIR/debug_${TEMPLATE}.mp4"
    else
        echo "❌ Response doesn't appear to be a video file"
        echo "First 200 characters of response:"
        head -c 200 "$response_file"
        echo ""
    fi
fi

echo ""
echo "5️⃣ Recommendations:"

if [ "$response_size" -lt 1000 ] && cat "$response_file" | jq . >/dev/null 2>&1; then
    error_message=$(cat "$response_file" | jq -r '.error // .message // "Unknown error"')
    echo "❌ API returned error: $error_message"
    echo ""
    echo "💡 Possible solutions:"
    echo "   1. Check if template name '$TEMPLATE' exists"
    echo "   2. Verify video URL is accessible"
    echo "   3. Check server logs for detailed error messages"
    echo "   4. Test with simpler SRT content"
elif [ "$content_type" != "video/mp4" ] && [ "$content_type" != "application/octet-stream" ]; then
    echo "❌ Wrong content type: expected video/mp4, got $content_type"
    echo ""
    echo "💡 This suggests the API is not returning video data"
else
    echo "✅ API appears to be working correctly"
    echo "📁 Check the debug output file for the generated video"
fi

echo ""
echo "🔧 Debug files created in $OUTPUT_DIR:"
ls -la "$OUTPUT_DIR/" 