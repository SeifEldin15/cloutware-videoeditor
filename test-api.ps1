# Video Processing API Test Script (PowerShell)
# Make sure your server is running on localhost:3000

$API_URL = "http://localhost:3000/api/encode"
$OUTPUT_DIR = "./test_outputs"

# Create output directory
New-Item -ItemType Directory -Force -Path $OUTPUT_DIR | Out-Null

Write-Host "🎬 Video Processing API Test Suite" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Girlboss Style Subtitles
Write-Host "🦄 Testing Girlboss Style Subtitles..." -ForegroundColor Magenta
$girlbossBody = @{
    url = "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4"
    outputName = "girlboss_test"
    format = "mp4"
    caption = @{
        srtContent = "1`n00:00:00,000 --> 00:00:03,000`nGirlboss Energy! 💅`n`n2`n00:00:03,000 --> 00:00:06,000`nShake it up! ✨`n`n3`n00:00:06,000 --> 00:00:09,000`nOwn your power! 👑"
        subtitleStyle = "girlboss"
        fontSize = 48
        girlbossColor = "#FF1493"
        girlbossShadowStrength = 2
        girlbossAnimation = "shake"
        girlbossVerticalPosition = 20
    }
} | ConvertTo-Json -Depth 10

try {
    Invoke-RestMethod -Uri $API_URL -Method Post -Body $girlbossBody -ContentType "application/json" -OutFile "$OUTPUT_DIR/girlboss_test.mp4"
    Write-Host "✅ Girlboss test completed!" -ForegroundColor Green
} catch {
    Write-Host "❌ Girlboss test failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 2: Hormozi Viral Style
Write-Host "🔥 Testing Hormozi Viral Style Subtitles..." -ForegroundColor Red
$hormoziBody = @{
    url = "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4"
    outputName = "hormozi_test"
    format = "mp4"
    caption = @{
        srtContent = "1`n00:00:00,000 --> 00:00:02,500`nATTENTION ENTREPRENEURS! 🚨`n`n2`n00:00:02,500 --> 00:00:05,000`nThis will CHANGE your life 💰`n`n3`n00:00:05,000 --> 00:00:08,000`nWatch what happens NEXT! 🔥"
        subtitleStyle = "hormozi"
        fontSize = 52
        hormoziColors = @("#00FF00", "#FF0000", "#0080FF", "#FFFF00", "#FF00FF")
        hormoziShadowStrength = 4
        hormoziAnimation = "shake"
    }
} | ConvertTo-Json -Depth 10

try {
    Invoke-RestMethod -Uri $API_URL -Method Post -Body $hormoziBody -ContentType "application/json" -OutFile "$OUTPUT_DIR/hormozi_test.mp4"
    Write-Host "✅ Hormozi test completed!" -ForegroundColor Green
} catch {
    Write-Host "❌ Hormozi test failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 3: Thin to Bold Style
Write-Host "✨ Testing Thin to Bold Style Subtitles..." -ForegroundColor Yellow
$thinToBoldBody = @{
    url = "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4"
    outputName = "thintobold_test"
    format = "mp4"
    caption = @{
        srtContent = "1`n00:00:00,000 --> 00:00:03,000`nElegant typography in motion`n`n2`n00:00:03,000 --> 00:00:06,000`nSmooth transitions`n`n3`n00:00:06,000 --> 00:00:09,000`nProfessional presentation"
        subtitleStyle = "thintobold"
        fontSize = 46
        fontFamily = "Montserrat"
        thinToBoldColor = "#FFFFFF"
        thinToBoldShadowStrength = 1.5
    }
} | ConvertTo-Json -Depth 10

try {
    Invoke-RestMethod -Uri $API_URL -Method Post -Body $thinToBoldBody -ContentType "application/json" -OutFile "$OUTPUT_DIR/thintobold_test.mp4"
    Write-Host "✅ Thin to Bold test completed!" -ForegroundColor Green
} catch {
    Write-Host "❌ Thin to Bold test failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 4: Wavy Colors Style
Write-Host "🌈 Testing Wavy Colors Style Subtitles..." -ForegroundColor Blue
$wavyColorsBody = @{
    url = "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4"
    outputName = "wavycolors_test"
    format = "mp4"
    caption = @{
        srtContent = "1`n00:00:00,000 --> 00:00:04,000`nRainbow colors flowing 🌈`n`n2`n00:00:04,000 --> 00:00:08,000`nWavy colorful text ✨`n`n3`n00:00:08,000 --> 00:00:12,000`nPsychedelic experience! 🔮"
        subtitleStyle = "wavycolors"
        fontSize = 50
        wavyColorsOutlineWidth = 3
        wavyColorsVerticalPosition = 10
    }
} | ConvertTo-Json -Depth 10

try {
    Invoke-RestMethod -Uri $API_URL -Method Post -Body $wavyColorsBody -ContentType "application/json" -OutFile "$OUTPUT_DIR/wavycolors_test.mp4"
    Write-Host "✅ Wavy Colors test completed!" -ForegroundColor Green
} catch {
    Write-Host "❌ Wavy Colors test failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 5: GIF Conversion
Write-Host "📸 Testing GIF Conversion..." -ForegroundColor Green
$gifBody = @{
    url = "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4"
    outputName = "test_gif"
    format = "gif"
} | ConvertTo-Json -Depth 10

try {
    Invoke-RestMethod -Uri $API_URL -Method Post -Body $gifBody -ContentType "application/json" -OutFile "$OUTPUT_DIR/test.gif"
    Write-Host "✅ GIF conversion test completed!" -ForegroundColor Green
} catch {
    Write-Host "❌ GIF conversion test failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 6: PNG Thumbnail
Write-Host "🖼️ Testing PNG Thumbnail Extraction..." -ForegroundColor Cyan
$pngBody = @{
    url = "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4"
    outputName = "thumbnail"
    format = "png"
} | ConvertTo-Json -Depth 10

try {
    Invoke-RestMethod -Uri $API_URL -Method Post -Body $pngBody -ContentType "application/json" -OutFile "$OUTPUT_DIR/thumbnail.png"
    Write-Host "✅ PNG thumbnail test completed!" -ForegroundColor Green
} catch {
    Write-Host "❌ PNG thumbnail test failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 7: Advanced Video Effects
Write-Host "⚡ Testing Advanced Video Effects..." -ForegroundColor DarkYellow
$advancedBody = @{
    url = "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4"
    outputName = "advanced_effects"
    format = "mp4"
    options = @{
        speedFactor = 1.2
        zoomFactor = 1.1
        saturationFactor = 1.3
        lightness = 0.15
        backgroundAudio = $true
        backgroundAudioVolume = 0.2
        antiDetection = @{
            pixelShift = $true
            microCrop = $true
            subtleRotation = $true
            noiseAddition = $true
        }
        visibleChanges = @{
            border = $true
            timestamp = $true
        }
    }
} | ConvertTo-Json -Depth 10

try {
    Invoke-RestMethod -Uri $API_URL -Method Post -Body $advancedBody -ContentType "application/json" -OutFile "$OUTPUT_DIR/advanced_effects.mp4"
    Write-Host "✅ Advanced effects test completed!" -ForegroundColor Green
} catch {
    Write-Host "❌ Advanced effects test failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 8: Ultimate Combined Test
Write-Host "🚀 Testing Ultimate Combined Features..." -ForegroundColor Magenta
$ultimateBody = @{
    url = "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4"
    outputName = "ultimate_test"
    format = "mp4"
    caption = @{
        srtContent = "1`n00:00:00,000 --> 00:00:03,000`nULTIMATE TEST! 🎯`n`n2`n00:00:03,000 --> 00:00:06,000`nAll effects combined 💥`n`n3`n00:00:06,000 --> 00:00:09,000`nMaximum power! ⚡"
        subtitleStyle = "hormozi"
        fontSize = 54
        hormoziColors = @("#FF0000", "#00FF00", "#0000FF", "#FFFF00")
        hormoziShadowStrength = 5
        hormoziAnimation = "shake"
    }
    options = @{
        speedFactor = 1.15
        saturationFactor = 1.25
        backgroundAudio = $true
        antiDetection = @{
            pixelShift = $true
            microCrop = $true
            subtleRotation = $true
            noiseAddition = $true
            metadataPoisoning = $true
        }
    }
} | ConvertTo-Json -Depth 10

try {
    Invoke-RestMethod -Uri $API_URL -Method Post -Body $ultimateBody -ContentType "application/json" -OutFile "$OUTPUT_DIR/ultimate_test.mp4"
    Write-Host "✅ Ultimate test completed!" -ForegroundColor Green
} catch {
    Write-Host "❌ Ultimate test failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

Write-Host "🎉 All tests completed!" -ForegroundColor Green
Write-Host "📁 Check the '$OUTPUT_DIR' folder for your processed videos" -ForegroundColor Yellow
Write-Host ""
Write-Host "Files created:" -ForegroundColor White
Get-ChildItem -Path $OUTPUT_DIR | Select-Object Name, Length, LastWriteTime | Format-Table 