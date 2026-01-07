#!/bin/bash
export PATH=$PATH:/root/.nvm/versions/node/v22.12.0/bin:/usr/local/bin:/usr/bin:/bin

echo " --- DEBUGGING SERVICE ---"

# 1. Kill everything
fuser -k 3000/tcp || true
pm2 delete all || true

# 2. Start Service
cd /root/ffmpeg-service
npm install

PORT=3000 pm2 start "tsx server.ts" --name ffmpeg-service

echo "Waiting..."
sleep 5

# 3. Check logs
pm2 logs ffmpeg-service --lines 20 --nostream

# 4. Check port
netstat -tulpn | grep 3000
