# 🎬 Video Processing API - Test Suite

Complete test collection for your refactored video processing API with all subtitle animations and video effects.

## 📋 Quick Start

### Windows (PowerShell)
```powershell
# Start your server first
npm run dev

# Run all tests
./test-api.ps1
```

### Linux/Mac (Bash)
```bash
# Start your server first
npm run dev

# Run all tests
./test-api.sh
```

## 🎨 Available Subtitle Animations

### 1. **Girlboss Style** 💅
- **Description**: Pink, bold, feminine energy with shake animation
- **Best for**: Beauty, lifestyle, empowerment content
- **Features**: 
  - Custom colors (#FF1493 default)
  - Shadow effects (adjustable strength)
  - Optional shake animation
  - Vertical positioning control

### 2. **Hormozi Viral Style** 🔥
- **Description**: Multi-colored, high-energy, attention-grabbing
- **Best for**: Marketing, business, viral content
- **Features**:
  - Multiple alternating colors
  - Strong shadows (1-5 strength)
  - Shake animation option
  - Bold, impactful typography

### 3. **ThinToBold Style** ✨
- **Description**: Elegant typography transitions from thin to bold
- **Best for**: Professional, luxury, sophisticated content
- **Features**:
  - Smooth thin-to-bold transitions
  - Clean, professional look
  - Customizable fonts (Montserrat default)
  - Subtle shadow effects

### 4. **WavyColors Style** 🌈
- **Description**: Rainbow flowing colors with wavy text effects
- **Best for**: Creative, artistic, psychedelic content
- **Features**:
  - Rainbow color gradients
  - Wavy text animations
  - Adjustable outline width
  - Psychedelic visual effects

### 5. **Basic Style** 📝
- **Description**: Traditional, clean subtitles
- **Best for**: Professional, educational, standard content
- **Features**:
  - Multiple position options (top/middle/bottom)
  - Background boxes
  - Font customization
  - Standard alignment options

## 🎛️ Video Processing Features

### Format Support
- **MP4**: Full featured video processing
- **GIF**: Animated GIF conversion
- **PNG**: Thumbnail extraction

### Advanced Effects
- **Speed Factor**: 0.5x - 2.0x playback speed
- **Zoom Factor**: 1.0x - 2.0x zoom level
- **Saturation**: 0.5x - 2.0x color saturation
- **Lightness**: -0.5 to +0.5 brightness adjustment
- **Audio Pitch**: 0.5x - 1.5x pitch modification

### Anti-Detection Features
- **Pixel Shift**: Subtle pixel displacement
- **Micro Crop**: Small cropping adjustments  
- **Subtle Rotation**: Minor rotation (0.25°)
- **Noise Addition**: Film grain effect
- **Metadata Poisoning**: Random metadata injection
- **Frame Interpolation**: Smart frame blending

### Audio Processing
- **Background Audio**: Mix with provided audio file
- **Volume Control**: 0.05 - 0.5 background volume
- **Tempo Modification**: 0.8x - 1.2x tempo adjustment
- **EQ Adjustments**: Low/Mid/High frequency control
- **Reverb Effects**: Configurable delay and level
- **Background Ambience**: Room, crowd, nature, white noise

## 📂 Test Files Overview

### `test-requests.json`
Complete collection of API requests covering:
- All 5 subtitle animations
- Format conversions (MP4, GIF, PNG)
- Advanced video effects
- Combined feature tests
- cURL examples

### `test-api.ps1` (Windows)
PowerShell script that automatically runs all tests:
- Colorful progress indicators
- Error handling with try/catch
- Automatic output organization
- File listing at completion

### `test-api.sh` (Linux/Mac)
Bash script equivalent with:
- Emoji progress indicators
- Sequential test execution
- Output directory management
- Final results summary

## 🚀 Running Individual Tests

### Test Girlboss Style
```bash
curl -X POST http://localhost:3000/api/encode \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4",
    "outputName": "girlboss_test",
    "format": "mp4",
    "caption": {
      "srtContent": "1\n00:00:00,000 --> 00:00:03,000\nGirlboss Energy! 💅",
      "subtitleStyle": "girlboss",
      "fontSize": 48,
      "girlbossColor": "#FF1493",
      "girlbossAnimation": "shake"
    }
  }' \
  --output girlboss_video.mp4
```

### Test Hormozi Viral Style
```bash
curl -X POST http://localhost:3000/api/encode \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4",
    "outputName": "hormozi_test",
    "format": "mp4",
    "caption": {
      "srtContent": "1\n00:00:00,000 --> 00:00:02,000\nATTENTION! 🚨",
      "subtitleStyle": "hormozi",
      "fontSize": 52,
      "hormoziColors": ["#00FF00", "#FF0000", "#0080FF", "#FFFF00"]
    }
  }' \
  --output hormozi_video.mp4
```

### Test Advanced Video Effects
```bash
curl -X POST http://localhost:3000/api/encode \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4",
    "outputName": "advanced_test",
    "format": "mp4",
    "options": {
      "speedFactor": 1.2,
      "saturationFactor": 1.3,
      "antiDetection": {
        "pixelShift": true,
        "noiseAddition": true
      }
    }
  }' \
  --output advanced_video.mp4
```

## 📊 API Parameter Reference

### Caption Options
```json
{
  "caption": {
    "srtContent": "1\n00:00:00,000 --> 00:00:03,000\nYour subtitle text",
    "subtitleStyle": "girlboss|hormozi|thintobold|wavycolors|basic",
    "fontSize": 24,
    "fontFamily": "Arial",
    
    // Universal positioning (works for all styles)
    "verticalPosition": 20,
    "outlineWidth": 3,
    "outlineColor": "#000000",
    "outlineBlur": 1,
    
    // Girlboss specific
    "girlbossColor": "#FF1493",
    "girlbossShadowStrength": 2,
    "girlbossAnimation": "shake|none",
    
    // Hormozi specific  
    "hormoziColors": ["#00FF00", "#FF0000", "#0080FF"],
    "hormoziShadowStrength": 4,
    "hormoziAnimation": "shake|none",
    
    // ThinToBold specific
    "thinToBoldColor": "#FFFFFF",
    "thinToBoldShadowStrength": 1.5,
    
    // WavyColors specific
    "wavyColorsOutlineWidth": 3
  }
}
```

### Video Processing Options
```json
{
  "options": {
    "speedFactor": 1.2,
    "zoomFactor": 1.1,
    "saturationFactor": 1.3,
    "lightness": 0.15,
    "backgroundAudio": true,
    "backgroundAudioVolume": 0.2,
    "antiDetection": {
      "pixelShift": true,
      "microCrop": true,
      "subtleRotation": true,
      "noiseAddition": true,
      "metadataPoisoning": true
    },
    "visibleChanges": {
      "horizontalFlip": false,
      "border": true,
      "timestamp": false
    }
  }
}
```

## 🎯 Test Video URLs

Free test videos you can use:
- `https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4`
- `https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4`
- `https://www.w3schools.com/html/mov_bbb.mp4`

## 📱 Expected Output

After running tests, you'll get:
```
test_outputs/
├── girlboss_test.mp4         # Pink, animated subtitles
├── hormozi_test.mp4          # Multi-colored viral style
├── thintobold_test.mp4       # Elegant typography
├── wavycolors_test.mp4       # Rainbow flowing text
├── test.gif                  # Animated GIF conversion
├── thumbnail.png             # Video thumbnail
├── advanced_effects.mp4      # Video with all effects
└── ultimate_test.mp4         # Everything combined
```

## 🛠️ Troubleshooting

### Common Issues
1. **Server not running**: Make sure `npm run dev` is active
2. **Port conflicts**: Check if port 3000 is available
3. **Network issues**: Verify test video URLs are accessible
4. **File permissions**: Ensure write access to test_outputs folder

### Debug Mode
Add verbose logging by setting environment variable:
```bash
DEBUG=video-processing ./test-api.sh
```

## 🎉 Success Metrics

Your API is working correctly if:
- ✅ All 8 tests complete without errors
- ✅ Output files are created in test_outputs folder
- ✅ Video files play with correct effects applied
- ✅ Subtitle animations display as expected
- ✅ GIF and PNG conversions work properly

## 💡 Next Steps

1. **Custom Content**: Replace test URLs with your own videos
2. **Parameter Tuning**: Adjust animation parameters for your brand
3. **Integration**: Integrate working requests into your application
4. **Scaling**: Test with larger videos and concurrent requests
5. **Optimization**: Monitor performance and adjust processing options

Happy testing! 🚀 