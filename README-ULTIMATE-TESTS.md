# 🎬 Ultimate Video Processing API Test Suite

This comprehensive bash script tests each subtitle animation style with **ALL video transformations** applied in every single request.

## 🚀 What This Script Does

Unlike the basic test suite, this **ultimate test** combines EVERYTHING in each request:

### 📝 Test Coverage
- **5 Subtitle Styles** - Each tested with full video processing
- **All Video Transformations** - Applied to every subtitle style test
- **Format Conversions** - GIF, PNG with effects
- **Extreme Effects Test** - Maximum settings without subtitles
- **Mixed Styles Showcase** - Combined features demonstration

## 🎯 Each Subtitle Style Gets ALL These Effects:

### 🎬 Video Transformations
- **Speed Factor**: 1.15x faster playback
- **Zoom Factor**: 1.08x digital zoom
- **Saturation**: 1.25x more vibrant colors
- **Lightness**: +12% brightness boost
- **Frame Rate**: Standardized to 30fps
- **Smart Crop**: 1.15% intelligent cropping

### 🎵 Audio Processing
- **Audio Pitch**: 1.03x higher pitch
- **Background Audio**: Room ambience at 18% volume
- **Tempo Modification**: 1.08x faster with pitch preservation
- **Sync Shift**: 25ms audio-video synchronization
- **EQ Adjustments**: 
  - Low: +1.5x bass boost
  - Mid: 0.8x midrange reduction  
  - High: +2.0x treble enhancement
- **Reverb Effect**: 8% level with 40ms delay
- **Background Addition**: Room ambience at 3% level

### 🔒 Anti-Detection Features (All Enabled)
- **Pixel Shift**: Subtle pixel displacement
- **Micro Crop**: Tiny border cropping
- **Subtle Rotation**: Imperceptible rotation
- **Noise Addition**: Light digital noise
- **Metadata Poisoning**: Fake metadata injection
- **Frame Interpolation**: Advanced frame blending

### 🎨 Visual Effects
- **Border**: Visible frame border
- **Timestamp**: Embedded time markers
- **Temporal Modification**: 
  - Drop 1 frame, duplicate 2 frames
  - No reverse segments

### 📊 Metadata
- **Custom Title**: Style-specific titles
- **Description**: Detailed processing info
- **Tags**: Categorized for each style

## 🎭 Subtitle Styles Tested

### 1. 🌸 Girlboss Ultimate (`girlboss_ultimate.mp4`)
```
Content: "GIRLBOSS ENERGY! 💅✨", "OWN YOUR POWER! 👑", etc.
Color: Hot Pink (#FF1493)
Animation: Shake effect
Shadow: 2.5x strength
Position: 18% from bottom
```

### 2. 🚨 Hormozi Viral Ultimate (`hormozi_ultimate.mp4`)
```
Content: "ATTENTION ENTREPRENEURS! 🚨💰", "This will CHANGE your LIFE! 🔥"
Colors: Multi-color array (Green, Red, Blue, Yellow, Magenta, Cyan)
Animation: Intense shake
Shadow: 4x strength (maximum impact)
Position: 15% from bottom
```

### 3. ✨ ThinToBold Ultimate (`thintobold_ultimate.mp4`)
```
Content: "ELEGANT TYPOGRAPHY", "SMOOTH TRANSITIONS"
Color: Pure White (#FFFFFF)
Animation: None (elegant simplicity)
Shadow: 1.8x strength (subtle)
Position: 22% from bottom
```

### 4. 🌈 WavyColors Ultimate (`wavycolors_ultimate.mp4`)
```
Content: "RAINBOW COLORS FLOWING 🌈✨", "PSYCHEDELIC EXPERIENCE! 🌟"
Effect: Rainbow flowing colors
Outline: 3px width
Position: 12% from bottom
```

### 5. 🎯 Basic Ultimate (`basic_ultimate.mp4`)
```
Content: "Professional Content", "Clean and Simple"
Color: White with black background
Style: Bold, traditional
Background: Black with 80% opacity
Position: Bottom center with 35px margin
```

## 🎮 Additional Tests

### 6. 📸 GIF Conversion (`ultimate_effects.gif`)
- Same video with GIF format output
- All effects preserved in animated GIF

### 7. 🖼️ PNG Thumbnail (`ultimate_thumbnail.png`)
- Static frame extraction with effects
- High-quality thumbnail generation

