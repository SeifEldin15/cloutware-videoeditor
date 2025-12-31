# PowerShell script to test reliable template functionality
# Usage: .\test-reliable-template.ps1 [templateName]

param(
    [string]$TemplateName = "girlboss"
)

$API_URL = "http://localhost:3000/api/encode-template"
$OUTPUT_DIR = ".\reliable_template_outputs"
$TEST_VIDEO = "https://dkkaakuajsyehonlipbu.supabase.co/storage/v1/object/public/videos/tiktok/6736250773027767302/7362188339048353066"

# Create output directory
if (!(Test-Path $OUTPUT_DIR)) {
    New-Item -ItemType Directory -Path $OUTPUT_DIR
}

Write-Host "🎬 Testing Reliable Template-Based Video Processing" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green
Write-Host "Video: $TEST_VIDEO" -ForegroundColor Cyan
Write-Host "API: $API_URL" -ForegroundColor Cyan
Write-Host "Template: $TemplateName" -ForegroundColor Yellow
Write-Host ""

# First, test GET request to list templates
Write-Host "📋 Getting available templates..." -ForegroundColor Yellow
try {
    $templatesResponse = Invoke-RestMethod -Uri $API_URL -Method Get
    Write-Host "✅ Available templates:" -ForegroundColor Green
    $templatesResponse.templates | ForEach-Object {
        Write-Host "  - $($_.name) ($($_.key)): $($_.description)" -ForegroundColor White
    }
} catch {
    Write-Host "❌ Failed to get templates: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test your exact failing request
$srtContent = "1`n00:00:00,000 --> 00:00:03,000`nGIRLBOSS ENERGY! 💅✨`n`n2`n00:00:03,000 --> 00:00:06,000`nOWN YOUR POWER! 👑"

$requestBody = @{
    url = $TEST_VIDEO
    srtContent = $srtContent
    templateName = $TemplateName
    outputName = "${TemplateName}_reliable_test"
} | ConvertTo-Json

$outputFile = "$OUTPUT_DIR\${TemplateName}_reliable_test.mp4"

Write-Host "🚀 Testing $TemplateName template (reliable endpoint)..." -ForegroundColor Yellow
Write-Host "Using your exact failing request format:" -ForegroundColor Gray
Write-Host $requestBody -ForegroundColor Gray
Write-Host ""

try {
    # Make the API request
    $response = Invoke-WebRequest -Uri $API_URL -Method Post -Body $requestBody -ContentType "application/json" -OutFile $outputFile
    
    if (Test-Path $outputFile) {
        $fileSize = (Get-Item $outputFile).Length
        $fileSizeMB = [math]::Round($fileSize / 1MB, 2)
        
        Write-Host "✅ $TemplateName template test completed successfully!" -ForegroundColor Green
        Write-Host "📁 Output file: $outputFile" -ForegroundColor Cyan
        Write-Host "📊 File size: $fileSizeMB MB" -ForegroundColor Cyan
        
        # Basic validation
        if ($fileSize -gt 1000) {
            Write-Host "✅ File appears to be a valid video (>1KB)" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Warning: File is very small, might be corrupted" -ForegroundColor Yellow
        }
    } else {
        Write-Host "❌ Output file was not created!" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ $TemplateName template test failed!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    
    # Try to get error details from response
    if ($_.Exception.Response) {
        try {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            Write-Host "Response: $responseBody" -ForegroundColor Red
        } catch {
            Write-Host "Could not read error response" -ForegroundColor Red
        }
    }
}

Write-Host ""
Write-Host "💡 Usage examples:" -ForegroundColor Yellow
Write-Host "   .\test-reliable-template.ps1 girlboss" -ForegroundColor White
Write-Host "   .\test-reliable-template.ps1 hormozi" -ForegroundColor White
Write-Host "   .\test-reliable-template.ps1 basic" -ForegroundColor White
Write-Host ""
Write-Host "🔗 API Endpoints (reliable version):" -ForegroundColor Yellow
Write-Host "   GET  $API_URL    # List templates" -ForegroundColor White
Write-Host "   POST $API_URL    # Process with template" -ForegroundColor White
Write-Host ""
Write-Host "🎯 Your exact failing request should now work with:" -ForegroundColor Yellow
Write-Host "   POST $API_URL" -ForegroundColor White 