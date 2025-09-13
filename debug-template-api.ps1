# Debug Template API Script (PowerShell)
# Diagnoses issues with template video generation
# Usage: .\debug-template-api.ps1 [template_name]

param(
    [string]$Template = "girlboss"
)

$API_URL = "http://localhost:3000/api/encode-template"
$OUTPUT_DIR = "./debug_outputs"
$TEST_VIDEO = "https://dkkaakuajsyehonlipbu.supabase.co/storage/v1/object/public/videos/tiktok/6736250773027767302/7362188339048353066"

# Create output directory
if (!(Test-Path $OUTPUT_DIR)) {
    New-Item -ItemType Directory -Path $OUTPUT_DIR | Out-Null
}

Write-Host "🔍 Debugging Template API" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan
Write-Host "Template: $Template" -ForegroundColor Yellow
Write-Host "API: $API_URL" -ForegroundColor Yellow
Write-Host ""

# Step 1: Test API connectivity
Write-Host "1️⃣ Testing API connectivity..." -ForegroundColor Blue
try {
    $response = Invoke-WebRequest -Uri $API_URL -Method GET -UseBasicParsing -ErrorAction Stop
    Write-Host "✅ API is accessible (HTTP $($response.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "❌ API not accessible: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "💡 Make sure your server is running on port 3000" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# Step 2: List available templates
Write-Host "2️⃣ Listing available templates..." -ForegroundColor Blue
try {
    $templateResponse = Invoke-RestMethod -Uri $API_URL -Method GET
    Write-Host "Raw response:" -ForegroundColor Gray
    $templateResponse | ConvertTo-Json -Depth 10
    Write-Host ""
    
    Write-Host "✅ Templates response is valid JSON" -ForegroundColor Green
    if ($templateResponse.templates) {
        $availableTemplates = $templateResponse.templates | ForEach-Object { $_.key } | Out-String
        Write-Host "Available templates: $availableTemplates" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Templates response is not valid JSON: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 3: Test video processing with detailed response
Write-Host "3️⃣ Testing video processing with $Template template..." -ForegroundColor Blue

$SRT_CONTENT = @"
1
00:00:00,000 --> 00:00:03,000
TEST CONTENT FOR DEBUGGING

2
00:00:03,000 --> 00:00:06,000
THIS IS A SIMPLE TEST
"@

# Create request object
$requestBody = @{
    url = $TEST_VIDEO
    srtContent = $SRT_CONTENT
    templateName = $Template
    outputName = "debug_test"
} | ConvertTo-Json

Write-Host "Request JSON:" -ForegroundColor Gray
$requestBody
Write-Host ""

# Make request and capture response
Write-Host "Making API request..." -ForegroundColor Blue
$responseFile = Join-Path $OUTPUT_DIR "response.tmp"

try {
    $webRequest = [System.Net.WebRequest]::Create($API_URL)
    $webRequest.Method = "POST"
    $webRequest.ContentType = "application/json"
    
    # Write request body
    $requestBytes = [System.Text.Encoding]::UTF8.GetBytes($requestBody)
    $webRequest.ContentLength = $requestBytes.Length
    $requestStream = $webRequest.GetRequestStream()
    $requestStream.Write($requestBytes, 0, $requestBytes.Length)
    $requestStream.Close()
    
    # Get response
    $webResponse = $webRequest.GetResponse()
    $responseStream = $webResponse.GetResponseStream()
    $fileStream = [System.IO.File]::Create($responseFile)
    $responseStream.CopyTo($fileStream)
    $fileStream.Close()
    $responseStream.Close()
    
    $httpCode = [int]$webResponse.StatusCode
    $contentType = $webResponse.ContentType
    $responseSize = (Get-Item $responseFile).Length
    
    Write-Host ""
    Write-Host "4️⃣ Analyzing response..." -ForegroundColor Blue
    Write-Host "HTTP Code: $httpCode" -ForegroundColor Yellow
    Write-Host "Content-Type: $contentType" -ForegroundColor Yellow
    Write-Host "Response size: $responseSize bytes" -ForegroundColor Yellow
    
    # Check if response is JSON (error) or binary (video)
    if ($responseSize -lt 1000) {
        Write-Host "⚠️  Response is very small, likely an error" -ForegroundColor Yellow
        Write-Host "Response content:" -ForegroundColor Gray
        Get-Content $responseFile -Raw | Write-Host
        Write-Host ""
        
        # Try to parse as JSON
        try {
            $errorResponse = Get-Content $responseFile -Raw | ConvertFrom-Json
            Write-Host "❌ Response is JSON error message:" -ForegroundColor Red
            $errorResponse | ConvertTo-Json -Depth 10 | Write-Host
        } catch {
            Write-Host "Response is not valid JSON" -ForegroundColor Gray
        }
    } else {
        Write-Host "✅ Response is large enough to be a video" -ForegroundColor Green
        
        # Check if it looks like MP4 by reading first few bytes
        $firstBytes = Get-Content $responseFile -Encoding Byte -TotalCount 20
        $firstBytesHex = ($firstBytes | ForEach-Object { $_.ToString("X2") }) -join " "
        Write-Host "First bytes (hex): $firstBytesHex" -ForegroundColor Gray
        
        # MP4 files typically start with specific signatures
        if ($firstBytesHex -match "00 00 00 [0-9A-F]{2} 66 74 79 70" -or $contentType -match "video|mp4") {
            $outputFile = Join-Path $OUTPUT_DIR "debug_$Template.mp4"
            Move-Item $responseFile $outputFile
            $finalSize = (Get-Item $outputFile).Length
            $finalSizeMB = [math]::Round($finalSize / 1MB, 2)
            Write-Host "✅ Response appears to be a valid video file ($finalSizeMB MB)" -ForegroundColor Green
            Write-Host "📁 Saved as: $outputFile" -ForegroundColor Green
        } else {
            Write-Host "❌ Response doesn't appear to be a video file" -ForegroundColor Red
            Write-Host "First 200 characters of response:" -ForegroundColor Gray
            Get-Content $responseFile -Raw | Select-Object -First 200 | Write-Host
        }
    }
    
    $webResponse.Close()
    
} catch {
    Write-Host "❌ Request failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $errorStream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($errorStream)
        $errorContent = $reader.ReadToEnd()
        Write-Host "Error response: $errorContent" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "5️⃣ Recommendations:" -ForegroundColor Blue

if (Test-Path $responseFile) {
    $responseSize = (Get-Item $responseFile).Length
    if ($responseSize -lt 1000) {
        try {
            $errorResponse = Get-Content $responseFile -Raw | ConvertFrom-Json
            $errorMessage = $errorResponse.error ?? $errorResponse.message ?? "Unknown error"
            Write-Host "❌ API returned error: $errorMessage" -ForegroundColor Red
            Write-Host ""
            Write-Host "💡 Possible solutions:" -ForegroundColor Yellow
            Write-Host "   1. Check if template name '$Template' exists" -ForegroundColor Yellow
            Write-Host "   2. Verify video URL is accessible" -ForegroundColor Yellow
            Write-Host "   3. Check server logs for detailed error messages" -ForegroundColor Yellow
            Write-Host "   4. Test with simpler SRT content" -ForegroundColor Yellow
        } catch {
            Write-Host "❌ Small response that's not valid JSON" -ForegroundColor Red
        }
    } else {
        Write-Host "✅ API appears to be working correctly" -ForegroundColor Green
        Write-Host "📁 Check the debug output file for the generated video" -ForegroundColor Green
    }
    
    # Cleanup temporary file if it still exists
    if (Test-Path $responseFile) {
        Remove-Item $responseFile -Force
    }
}

Write-Host ""
Write-Host "🔧 Debug files created in $OUTPUT_DIR:" -ForegroundColor Cyan
if (Test-Path $OUTPUT_DIR) {
    Get-ChildItem $OUTPUT_DIR | ForEach-Object {
        $size = if ($_.Length -gt 1MB) { "{0:N2} MB" -f ($_.Length / 1MB) } else { "{0:N0} KB" -f ($_.Length / 1KB) }
        Write-Host "   $($_.Name): $size" -ForegroundColor White
    }
} 