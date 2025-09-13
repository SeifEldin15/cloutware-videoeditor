# Quick Local Video Test Script - PowerShell Version
# Tests with your own video file or URL

param(
    [Parameter(Mandatory=$true)]
    [string]$VideoSource
)

$API_URL = "http://localhost:3000/api/encode"
$OUTPUT_DIR = "./test_outputs_local"

# Create output directory
New-Item -ItemType Directory -Force -Path $OUTPUT_DIR | Out-Null

Write-Host "🎬 Quick Video Processing Test" -ForegroundColor Magenta
Write-Host "===============================" -ForegroundColor Magenta
Write-Host "Video: $VideoSource" -ForegroundColor White
Write-Host "Output: $OUTPUT_DIR" -ForegroundColor White
Write-Host ""

# Test 1: Girlboss Style with Effects
Write-Host "🌸 Testing Girlboss Style..." -ForegroundColor Cyan
try {
    $girlbossBody = @{
        url = $VideoSource
        outputName = "girlboss_test"
        format = "mp4"
        options = @{
            speedFactor = 1.1
            saturationFactor = 1.2
            lightness = 0.1
            backgroundAudio = $true
            backgroundAudioVolume = 0.15
            antiDetection = @{
                pixelShift = $true
                microCrop = $true
                noiseAddition = $true
            }
        }
        caption = @{
            srtContent = "1`n00:00:00,000 --> 00:00:03,000`nGIRLBOSS ENERGY! 💅✨`n`n2`n00:00:03,000 --> 00:00:06,000`nOWN YOUR POWER! 👑"
            subtitleStyle = "girlboss"
            fontSize = 48
            girlbossColor = "#FF1493"
            girlbossShadowStrength = 2.0
            girlbossAnimation = "shake"
        }
    } | ConvertTo-Json -Depth 10

    Invoke-RestMethod -Uri $API_URL -Method Post -Body $girlbossBody -ContentType "application/json" -OutFile "$OUTPUT_DIR/girlboss_test.mp4"
    Write-Host "✅ Girlboss test completed!" -ForegroundColor Green
}
catch {
    Write-Host "❌ Girlboss test failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 2: Hormozi Style with Effects
Write-Host "🚨 Testing Hormozi Viral Style..." -ForegroundColor Cyan
try {
    $hormoziBody = @{
        url = $VideoSource
        outputName = "hormozi_test"
        format = "mp4"
        options = @{
            speedFactor = 1.15
            zoomFactor = 1.05
            saturationFactor = 1.3
            antiDetection = @{
                pixelShift = $true
                subtleRotation = $true
                metadataPoisoning = $true
            }
        }
        caption = @{
            srtContent = "1`n00:00:00,000 --> 00:00:02,500`nATTENTION! 🚨💰`n`n2`n00:00:02,500 --> 00:00:05,000`nThis will CHANGE your LIFE! 🔥"
            subtitleStyle = "hormozi"
            fontSize = 50
            hormoziColors = @("#00FF00", "#FF0000", "#0080FF", "#FFFF00")
            hormoziShadowStrength = 3.5
            hormoziAnimation = "shake"
        }
    } | ConvertTo-Json -Depth 10

    Invoke-RestMethod -Uri $API_URL -Method Post -Body $hormoziBody -ContentType "application/json" -OutFile "$OUTPUT_DIR/hormozi_test.mp4"
    Write-Host "✅ Hormozi test completed!" -ForegroundColor Green
}
catch {
    Write-Host "❌ Hormozi test failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 3: Format Conversion
Write-Host "📸 Testing GIF Conversion..." -ForegroundColor Cyan
try {
    $gifBody = @{
        url = $VideoSource
        outputName = "test_gif"
        format = "gif"
        options = @{
            speedFactor = 1.2
            saturationFactor = 1.1
        }
    } | ConvertTo-Json -Depth 10

    Invoke-RestMethod -Uri $API_URL -Method Post -Body $gifBody -ContentType "application/json" -OutFile "$OUTPUT_DIR/test.gif"
    Write-Host "✅ GIF conversion completed!" -ForegroundColor Green
}
catch {
    Write-Host "❌ GIF conversion failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 4: PNG Thumbnail
Write-Host "🖼️ Testing PNG Thumbnail..." -ForegroundColor Cyan
try {
    $pngBody = @{
        url = $VideoSource
        outputName = "thumbnail"
        format = "png"
    } | ConvertTo-Json -Depth 10

    Invoke-RestMethod -Uri $API_URL -Method Post -Body $pngBody -ContentType "application/json" -OutFile "$OUTPUT_DIR/thumbnail.png"
    Write-Host "✅ PNG thumbnail completed!" -ForegroundColor Green
}
catch {
    Write-Host "❌ PNG thumbnail failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Results Summary
Write-Host "🎉 QUICK TEST COMPLETED!" -ForegroundColor Magenta
Write-Host "========================" -ForegroundColor Magenta
Write-Host ""
Write-Host "📁 Results in: $OUTPUT_DIR" -ForegroundColor White
Write-Host ""
Write-Host "📊 Files created:" -ForegroundColor Yellow
$files = Get-ChildItem -Path $OUTPUT_DIR -File 2>$null
if ($files) {
    $files | ForEach-Object {
        $size = [math]::Round($_.Length / 1MB, 2)
        Write-Host "├── $($_.Name) - ${size}MB" -ForegroundColor Gray
    }
} else {
    Write-Host "   No files created (check for errors above)" -ForegroundColor Red
}
Write-Host ""
Write-Host "🚀 If all tests passed, your API is working perfectly!" -ForegroundColor Green
Write-Host "💡 Run the full ultimate test suite with: .\test-all-features.ps1" -ForegroundColor Yellow 