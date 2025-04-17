# Video Processing API Documentation

## Overview
This API allows you to process videos with various filters and effects, including background audio addition, format conversion, and anti-detection measures.

## API Endpoint
```
POST http://[your-server]/api/process-video
```

## Request Format
All requests should be sent as JSON with `Content-Type: application/json`.

### Common Parameters
- `url` (required): URL of the video to process
- `outputName` (optional): Name for the output file (default: "video")
- `format` (optional): Output format (default: "h265")
- `options` (optional): Processing options

## Supported Formats

### H265 (Default)
H265/HEVC is a modern video codec with better compression and quality than MP4.

```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/process-video" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{
    "url": "https://example.com/video.mp4",
    "outputName": "processed-video"
  }' `
  -OutFile "processed-video.mp4"
```

```bash
# Unix/Linux/MacOS curl example
curl -X POST "http://localhost:3000/api/process-video" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com/video.mp4",
    "outputName": "processed-video"
  }' \
  --output processed-video.mp4
```

### MP4
Standard MP4 format.

```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/process-video" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{
    "url": "https://example.com/video.mp4",
    "outputName": "processed-video",
    "format": "mp4",
    "options": {
      "backgroundAudio": true,
      "backgroundAudioVolume": 0.2
    }
  }' `
  -OutFile "processed-video.mp4"
```

### MKV
Matroska format with more flexibility for advanced users.

```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/process-video" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{
    "url": "https://example.com/video.mp4",
    "outputName": "processed-video",
    "format": "mkv"
  }' `
  -OutFile "processed-video.mkv"
```

### GIF (3-second clip)
Animated GIF format (limited to 3 seconds by default).

```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/process-video" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{
    "url": "https://example.com/video.mp4",
    "outputName": "animation",
    "format": "gif"
  }' `
  -OutFile "animation.gif"
```

### PNG (Thumbnail)
Extracts a single frame as a PNG thumbnail.

```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/process-video" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{
    "url": "https://example.com/video.mp4",
    "outputName": "thumbnail",
    "format": "png"
  }' `
  -OutFile "thumbnail.png"
```

## Processing Options
You can customize the processing by adding these options:

```json
"options": {
  "backgroundAudio": true,          // Add background audio
  "backgroundAudioVolume": 0.2,     // Volume of background audio (0.05-0.5)
  "speedFactor": 1.2,               // Speed up/slow down (0.5-2.0)
  "zoomFactor": 1.1,                // Zoom in effect (1.0-2.0)
  "saturationFactor": 1.2,          // Color saturation (0.5-2.0)
  "lightness": 0.1,                 // Adjust brightness (-0.5 to 0.5)
  "audioPitch": 1.1,                // Adjust audio pitch (0.5-1.5)
  "subtitleText": "Custom text",    // Add subtitle text
  "resolution": "720x1280",         // Custom resolution
  "visibleChanges": {
    "horizontalFlip": true,         // Flip the video horizontally
    "border": true,                 // Add border
    "timestamp": true               // Add timestamp
  },
  "antiDetection": {
    "pixelShift": true,             // Shift pixels slightly
    "microCrop": true,              // Subtle cropping
    "subtleRotation": true,         // Rotate slightly
    "noiseAddition": true,          // Add noise
    "metadataPoisoning": true,      // Randomize metadata
    "frameInterpolation": true      // Frame interpolation
  }
}
```

## Advanced Options
Additional advanced options for specific use cases:

```json
"options": {
  "smartCrop": {
    "percentage": 0.8,                // Crop percentage (0.1-2.0)
    "direction": "center"             // Crop direction: center, top, bottom, left, right, random
  },
  "temporalModification": {
    "dropFrames": 1,                  // Number of frames to drop (0-10)
    "duplicateFrames": 1,             // Number of frames to duplicate (0-10)
    "reverseSegments": true           // Reverse some segments
  },
  "audioTempoMod": {
    "tempoFactor": 1.1,               // Change audio tempo (0.8-1.2)
    "preservePitch": true             // Preserve pitch during tempo change
  },
  "syncShift": 100,                   // Audio-video sync shift in ms (-500 to 500)
  "eqAdjustments": {
    "low": 2,                         // Bass adjustment (-5 to 5)
    "mid": 0,                         // Mid adjustment (-5 to 5)
    "high": -1                        // Treble adjustment (-5 to 5)
  },
  "reverbEffect": {
    "level": 0.1,                     // Reverb level (0.05-0.2)
    "delay": 50                       // Reverb delay (20-100)
  },
  "backgroundAddition": {
    "type": "room",                   // Type: room, crowd, nature, white_noise
    "level": 0.05                     // Level (0.01-0.1)
  },
  "metadata": {
    "title": "Custom Title",          // Custom metadata
    "artist": "Custom Artist"
  }
}
```

## Example with All Features
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/process-video" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{
    "url": "https://example.com/video.mp4",
    "outputName": "enhanced-video",
    "format": "h265",
    "options": {
      "backgroundAudio": true,
      "backgroundAudioVolume": 0.15,
      "speedFactor": 1.1,
      "saturationFactor": 1.15,
      "lightness": 0.05,
      "antiDetection": {
        "pixelShift": true,
        "microCrop": true,
        "subtleRotation": true,
        "noiseAddition": true,
        "metadataPoisoning": true
      }
    }
  }' `
  -OutFile "enhanced-video.mp4"
```

## Error Handling
The API returns a 500 status code with an error message when processing fails:

```json
{
  "error": "Failed to process video: [error message]"
}
```

## Notes
- The background audio feature uses the `audio.mp3` file in the server's root directory
- For large videos, expect longer processing times
- The API supports a variety of inputs from different sources (local files, web URLs)
- All anti-detection features are enabled by default 