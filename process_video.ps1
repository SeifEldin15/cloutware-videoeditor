$jsonFilePath = ".\video-request.json"
$jsonContent = Get-Content -Path $jsonFilePath -Raw
$outputFile = ".\processed_video.mp4"

Write-Host "Sending video processing request..."

# Use curl to send the request
curl.exe -X POST `
  -H "Content-Type: application/json" `
  -d "$jsonContent" `
  --output "$outputFile" `
  http://localhost:3000/api/encode

Write-Host "Video processing complete. Output saved to $outputFile" 