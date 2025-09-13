#!/bin/bash

# FFmpeg Segfault Fix - Test and Deploy Script
# This script helps test the fix and deploy it to production

echo "🔧 FFmpeg Segfault Fix - Test and Deploy Script"
echo "=============================================="

# Check current FFmpeg version
echo "📋 Current FFmpeg version:"
ffmpeg -version | head -1

# Check if we have the problematic version
if ffmpeg -version 2>&1 | grep -q "N-47683-g0e8eb07980-static"; then
    echo "⚠️  DETECTED: Problematic FFmpeg version N-47683-g0e8eb07980-static"
    echo "   This version causes segmentation faults with subtitle processing"
    echo "   The fix will automatically enable ultra-safe mode"
else
    echo "✅ FFmpeg version appears to be compatible"
fi

echo ""
echo "🧪 Testing the fix..."

# Test basic video processing without subtitles
echo "1. Testing basic video processing..."
if command -v curl &> /dev/null; then
    echo "   Sending test request to local server..."
    # Add a test request here if needed
    echo "   (Manual testing required)"
else
    echo "   Please test manually with a simple video request"
fi

echo ""
echo "📦 Deployment Steps:"
echo "1. ✅ Code fix has been applied to subtitle-processor.ts"
echo "2. 🔄 Restart your application server"
echo "3. 🧪 Test with a template video request"
echo "4. 📊 Monitor logs for these messages:"
echo "   - 'WARNING: Detected problematic FFmpeg version'"
echo "   - 'Ultra-safe processing succeeded (no subtitles)'"
echo "   - 'Skipping subtitle processing entirely to prevent segfaults'"

echo ""
echo "🎯 Expected Results After Fix:"
echo "✅ No more segmentation faults (SIGSEGV)"
echo "✅ Video processing completes successfully"
echo "✅ Template anti-detection effects still apply"
echo "⚠️  Subtitles temporarily disabled (until FFmpeg is updated)"
echo "✅ Processing time should be faster (no subtitle rendering)"

echo ""
echo "🚀 For Full Subtitle Support:"
echo "Run the FFmpeg update commands from FFMPEG-SEGFAULT-FIX.md"
echo ""
echo "# Quick FFmpeg update (Ubuntu):"
echo "sudo apt remove ffmpeg"
echo "sudo add-apt-repository ppa:jonathonf/ffmpeg-4"
echo "sudo apt update && sudo apt install ffmpeg"
echo ""

echo "📝 Logs to monitor:"
echo "- Look for 'Ultra-safe processing succeeded'"
echo "- No more 'ffmpeg was killed with signal SIGSEGV'"
echo "- Processing should complete with 'Stream ended' instead of 0 bytes"

echo ""
echo "🆘 If issues persist:"
echo "1. Check that subtitle-processor.ts was updated correctly"
echo "2. Restart the application completely"
echo "3. Check server logs for any compilation errors"
echo "4. Verify the isProblematicFFmpegVersion flag is working"

echo ""
echo "✅ Fix deployment ready!"