#!/bin/bash

# Quick manual fix for environment variables on server
# Run this on your server: ssh ubuntu@18.144.88.135

echo "🔧 Manual Environment Variable Setup"
echo "=================================="

# Navigate to project directory
cd ~/cloutware-videoeditor

# Create .env file (you'll need to add your actual API key)
echo "Creating .env file..."
cat > .env << 'EOF'
ASSEMBLYAI_API_KEY=your_actual_api_key_here
PORT=3000
NODE_ENV=production
EOF

echo "📝 Please edit the .env file and add your real ASSEMBLYAI_API_KEY:"
echo "nano .env"
echo ""
echo "Then restart the application:"
echo "pm2 restart video-processing"
echo ""
echo "🔍 Check if it's working:"
echo "pm2 logs video-processing --lines 20"