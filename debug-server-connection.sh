#!/bin/bash

echo "🔍 Diagnosing server connection issues..."
echo "========================================"

# Test different server URLs
URLS=(
    "http://localhost:3000"
    "http://127.0.0.1:3000"
    "http://0.0.0.0:3000"
    "http://$(hostname -I | awk '{print $1}'):3000"
)

for url in "${URLS[@]}"; do
    echo -n "Testing $url: "
    if curl -sf "$url/health" > /dev/null 2>&1; then
        echo "✅ Working!"
        echo "Use this URL: $url"
        break
    else
        echo "❌ Failed"
    fi
done

echo ""
echo "🔍 Checking what PM2 is running..."
pm2 show video-processing 2>/dev/null || echo "PM2 process 'video-processing' not found"

echo ""
echo "🔍 Checking port 3000..."
sudo netstat -tulpn | grep :3000 || echo "Nothing listening on port 3000"

echo ""
echo "🔍 Testing direct curl to localhost:3000..."
curl -v http://localhost:3000 2>&1 | head -10