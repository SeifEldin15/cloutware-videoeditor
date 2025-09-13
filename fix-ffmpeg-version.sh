#!/bin/bash

# FFmpeg Version Fix - Install newer FFmpeg and dependencies
echo "🔧 Installing newer FFmpeg and fixing dependencies..."

# Add missing TypeScript types
echo "📦 Installing missing TypeScript types..."
pnpm add -D @types/fluent-ffmpeg

# Verify FFmpeg packages are installed
echo "🔍 Checking FFmpeg packages..."
if pnpm list ffmpeg-static | grep -q "ffmpeg-static"; then
    echo "✅ ffmpeg-static is installed"
else
    echo "❌ ffmpeg-static not found, installing..."
    pnpm add ffmpeg-static
fi

if pnpm list @ffmpeg-installer/ffmpeg | grep -q "@ffmpeg-installer/ffmpeg"; then
    echo "✅ @ffmpeg-installer/ffmpeg is installed"
else
    echo "❌ @ffmpeg-installer/ffmpeg not found, installing..."
    pnpm add @ffmpeg-installer/ffmpeg
fi

echo ""
echo "🧪 Testing FFmpeg versions..."

# Test the packaged FFmpeg versions
echo "📋 Checking packaged FFmpeg versions:"

# Check ffmpeg-static path
if [ -f "./node_modules/ffmpeg-static/ffmpeg" ]; then
    echo "✅ ffmpeg-static binary found at: ./node_modules/ffmpeg-static/ffmpeg"
    ./node_modules/ffmpeg-static/ffmpeg -version | head -1
else
    echo "❌ ffmpeg-static binary not found"
fi

# Check @ffmpeg-installer path
if [ -f "./node_modules/@ffmpeg-installer/ffmpeg/ffmpeg" ]; then
    echo "✅ @ffmpeg-installer binary found at: ./node_modules/@ffmpeg-installer/ffmpeg/ffmpeg"
    ./node_modules/@ffmpeg-installer/ffmpeg/ffmpeg -version | head -1
else
    echo "❌ @ffmpeg-installer binary not found"
fi

echo ""
echo "🔍 Checking system FFmpeg (this is the problematic one):"
if command -v ffmpeg >/dev/null 2>&1; then
    ffmpeg -version | head -1
    if ffmpeg -version 2>&1 | grep -q "N-47683-g0e8eb07980-static"; then
        echo "⚠️ FOUND: Problematic system FFmpeg version!"
        echo "   The application should now use the packaged version instead"
    fi
else
    echo "❌ No system FFmpeg found"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "🚀 Next steps:"
echo "1. Restart your application to use the newer FFmpeg"
echo "2. Test template processing - it should now work with subtitles"
echo "3. Monitor logs for '✅ Using newer FFmpeg from ffmpeg-static package'"
echo ""
echo "📝 Expected behavior:"
echo "✅ FFmpeg operations should complete without segfaults"
echo "✅ Subtitle processing should work normally"
echo "✅ Template effects will work with full functionality"