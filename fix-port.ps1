$VastHost = "ssh7.vast.ai"
$VastPort = "10885"
$VastUser = "root"

$RemoteScript = @"
# 1. Stop the current service
pm2 stop ffmpeg-service

# 2. Update the service to use port 3000
# We can do this by setting the PORT env var in the PM2 ecosystem or command
pm2 delete ffmpeg-service
PORT=3000 pm2 start "tsx server.ts" --name ffmpeg-service --update-env

# 3. Check status
echo "Service restarted on port 3000"
pm2 status
"@

# Encode script to Base64
$ScriptBytes = [System.Text.Encoding]::UTF8.GetBytes($RemoteScript.Replace("`r`n", "`n"))
$Base64Script = [System.Convert]::ToBase64String($ScriptBytes)
$Command = "echo '$Base64Script' | base64 -d | bash"

write-host "Switching service to port 3000 on remote server..."
ssh -p $VastPort -o StrictHostKeyChecking=no ${VastUser}@${VastHost} $Command
write-host "Done."
