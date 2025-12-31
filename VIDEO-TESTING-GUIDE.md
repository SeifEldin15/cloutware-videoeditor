# Video Generation Testing Guide - Girlboss Template with SRT

This guide shows you how to test video generation using your server with the girlboss template and custom SRT subtitles.

## 🚀 Quick Test Methods

### Method 1: PowerShell Script (Windows)
Use the existing test script:

```powershell
# Make sure your server is running
npm run dev

# Run the API test (in another terminal)
.\test-api.ps1
```

### Method 2: Bash Script (Linux/Mac/WSL)
```bash
# Make sure your server is running
npm run dev

# Run the API test (in another terminal)
./test-api.sh
```

### Method 3: Manual API Call with Custom SRT

## 🎯 Testing with Custom SRT Content

### Step 1: Start Your Server
```bash
npm run dev
# Server will run on http://localhost:3000
```

### Step 2: Test with Custom SRT

#### Using PowerShell:
```powershell
$body = @{
    url = "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4"
    outputName = "my_girlboss_test"
    format = "mp4"
    caption = @{
        srtContent = "1`n00:00:00,000 --> 00:00:03,000`nHey girl! 💅✨`n`n2`n00:00:03,000 --> 00:00:06,000`nYou're absolutely crushing it! 👑`n`n3`n00:00:06,000 --> 00:00:09,000`nKeep being amazing! 🔥💖"
        subtitleStyle = "girlboss"
        fontSize = 48
        girlbossColor = "#FF1493"
        girlbossShadowStrength = 2.0
        girlbossAnimation = "shake"
        girlbossVerticalPosition = 20
    }
} | ConvertTo-Json -Depth 10

Invoke-RestMethod -Uri "http://localhost:3000/api/encode" -Method Post -Body $body -ContentType "application/json" -OutFile "./my_girlboss_test.mp4"
```

#### Using curl:
```bash
curl -X POST http://localhost:3000/api/encode \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4",
    "outputName": "my_girlboss_test",
    "format": "mp4",
    "caption": {
      "srtContent": "1\n00:00:00,000 --> 00:00:03,000\nHey girl! 💅✨\n\n2\n00:00:03,000 --> 00:00:06,000\nYou'\''re absolutely crushing it! 👑\n\n3\n00:00:06,000 --> 00:00:09,000\nKeep being amazing! 🔥💖",
      "subtitleStyle": "girlboss",
      "fontSize": 48,
      "girlbossColor": "#FF1493",
      "girlbossShadowStrength": 2.0,
      "girlbossAnimation": "shake",
      "girlbossVerticalPosition": 20
    }
  }' \
  --output my_girlboss_test.mp4
```

## 🎨 Girlboss Template Options

### Available Parameters:
- `subtitleStyle`: `"girlboss"`
- `fontSize`: `32-72` (recommended: 48)
- `girlbossColor`: Hex color (default: `"#FF1493"`)
- `girlbossShadowStrength`: `1.0-4.0` (default: 2.0)
- `girlbossAnimation`: `"shake"`, `"bounce"`, `"glow"`
- `girlbossVerticalPosition`: `10-30` (distance from bottom)

### Color Options:
- Pink: `#FF1493` (default)
- Purple: `#8A2BE2`
- Gold: `#FFD700`
- Hot Pink: `#FF69B4`
- Magenta: `#FF00FF`

## 📝 SRT Format Example

```srt
1
00:00:00,000 --> 00:00:03,000
Hey beautiful! 💅✨

2
00:00:03,000 --> 00:00:06,000
You're absolutely slaying today! 👑

3
00:00:06,000 --> 00:00:09,000
Keep that energy up! 🔥💖

4
00:00:09,000 --> 00:00:12,000
Boss babe vibes only! 💯
```

## 🧪 Testing Different Variations

### Variation 1: Bouncy Animation
```json
{
  "subtitleStyle": "girlboss",
  "girlbossAnimation": "bounce",
  "girlbossColor": "#FF69B4",
  "girlbossShadowStrength": 3.0
}
```

### Variation 2: Glowing Effect
```json
{
  "subtitleStyle": "girlboss",
  "girlbossAnimation": "glow",
  "girlbossColor": "#FFD700",
  "girlbossShadowStrength": 4.0
}
```

### Variation 3: Classic Shake
```json
{
  "subtitleStyle": "girlboss",
  "girlbossAnimation": "shake",
  "girlbossColor": "#8A2BE2",
  "girlbossShadowStrength": 2.5
}
```

## 🎬 Using Local Video Files

If you want to test with your own video file:

1. **Place your video in the project directory**
2. **Use a local path instead of URL**:

```powershell
$body = @{
    localFilePath = "./your-video.mp4"  # Instead of 'url'
    outputName = "custom_girlboss_test"
    format = "mp4"
    caption = @{
        # ... your SRT content and settings
    }
}
```

## 🔍 Troubleshooting

### Server Not Responding:
```bash
# Check if server is running
curl http://localhost:3000/health

# Or check the dev server logs
npm run dev
```

### Video Processing Fails:
- Check the server console for FFmpeg errors
- Ensure the input video URL is accessible
- Verify SRT format is correct

### Output File Issues:
- Check the output directory exists
- Ensure you have write permissions
- Verify the file isn't being used by another process

## 📊 Expected Results

After running the test, you should get:
- ✅ MP4 file with girlboss-styled subtitles
- ✅ Pink/colorful text with animations
- ✅ Proper timing matching your SRT content
- ✅ Shake/bounce/glow effects applied

## 🎯 Next Steps

1. **Start your server**: `npm run dev`
2. **Run one of the test methods above**
3. **Check the generated video file**
4. **Experiment with different parameters**
5. **Create your own custom SRT content**