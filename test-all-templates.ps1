# PowerShell script to test all template styles
# Usage: .\test-all-templates.ps1

$API_URL = "http://localhost:3000/api/encode-template"
$OUTPUT_DIR = ".\all_templates_test"
$TEST_VIDEO = "https://dkkaakuajsyehonlipbu.supabase.co/storage/v1/object/public/videos/tiktok/6736250773027767302/7362188339048353066"

# Create output directory
if (!(Test-Path $OUTPUT_DIR)) {
    New-Item -ItemType Directory -Path $OUTPUT_DIR
}

Write-Host "🎬 Testing All Template Styles" -ForegroundColor Green
Write-Host "===============================" -ForegroundColor Green
Write-Host "Video: $TEST_VIDEO" -ForegroundColor Cyan
Write-Host "Output Directory: $OUTPUT_DIR" -ForegroundColor Cyan
Write-Host "API: $API_URL" -ForegroundColor Cyan
Write-Host ""

# Function to test a template
function Test-Template {
    param(
        [string]$TemplateName,
        [string]$SrtContent
    )
    
    $outputName = "${TemplateName}_test"
    Write-Host "🚀 Testing $TemplateName template..." -ForegroundColor Yellow
    
    $requestBody = @{
        url = $TEST_VIDEO
        srtContent = $SrtContent
        templateName = $TemplateName
        outputName = $outputName
    } | ConvertTo-Json
    
    $outputFile = "$OUTPUT_DIR\${outputName}.mp4"
    
    try {
        Invoke-WebRequest -Uri $API_URL -Method Post -Body $requestBody -ContentType "application/json" -OutFile $outputFile
        
        if (Test-Path $outputFile) {
            $fileSize = (Get-Item $outputFile).Length
            $fileSizeMB = [math]::Round($fileSize / 1MB, 2)
            
            if ($fileSize -gt 1000) {
                Write-Host "✅ $TemplateName : SUCCESS - $fileSizeMB MB" -ForegroundColor Green
            } else {
                Write-Host "⚠️  $TemplateName : File too small ($fileSizeMB MB) - might be corrupted" -ForegroundColor Yellow
            }
        } else {
            Write-Host "❌ $TemplateName : File not created" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ $TemplateName : API request failed - $($_.Exception.Message)" -ForegroundColor Red
    }
    Write-Host ""
}

# Test content for different templates (updated for your word settings)
$GIRLBOSS_SRT = "1`n00:00:00,000 --> 00:00:03,000`nGIRLBOSS ENERGY TAKES OVER! 💅✨`n`n2`n00:00:03,000 --> 00:00:06,000`nOWN YOUR POWER RIGHT NOW! 👑`n`n3`n00:00:06,000 --> 00:00:09,000`nMANIFEST YOUR DREAMS TODAY! ⭐"

$HORMOZI_SRT = "1`n00:00:00,000 --> 00:00:02,500`nATTENTION EVERYONE RIGHT NOW! 🚨💰`n`n2`n00:00:02,500 --> 00:00:05,000`nThis will CHANGE your ENTIRE LIFE! 🔥`n`n3`n00:00:05,000 --> 00:00:07,500`nDon't miss this AMAZING OPPORTUNITY TODAY! 💎"

$TIKTOK_SRT = "1`n00:00:00,000 --> 00:00:02,500`nTIKTOK STYLE LOOKS SO GOOD! 🎵💫`n`n2`n00:00:02,500 --> 00:00:05,000`nSingle color VIBES ARE AMAZING! 🔥✨`n`n3`n00:00:05,000 --> 00:00:07,500`nSocial media CONTENT IS READY! 📱"

$THINTOBOLD_SRT = "1`n00:00:00,000 --> 00:00:03,000`nTHIN TO BOLD TRANSFORMATION EFFECT`n`n2`n00:00:03,000 --> 00:00:06,000`nELEGANT TRANSITIONS LOOK VERY SOPHISTICATED`n`n3`n00:00:06,000 --> 00:00:09,000`nPROFESSIONAL CONTENT STYLE WORKS PERFECTLY"

$WAVYCOLORS_SRT = "1`n00:00:00,000 --> 00:00:04,000`nRAINBOW COLORS CREATE AMAZING EFFECTS! 🌈✨`n`n2`n00:00:04,000 --> 00:00:08,000`nWAVY MAGIC FLOWS BEAUTIFULLY EVERYWHERE! 🔮`n`n3`n00:00:08,000 --> 00:00:12,000`nCOLORFUL VIBES MAKE EVERYTHING BETTER! 🎨"

$SHRINKINGPAIRS_SRT = "1`n00:00:00,000 --> 00:00:03,000`nSHRINKING PAIRS EFFECT CREATES AMAZING VISUAL IMPACT`n`n2`n00:00:03,000 --> 00:00:06,000`nWATCH IT SHRINK WITH PERFECT TIMING! ⚡`n`n3`n00:00:06,000 --> 00:00:09,000`nDYNAMIC EFFECTS WORK BEAUTIFULLY HERE! 💥"

$REVEALENLARGE_SRT = "1`n00:00:00,000 --> 00:00:03,000`nREVEAL AND ENLARGE CREATES DRAMATIC EFFECTS! 🌟`n`n2`n00:00:03,000 --> 00:00:06,000`nCOLOR CYCLING MAGIC WORKS SO WELL! 🎨`n`n3`n00:00:06,000 --> 00:00:09,000`nAMAZING EFFECTS REVEAL EVERYTHING PERFECTLY! ✨"

$BASIC_SRT = "1`n00:00:00,000 --> 00:00:03,000`nProfessional Template Works Great For Business`n`n2`n00:00:03,000 --> 00:00:06,000`nClean and Simple Design Looks Perfect`n`n3`n00:00:06,000 --> 00:00:09,000`nPerfect for Business and Corporate Content"

Write-Host "📋 Testing all 8 templates..." -ForegroundColor Yellow
Write-Host ""

# Test all templates
Test-Template "girlboss" $GIRLBOSS_SRT
Test-Template "hormozi" $HORMOZI_SRT
Test-Template "tiktokstyle" $TIKTOK_SRT
Test-Template "thintobold" $THINTOBOLD_SRT
Test-Template "wavycolors" $WAVYCOLORS_SRT
Test-Template "shrinkingpairs" $SHRINKINGPAIRS_SRT
Test-Template "revealenlarge" $REVEALENLARGE_SRT
Test-Template "basic" $BASIC_SRT

Write-Host "🎉 All template tests completed!" -ForegroundColor Green
Write-Host ""
Write-Host "📂 Check the '$OUTPUT_DIR' directory for output videos:" -ForegroundColor Yellow
Write-Host "   - girlboss_test.mp4 (multiple words, 2 per group)" -ForegroundColor White
Write-Host "   - hormozi_test.mp4 (multiple words, 4 per group)" -ForegroundColor White  
Write-Host "   - tiktokstyle_test.mp4 (multiple words, 2 per group)" -ForegroundColor White
Write-Host "   - thintobold_test.mp4 (normal mode, 4 words)" -ForegroundColor White
Write-Host "   - wavycolors_test.mp4 (multiple words, 1 per group)" -ForegroundColor White
Write-Host "   - shrinkingpairs_test.mp4 (multiple words, 4 per group)" -ForegroundColor White
Write-Host "   - revealenlarge_test.mp4 (multiple words, 4 per group)" -ForegroundColor White
Write-Host "   - basic_test.mp4 (normal mode, 1 word)" -ForegroundColor White
Write-Host ""
Write-Host "📊 File sizes summary:" -ForegroundColor Yellow
Get-ChildItem "$OUTPUT_DIR\*.mp4" | ForEach-Object {
    $sizeMB = [math]::Round($_.Length / 1MB, 2)
    Write-Host "   $($_.Name): $sizeMB MB" -ForegroundColor Cyan
} 