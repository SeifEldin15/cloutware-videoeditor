$VastHost = "ssh7.vast.ai"
$VastPort = "10885"
$VastUser = "root"

# Prepare the remote command string directly to avoid PowerShell variable expansion issues
$RemoteCmd = "export PATH=`$PATH:/usr/local/bin:/usr/bin:/bin; " +
             "fuser -k 3000/tcp || true; " +
             "cd /root/ffmpeg-service; " +
             "pm2 delete ffmpeg-service 2>/dev/null; " +
             "PORT=3000 pm2 start 'tsx server.ts' --name ffmpeg-service --update-env; " +
             "sleep 5; " +
             "netstat -tulpn | grep 3000"

write-host "Restarting remote service on port 3000..."
# Use Invoke-Expression to handle the command cleanly
ssh -p $VastPort -o StrictHostKeyChecking=no ${VastUser}@${VastHost} $RemoteCmd
write-host "Done."
