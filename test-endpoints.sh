#!/bin/bash

# Simple endpoint test
echo "🧪 Testing server endpoints..."

URLS=(
    "http://localhost:3000"
    "http://localhost:3000/api"
    "http://localhost:3000/health"
    "http://localhost:3000/api/encode"
)

for url in "${URLS[@]}"; do
    echo -n "Testing $url: "
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null)
    if [ "$response" = "200" ] || [ "$response" = "404" ] || [ "$response" = "405" ]; then
        echo "✅ $response (server responding)"
    else
        echo "❌ $response (no response)"
    fi
done

echo ""
echo "🎯 Quick API test (should show Method Not Allowed for GET):"
curl -v http://localhost:3000/api/encode 2>&1 | grep -E "(HTTP|Method|Allow)" || echo "No response"