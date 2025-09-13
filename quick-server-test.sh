#!/bin/bash

echo "🔍 Quick Server Test"
echo "==================="

# Check PM2 status
echo "PM2 Status:"
pm2 status

echo ""
echo "PM2 Logs (last 20 lines):"
pm2 logs video-processing --lines 20

echo ""
echo "Testing server endpoints:"

# Test basic connectivity
echo -n "Testing http://localhost:3000: "
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null
echo ""

echo -n "Testing http://localhost:3000/health: "
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health 2>/dev/null
echo ""

echo -n "Testing http://localhost:3000/api: "
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api 2>/dev/null
echo ""

echo ""
echo "🧪 If the server is working, run the girlboss test with:"
echo "   ./test-girlboss.sh http://localhost:3000"