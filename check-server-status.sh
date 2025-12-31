#!/bin/bash

# Check server status and environment
echo "🔍 Server Status Check"
echo "====================="

# Check if application is running
echo "PM2 Status:"
pm2 status

echo ""
echo "Application logs (last 10 lines):"
pm2 logs video-processing --lines 10

echo ""
echo "Environment file status:"
if [ -f .env ]; then
    echo "✅ .env file exists"
    echo "Contents (with hidden sensitive data):"
    cat .env | sed 's/ASSEMBLYAI_API_KEY=.*/ASSEMBLYAI_API_KEY=***HIDDEN***/'
else
    echo "❌ .env file not found"
fi

echo ""
echo "Process environment:"
ps aux | grep node | head -3