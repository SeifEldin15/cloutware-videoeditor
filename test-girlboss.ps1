# Quick Girlboss Template Test Script
# Usage: .\test-girlboss.ps1

param(
    [string]$ServerUrl = "http://localhost:3000",
    [string]$OutputDir = "./test_outputs"
)

Write-Host "🦄 Girlboss Template Video Generation Test" -ForegroundColor Magenta
Write-Host "=========================================" -ForegroundColor Magenta
Write-Host ""

# Create output directory
New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null

# Check if server is running
Write-Host "🔍 Checking server status..." -ForegroundColor Yellow
try {
    $healthCheck = Invoke-RestMethod -Uri "$ServerUrl/health" -Method Get -TimeoutSec 5
    Write-Host "✅ Server is running!" -ForegroundColor Green
} catch {
    Write-Host "❌ Server is not running. Please start it with 'npm run dev'" -ForegroundColor Red
    Write-Host "   Then run this script again." -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Test 1: Basic Girlboss Style
Write-Host "🎬 Test 1: Basic Girlboss Style with Custom SRT..." -ForegroundColor Cyan

$basicTest = @{
    url = "https://dkkaakuajsyehonlipbu.supabase.co/storage/v1/object/public/videos/tiktok/6736250773027767302/7362188339048353066"
    outputName = "girlboss_basic_test"
    format = "mp4"
    caption = @{
        srtContent = "1`n00:00:00,000 --> 00:00:03,000`nHey gorgeous! 💅✨`n`n2`n00:00:03,000 --> 00:00:06,000`nYou're absolutely slaying today! 👑`n`n3`n00:00:06,000 --> 00:00:09,000`nKeep that boss energy! 🔥💖"
        subtitleStyle = "girlboss"
        fontSize = 48
        girlbossColor = "#FF1493"
        girlbossShadowStrength = 2.0
        girlbossAnimation = "shake"
        girlbossVerticalPosition = 20
    }
} | ConvertTo-Json -Depth 10

try {
    Invoke-RestMethod -Uri "$ServerUrl/api/encode" -Method Post -Body $basicTest -ContentType "application/json" -OutFile "$OutputDir/girlboss_basic_test.mp4"
    Write-Host "✅ Basic test completed: $OutputDir/girlboss_basic_test.mp4" -ForegroundColor Green
} catch {
    Write-Host "❌ Basic test failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 2: Bouncy Animation
Write-Host "🎬 Test 2: Girlboss with Bouncy Animation..." -ForegroundColor Cyan

$bouncyTest = @{
    url = "https://dkkaakuajsyehonlipbu.supabase.co/storage/v1/object/public/videos/tiktok/6736250773027767302/7362188339048353066"
    outputName = "girlboss_bouncy_test"
    format = "mp4"
    caption = @{
        srtContent = "1`n00:00:00,000 --> 00:00:04,000`nBounce into greatness! 🌟`n`n2`n00:00:04,000 --> 00:00:08,000`nEvery step is a power move! 💪`n`n3`n00:00:08,000 --> 00:00:12,000`nYou're unstoppable! 🚀✨"
        subtitleStyle = "girlboss"
        fontSize = 52
        girlbossColor = "#FF69B4"
        girlbossShadowStrength = 3.0
        girlbossAnimation = "bounce"
        girlbossVerticalPosition = 15
    }
} | ConvertTo-Json -Depth 10

try {
    Invoke-RestMethod -Uri "$ServerUrl/api/encode" -Method Post -Body $bouncyTest -ContentType "application/json" -OutFile "$OutputDir/girlboss_bouncy_test.mp4"
    Write-Host "✅ Bouncy test completed: $OutputDir/girlboss_bouncy_test.mp4" -ForegroundColor Green
} catch {
    Write-Host "❌ Bouncy test failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 3: Glowing Gold
Write-Host "🎬 Test 3: Girlboss with Golden Glow..." -ForegroundColor Cyan

$glowTest = @{
    url = "https://dkkaakuajsyehonlipbu.supabase.co/storage/v1/object/public/videos/tiktok/6736250773027767302/7362188339048353066"
    outputName = "girlboss_glow_test"
    format = "mp4"
    caption = @{
        srtContent = "1`n00:00:00,000 --> 00:00:03,500`nShine bright like gold! ✨`n`n2`n00:00:03,500 --> 00:00:07,000`nYour light illuminates everything! 🌟`n`n3`n00:00:07,000 --> 00:00:10,500`nGolden goddess vibes! 👑💛"
        subtitleStyle = "girlboss"
        fontSize = 50
        girlbossColor = "#FFD700"
        girlbossShadowStrength = 4.0
        girlbossAnimation = "glow"
        girlbossVerticalPosition = 25
    }
} | ConvertTo-Json -Depth 10

try {
    Invoke-RestMethod -Uri "$ServerUrl/api/encode" -Method Post -Body $glowTest -ContentType "application/json" -OutFile "$OutputDir/girlboss_glow_test.mp4"
    Write-Host "✅ Glow test completed: $OutputDir/girlboss_glow_test.mp4" -ForegroundColor Green
} catch {
    Write-Host "❌ Glow test failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Summary
Write-Host "🎉 Test Summary" -ForegroundColor Magenta
Write-Host "===============" -ForegroundColor Magenta
Write-Host "Check the generated videos in: $OutputDir" -ForegroundColor Yellow
Write-Host ""
Write-Host "Generated files:" -ForegroundColor Cyan
if (Test-Path "$OutputDir/girlboss_basic_test.mp4") {
    Write-Host "✅ girlboss_basic_test.mp4 - Classic shake animation" -ForegroundColor Green
}
if (Test-Path "$OutputDir/girlboss_bouncy_test.mp4") {
    Write-Host "✅ girlboss_bouncy_test.mp4 - Bouncy animation" -ForegroundColor Green
}
if (Test-Path "$OutputDir/girlboss_glow_test.mp4") {
    Write-Host "✅ girlboss_glow_test.mp4 - Golden glow effect" -ForegroundColor Green
}

Write-Host ""
Write-Host "🎯 To create your own test:" -ForegroundColor Yellow
Write-Host "1. Modify the SRT content in this script" -ForegroundColor White
Write-Host "2. Change colors, animations, or positioning" -ForegroundColor White
Write-Host "3. Run the script again: .\test-girlboss.ps1" -ForegroundColor White
Write-Host ""
Write-Host "🎨 Available girlboss parameters:" -ForegroundColor Yellow
Write-Host "- girlbossColor: #FF1493, #FF69B4, #FFD700, #8A2BE2" -ForegroundColor White
Write-Host "- girlbossAnimation: shake, bounce, glow" -ForegroundColor White
Write-Host "- girlbossShadowStrength: 1.0 - 4.0" -ForegroundColor White
Write-Host "- girlbossVerticalPosition: 10 - 30" -ForegroundColor White