### 8. ⚡ Extreme Effects (`extreme_effects.mp4`)
```
Maximized Settings (No Subtitles):
- Speed: 1.8x (nearly double speed)
- Zoom: 1.5x (heavy zoom)
- Saturation: 1.8x (hyper-saturated)
- Lightness: +30% (very bright)
- Audio Pitch: 1.2x (chipmunk effect)
- Background Audio: 30% volume
- Smart Crop: 1.5% with random direction
- EQ: Extreme (Low: 3x, Mid: -2x, High: 4x)
- Reverb: 15% with 80ms delay
- Background: Crowd noise at 8%
- Horizontal Flip: Enabled
```

### 9. 🎭 Mixed Styles Showcase (`mixed_styles_test.mp4`)
- Hormozi style with moderate effects
- Demonstration of feature combinations
- Speed: 1.3x, Saturation: 1.4x, Lightness: +20%

## 🚀 Usage

### Prerequisites
1. **Server Running**: Your Nuxt API server must be running on `localhost:3000`
2. **Bash Environment**: Use Git Bash, WSL, or Linux terminal
3. **Internet Connection**: For downloading test video

### Run the Script

```bash
# Make executable (Linux/Mac)
chmod +x test-all-features.sh

# Run the ultimate test suite
./test-all-features.sh

# Or run with bash directly (Windows)
bash test-all-features.sh
```

## 📁 Output Structure

```
test_outputs_full/
├── girlboss_ultimate.mp4      # 🌸 Girlboss + ALL effects
├── hormozi_ultimate.mp4       # 🚨 Hormozi + ALL effects  
├── thintobold_ultimate.mp4    # ✨ ThinToBold + ALL effects
├── wavycolors_ultimate.mp4    # 🌈 WavyColors + ALL effects
├── basic_ultimate.mp4         # 🎯 Basic + ALL effects
├── ultimate_effects.gif       # 📸 GIF conversion
├── ultimate_thumbnail.png     # 🖼️ PNG thumbnail
├── extreme_effects.mp4        # ⚡ Maximum effects
└── mixed_styles_test.mp4      # 🎭 Mixed showcase
```

## ⏱️ Expected Runtime

- **Total Tests**: 9 comprehensive requests
- **Estimated Time**: 15-25 minutes (depends on server performance)
- **File Sizes**: 50-200MB per video (varies by effects)

## 🔧 Customization

### Modify Video Source
```bash
# Change the test video URL
TEST_VIDEO="https://your-video-url.com/video.mp4"
```

### Adjust Effects Intensity
```bash
# In the make_request function, modify:
"speedFactor": 1.15,    # 1.0 = normal speed
"zoomFactor": 1.08,     # 1.0 = no zoom
"saturationFactor": 1.25, # 1.0 = original colors
```

### Change Subtitle Content
Each test has customized SRT content matching the style:
- **Girlboss**: Empowering, feminine energy
- **Hormozi**: Attention-grabbing, entrepreneur-focused
- **ThinToBold**: Professional, elegant
- **WavyColors**: Colorful, psychedelic
- **Basic**: Simple, professional

## 🐛 Troubleshooting

### Common Issues

1. **Server Not Running**
   ```bash
   # Start your Nuxt server first
   npm run dev
   # or
   pnpm dev
   ```

2. **Permission Denied (Linux/Mac)**
   ```bash
   chmod +x test-all-features.sh
   ```

3. **Output Directory Issues**
   ```bash
   # Manually create output directory
   mkdir -p test_outputs_full
   ```

4. **Network Issues**
   - Check internet connection
   - Try different test video URL
   - Verify server accessibility

### Debug Mode
Add `set -x` at the top of the script to see detailed execution:
```bash
#!/bin/bash
set -x  # Debug mode
```

## 🎯 Success Indicators

✅ **All tests complete**: 9/9 successful requests  
✅ **Files created**: All 9 output files present  
✅ **No errors**: Clean curl responses  
✅ **File sizes**: Reasonable output file sizes  

## 🚀 Next Steps

After running this ultimate test suite:

1. **Review Output Videos**: Check each style with effects
2. **Performance Analysis**: Monitor processing times
3. **Quality Assessment**: Verify all effects applied correctly
4. **Production Testing**: Use for real-world video processing
5. **API Optimization**: Identify bottlenecks if any

## 💡 Pro Tips

- **Batch Processing**: Run during off-peak hours for best performance
- **Storage Space**: Ensure adequate disk space (2-3GB recommended)
- **Server Resources**: Monitor CPU/memory usage during processing
- **Network Bandwidth**: High-quality video processing requires good connection

---

🎬 **This is the ultimate stress test for your video processing API!**  
🚀 **Every feature, every effect, every style - all tested comprehensively!** 