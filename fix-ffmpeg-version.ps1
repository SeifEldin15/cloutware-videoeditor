# FFmpeg Version Fix - PowerShell Script
# Install newer FFmpeg and fix dependencies

Write-Host "🔧 Installing newer FFmpeg and fixing dependencies..." -ForegroundColor Green

# Add missing TypeScript types
Write-Host "📦 Installing missing TypeScript types..." -ForegroundColor Blue
pnpm add -D "@types/fluent-ffmpeg"

# Verify FFmpeg packages are installed
Write-Host "🔍 Checking FFmpeg packages..." -ForegroundColor Blue

# Check ffmpeg-static
$ffmpegStaticCheck = pnpm list ffmpeg-static 2>$null
if ($ffmpegStaticCheck -match "ffmpeg-static") {
    Write-Host "✅ ffmpeg-static is installed" -ForegroundColor Green
} else {
    Write-Host "❌ ffmpeg-static not found, installing..." -ForegroundColor Red
    pnpm add ffmpeg-static
}

# Check @ffmpeg-installer/ffmpeg
$ffmpegInstallerCheck = pnpm list "@ffmpeg-installer/ffmpeg" 2>$null
if ($ffmpegInstallerCheck -match "@ffmpeg-installer/ffmpeg") {
    Write-Host "✅ @ffmpeg-installer/ffmpeg is installed" -ForegroundColor Green
} else {
    Write-Host "❌ @ffmpeg-installer/ffmpeg not found, installing..." -ForegroundColor Red
    pnpm add "@ffmpeg-installer/ffmpeg"
}

Write-Host ""
Write-Host "🧪 Testing FFmpeg versions..." -ForegroundColor Blue

# Test the packaged FFmpeg versions
Write-Host "📋 Checking packaged FFmpeg versions:" -ForegroundColor Blue

# Check ffmpeg-static path
$ffmpegStaticPath = ".\node_modules\ffmpeg-static\ffmpeg.exe"
if (Test-Path $ffmpegStaticPath) {
    Write-Host "✅ ffmpeg-static binary found at: $ffmpegStaticPath" -ForegroundColor Green
    & $ffmpegStaticPath -version | Select-Object -First 1
} else {
    Write-Host "❌ ffmpeg-static binary not found" -ForegroundColor Red
}

# Check @ffmpeg-installer path  
$ffmpegInstallerPath = ".\node_modules\@ffmpeg-installer\ffmpeg\ffmpeg.exe"
if (Test-Path $ffmpegInstallerPath) {
    Write-Host "✅ @ffmpeg-installer binary found at: $ffmpegInstallerPath" -ForegroundColor Green
    & $ffmpegInstallerPath -version | Select-Object -First 1
} else {
    Write-Host "❌ @ffmpeg-installer binary not found" -ForegroundColor Red
}

Write-Host ""
Write-Host "🔍 Checking system FFmpeg (this might be the problematic one):" -ForegroundColor Blue
if (Get-Command ffmpeg -ErrorAction SilentlyContinue) {
    $systemFFmpegVersion = ffmpeg -version 2>&1 | Select-Object -First 1
    Write-Host $systemFFmpegVersion
    if ($systemFFmpegVersion -match "N-47683-g0e8eb07980-static") {
        Write-Host "⚠️ FOUND: Problematic system FFmpeg version!" -ForegroundColor Yellow
        Write-Host "   The application should now use the packaged version instead" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ No system FFmpeg found" -ForegroundColor Red
}

Write-Host ""
Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 Next steps:" -ForegroundColor Blue
Write-Host "1. Restart your application to use the newer FFmpeg"
Write-Host "2. Test template processing - it should now work with subtitles"
Write-Host "3. Monitor logs for '✅ Using newer FFmpeg from ffmpeg-static package'"
Write-Host ""
Write-Host "📝 Expected behavior:" -ForegroundColor Blue
Write-Host "✅ FFmpeg operations should complete without segfaults" -ForegroundColor Green
Write-Host "✅ Subtitle processing should work normally" -ForegroundColor Green
Write-Host "✅ Template effects will work with full functionality" -ForegroundColor Green

Write-Host ""
Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")