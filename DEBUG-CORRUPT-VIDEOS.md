# 🔧 Debug Corrupt Videos Issue

This guide helps diagnose and fix the issue where template API calls generate corrupt video files.

## 🚨 The Problem

When running batch template tests, all generated `.mp4` files are corrupt. This typically happens because:

1. **API returns error responses** (JSON) instead of video data
2. **The bash script saves error responses as `.mp4` files** without validation
3. **Content-Type headers are ignored** during download

## 🔍 Quick Diagnosis

### Step 1: Run Diagnostic Script

**On Linux/Mac/WSL:**
```bash
./debug-template-api.sh girlboss
```

**On Windows PowerShell:**
```powershell
.\debug-template-api.ps1 girlboss
```

This will:
- ✅ Test API connectivity
- 📋 List available templates
- 🔍 Analyze response headers and content
- 💡 Provide specific recommendations

### Step 2: Check Server Status

Make sure your server is running:
```bash
# Check if server is running
curl http://localhost:3000/api/encode-template

# If server isn't running, start it:
npm run dev
# or
pnpm dev
```

## 🛠️ Fixed Template Testing

Use the fixed scripts that include proper error handling:

**Linux/Mac/WSL:**
```bash
./test-all-templates-fixed.sh
```

**Windows PowerShell:**
```powershell
# You'll need to create a PowerShell version or use WSL
```

The fixed script:
- ✅ Validates HTTP status codes
- ✅ Checks Content-Type headers
- ✅ Verifies file signatures (MP4 magic bytes)
- ✅ Only saves valid video files
- ❌ Rejects and reports error responses

## 🔍 Manual Debugging

### Check One Template Manually

```bash
# Test a single template with full output
curl -X POST http://localhost:3000/api/encode-template \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://dkkaakuajsyehonlipbu.supabase.co/storage/v1/object/public/videos/tiktok/6736250773027767302/7362188339048353066",
    "srtContent": "1\n00:00:00,000 --> 00:00:03,000\nTEST CONTENT",
    "templateName": "girlboss",
    "outputName": "debug_test"
  }' \
  -v \
  -o debug_response.mp4

# Check what was actually returned
file debug_response.mp4
head -c 200 debug_response.mp4
```

### Expected Good Response
- **HTTP Status:** `200 OK`
- **Content-Type:** `video/mp4` or `application/octet-stream`
- **File Size:** > 100KB (typically several MB)
- **File Signature:** Starts with MP4 magic bytes (`00 00 00 XX 66 74 79 70`)

### Common Error Responses
- **HTTP Status:** `400 Bad Request` or `500 Internal Server Error`
- **Content-Type:** `application/json`
- **File Size:** < 1KB
- **Content:** JSON error message like `{"error": "Template not found"}`

## 🧪 Test Individual Components

### 1. Test Template Listing
```bash
curl -X GET http://localhost:3000/api/encode-template
```
Should return available templates list.

### 2. Test Video URL Access
```bash
curl -I "https://dkkaakuajsyehonlipbu.supabase.co/storage/v1/object/public/videos/tiktok/6736250773027767302/7362188339048353066"
```
Should return `200 OK` with video content type.

### 3. Check Server Logs
Look for error messages in your development server console when making API requests.

## 💡 Common Solutions

### Issue: "Template not found"
- **Problem:** Template name doesn't match available templates
- **Solution:** Run `curl -X GET http://localhost:3000/api/encode-template` to see available templates

### Issue: "Invalid SRT format"
- **Problem:** SRT content has formatting issues
- **Solution:** Ensure proper SRT format with timestamps and numbering

### Issue: "Video processing failed"
- **Problem:** FFmpeg errors or video URL inaccessible
- **Solution:** Check video URL accessibility and FFmpeg installation

### Issue: "Server not responding"
- **Problem:** Development server not running
- **Solution:** Start server with `npm run dev` or `pnpm dev`

## 🔄 Working Example

Here's a complete working example that you can copy-paste:

```bash
#!/bin/bash
# Test single template with validation

API_URL="http://localhost:3000/api/encode-template"
TEMPLATE="girlboss"
OUTPUT_FILE="test_${TEMPLATE}.mp4"

echo "Testing $TEMPLATE template..."

# Make request and capture headers
response=$(curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://dkkaakuajsyehonlipbu.supabase.co/storage/v1/object/public/videos/tiktok/6736250773027767302/7362188339048353066",
    "srtContent": "1\n00:00:00,000 --> 00:00:03,000\nTEST CONTENT FOR GIRLBOSS TEMPLATE\n\n2\n00:00:03,000 --> 00:00:06,000\nAMAZING RESULTS COMING NOW!",
    "templateName": "'$TEMPLATE'",
    "outputName": "test_output"
  }' \
  -w "HTTP_CODE:%{http_code};CONTENT_TYPE:%{content_type};SIZE:%{size_download}" \
  -o "$OUTPUT_FILE" \
  -s)

# Parse response info
HTTP_CODE=$(echo "$response" | grep -o "HTTP_CODE:[0-9]*" | cut -d: -f2)
CONTENT_TYPE=$(echo "$response" | grep -o "CONTENT_TYPE:[^;]*" | cut -d: -f2-)
SIZE=$(echo "$response" | grep -o "SIZE:[0-9]*" | cut -d: -f2)

echo "HTTP Code: $HTTP_CODE"
echo "Content-Type: $CONTENT_TYPE"
echo "Size: $SIZE bytes"

# Validate response
if [ "$HTTP_CODE" = "200" ] && [ "$SIZE" -gt 1000 ]; then
    if file "$OUTPUT_FILE" | grep -q "MP4\|video"; then
        echo "✅ SUCCESS: Valid video file created!"
        ls -lh "$OUTPUT_FILE"
    else
        echo "❌ FAILED: File is not a valid video"
        head -c 200 "$OUTPUT_FILE"
    fi
else
    echo "❌ FAILED: API error"
    cat "$OUTPUT_FILE"
fi
```

## 📞 Need More Help?

1. **Run the diagnostic script first:** `./debug-template-api.sh`
2. **Check server logs** for detailed error messages
3. **Test with a single template** before batch processing
4. **Verify all dependencies** (FFmpeg, Node.js, etc.) are installed

The diagnostic scripts will give you specific error messages and recommendations for your particular issue. 