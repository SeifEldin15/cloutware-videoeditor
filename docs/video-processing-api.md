# Video Processing API Documentation

## Overview
This API provides comprehensive video processing capabilities including subtitle generation, template-based styling, text-to-speech integration, video transcription, and various video effects.

**Base URL:** `http://localhost:3000/api`

---

## API Endpoints

### 1. `/api/encode` - General Video Processing
Process videos with various effects, formats, and optional subtitles.

**Method:** `POST`  
**Content-Type:** `application/json`

#### Request Body
```json
{
  "url": "https://example.com/video.mp4",
  "outputName": "processed_video",
  "format": "mp4",
"options": {
    // Video processing options
  },
  "caption": {
    // Subtitle options
  }
}
```

#### Parameters
- **url** (required): Video URL to process
- **outputName** (optional): Output filename (default: "encoded_video")
- **format** (optional): Output format - `mp4`, `gif`, `png` (default: "mp4")
- **options** (optional): Video processing options
- **caption** (optional): Subtitle configuration

#### Video Processing Options
```json
"options": {
  "speedFactor": 1.2,           // 0.5-2.0 (video speed)
  "zoomFactor": 1.1,            // 1.0-2.0 (zoom level)
  "saturationFactor": 1.2,      // 0.5-2.0 (color saturation)
  "lightness": 0.1,             // -0.5 to 0.5 (brightness)
  "audioPitch": 1.1,            // 0.5-1.5 (audio pitch)
  "backgroundAudio": true,      // Add background audio
  "backgroundAudioVolume": 0.2, // 0.05-0.5
  "resolution": "720x1280",     // Custom resolution
  "framerate": 30,              // Target framerate
  
  "smartCrop": {
    "percentage": 0.8,          // 0.1-2.0
    "direction": "center"       // center|top|bottom|left|right|random
  },
  
  "temporalModification": {
    "dropFrames": 1,            // 0-10 frames to drop
    "duplicateFrames": 1,       // 0-10 frames to duplicate
    "reverseSegments": true     // Reverse some segments
  },
  
  "audioTempoMod": {
    "tempoFactor": 1.1,         // 0.8-1.2
    "preservePitch": true       // Preserve pitch during tempo change
  },
  
  "syncShift": 100,             // -500 to 500ms audio sync shift
  
  "eqAdjustments": {
    "low": 2,                   // -5 to 5 bass
    "mid": 0,                   // -5 to 5 mid
    "high": -1                  // -5 to 5 treble
  },
  
  "reverbEffect": {
    "level": 0.1,               // 0.05-0.2
    "delay": 50                 // 20-100ms
  },
  
  "backgroundAddition": {
    "type": "room",             // room|crowd|nature|white_noise
    "level": 0.05               // 0.01-0.1
  },
  
  "visibleChanges": {
    "horizontalFlip": true,     // Flip horizontally
    "border": true,             // Add border
    "timestamp": true           // Add timestamp
  },
  
  "antiDetection": {
    "pixelShift": true,         // Shift pixels slightly
    "microCrop": true,          // Subtle cropping
    "subtleRotation": true,     // Rotate slightly
    "noiseAddition": true,      // Add noise
    "metadataPoisoning": true,  // Randomize metadata
    "frameInterpolation": true  // Frame interpolation
  },
  
  "metadata": {
    "title": "Custom Title",
    "artist": "Custom Artist"
  }
}
```

#### Caption Options
```json
"caption": {
  "srtContent": "1\n00:00:00,000 --> 00:00:03,000\nHello World!",
  "fontSize": 24,                    // 10-72
  "fontColor": "white",              // Color name or hex
  "fontFamily": "Arial",             // Font family name
  "fontStyle": "bold",               // regular|bold|italic
  "subtitlePosition": "bottom",      // top|middle|bottom
  "horizontalAlignment": "center",   // left|center|right
  "verticalMargin": 30,              // 10-100 pixels
  "verticalPosition": 15,            // 0-100 percentage from bottom
  "showBackground": true,            // Show background box
  "backgroundColor": "black@0.5",    // Background color with opacity
  "outlineWidth": 2,                 // 0-8 pixels
  "outlineColor": "#000000",         // Outline color
  "outlineBlur": 0,                  // 0-10 blur amount
  "shadowStrength": 1.5,             // 0.5-5.0
  "animation": "shake",              // none|shake
  
  // Advanced subtitle styles
  "subtitleStyle": "basic",          // basic|girlboss|hormozi|tiktokstyle|thintobold|wavycolors|shrinkingpairs|revealenlarge
  
  // Word processing modes
  "wordMode": "normal",              // normal|single|multiple
  "wordsPerGroup": 1,                // 1-10 words per group
  
  // Style-specific options
  "girlbossColor": "#F361D8",
  "hormoziColors": ["#0BF431", "#2121FF", "#1DE0FE", "#FFFF00"],
  "tiktokstyleColor": "#FFFF00",
  "thinToBoldColor": "#FFFFFF",
  "wavyColorsOutlineWidth": 2,
  "shrinkingPairsColor": "#0BF431",
  "revealEnlargeColors": ["#0BF431", "#2121FF", "#1DE0FE", "#FFFF00"]
}
```

#### Example Request
```bash
curl -X POST "http://localhost:3000/api/encode" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com/video.mp4",
    "outputName": "enhanced_video",
    "format": "mp4",
    "options": {
      "speedFactor": 1.1,
      "saturationFactor": 1.2,
      "backgroundAudio": true,
      "antiDetection": {
        "pixelShift": true,
        "noiseAddition": true
      }
    },
    "caption": {
      "srtContent": "1\n00:00:00,000 --> 00:00:03,000\nHello World!",
      "fontSize": 32,
      "fontColor": "yellow",
      "subtitleStyle": "basic"
    }
  }' \
  --output enhanced_video.mp4
```

---

### 2. `/api/encode-template` - Template-Based Subtitle Styling
Process videos with predefined subtitle templates for quick styling.

**Methods:** `GET`, `POST`

#### GET - List Available Templates
Returns all available subtitle templates.

```bash
curl -X GET "http://localhost:3000/api/encode-template"
```

**Response:**
```json
{
  "success": true,
  "message": "Available style templates",
  "templates": [
    {
      "name": "Girlboss",
      "key": "girlboss",
      "description": "Bold, energetic style with shake animation and pink colors",
      "fontFamily": "Luckiest Guy"
    },
    {
      "name": "Hormozi",
      "key": "hormozi", 
      "description": "High-energy multi-color style for attention-grabbing content",
      "fontFamily": "Luckiest Guy"
    }
    // ... more templates
  ]
}
```

#### POST - Process Video with Template
Apply a predefined template to video subtitles.

```json
{
  "url": "https://example.com/video.mp4",
  "srtContent": "1\n00:00:00,000 --> 00:00:03,000\nHello World!",
  "templateName": "girlboss",
  "outputName": "styled_video",
  "options": {
    // Same options as /api/encode
  }
}
```

#### Available Templates

1. **girlboss** - Bold, energetic style with shake animation and pink colors
2. **hormozi** - High-energy multi-color style for attention-grabbing content  
3. **tiktokstyle** - Single vibrant color style perfect for social media
4. **thintobold** - Elegant style with smooth transitions from thin to bold font
5. **wavycolors** - Rainbow-colored text with wavy animations
6. **shrinkingpairs** - Dynamic shrinking effect for multiple word groups
7. **revealenlarge** - Color-cycling text with reveal and enlarge effects
8. **basic** - Clean and professional style for business content

#### Example Request
```bash
curl -X POST "http://localhost:3000/api/encode-template" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com/video.mp4",
    "srtContent": "1\n00:00:00,000 --> 00:00:03,000\nATTENTION! This will CHANGE your LIFE!",
    "templateName": "hormozi",
    "outputName": "hormozi_style_video"
  }' \
  --output hormozi_style_video.mp4
```

---

### 3. `/api/caption` - Basic Subtitle Addition
Add basic subtitles to videos with simple styling options.

**Method:** `POST`

```json
{
  "url": "https://example.com/video.mp4",
  "srtContent": "1\n00:00:00,000 --> 00:00:03,000\nHello World!",
  "outputName": "captioned_video",
  "fontSize": 24,
  "fontColor": "white",
  "fontFamily": "Arial",
  "fontStyle": "bold",
  "subtitlePosition": "bottom",
  "horizontalAlignment": "center",
  "verticalMargin": 30,
  "showBackground": true,
  "backgroundColor": "black@0.5"
}
```

#### Example Request
```bash
curl -X POST "http://localhost:3000/api/caption" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com/video.mp4",
    "srtContent": "1\n00:00:00,000 --> 00:00:03,000\nWelcome to our presentation!",
    "outputName": "presentation_with_captions",
    "fontSize": 28,
    "fontColor": "yellow",
    "showBackground": true
  }' \
  --output presentation_with_captions.mp4
```

---

### 4. `/api/text-to-speech` - AI Voiceover Generation
Add AI-generated voiceover to videos using ElevenLabs text-to-speech.

**Method:** `POST`  
**Required:** `ELEVENLABS_API_KEY` environment variable

```json
{
  "videoUrl": "https://example.com/video.mp4",
  "text": "This is the text that will be converted to speech",
  "outputName": "voiceover_video",
  "voice": "21m00Tcm4TlvDq8ikWAM",
  "speed": 1.0
}
```

#### Parameters
- **videoUrl** (required): URL of the video to add voiceover to
- **text** (required): Text to convert to speech
- **outputName** (optional): Output filename (default: "voiceover_video")
- **voice** (optional): ElevenLabs voice ID (default: Rachel voice)
- **speed** (optional): Speech speed 0.5-2.0 (default: 1.0)

#### Example Request
```bash
curl -X POST "http://localhost:3000/api/text-to-speech" \
  -H "Content-Type: application/json" \
  -d '{
    "videoUrl": "https://example.com/silent-video.mp4",
    "text": "Welcome to our amazing product demonstration. This AI voice will guide you through all the features.",
    "outputName": "demo_with_voiceover",
    "voice": "21m00Tcm4TlvDq8ikWAM",
    "speed": 1.1
  }' \
  --output demo_with_voiceover.mp4
```

---

### 5. `/api/transcribe-video` - Video Transcription
Transcribe video audio to text or SRT format using AssemblyAI.

**Method:** `POST`  
**Required:** `ASSEMBLYAI_API_KEY` environment variable

```json
{
  "url": "https://example.com/video.mp4",
  "outputFormat": "srt",
  "language": "en",
  "speakerLabels": false,
  "punctuate": true,
  "formatText": true
}
```

#### Parameters
- **url** (required): Video URL to transcribe
- **outputFormat** (optional): Output format - `json`, `text`, `srt`, `vtt` (default: "json")
- **language** (optional): Language code (default: "en")
- **speakerLabels** (optional): Enable speaker identification (default: false)
- **punctuate** (optional): Add punctuation (default: true)
- **formatText** (optional): Format text properly (default: true)

#### Response Formats

**JSON Response:**
```json
{
  "text": "Hello, this is the transcribed text...",
  "words": [
    {
      "text": "Hello",
      "start": 0,
      "end": 500,
      "confidence": 0.99
    }
  ],
  "confidence": 0.94,
  "language": "en",
  "duration": 30.5
}
```

**SRT Response:**
```
1
00:00:00,000 --> 00:00:03,000
Hello, this is the transcribed text

2
00:00:03,000 --> 00:00:06,000
from the video audio track.
```

#### Example Requests
```bash
# Get JSON transcription
curl -X POST "http://localhost:3000/api/transcribe-video" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com/video.mp4",
    "outputFormat": "json"
  }'

# Get SRT subtitles
curl -X POST "http://localhost:3000/api/transcribe-video" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com/video.mp4",
    "outputFormat": "srt",
    "language": "en"
  }'
```

---

## Complete Workflow Examples

### 1. Full Video Processing Pipeline
```bash
# Step 1: Transcribe video to get SRT
curl -X POST "http://localhost:3000/api/transcribe-video" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com/raw-video.mp4",
    "outputFormat": "srt"
  }' > subtitles.srt

# Step 2: Process video with template using generated SRT
curl -X POST "http://localhost:3000/api/encode-template" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com/raw-video.mp4",
    "srtContent": "'$(cat subtitles.srt)'",
    "templateName": "hormozi",
    "outputName": "final_video",
    "options": {
      "speedFactor": 1.1,
      "saturationFactor": 1.2,
      "antiDetection": {
        "pixelShift": true,
        "noiseAddition": true
      }
    }
  }' \
  --output final_video.mp4
```

### 2. AI Voiceover Creation
```bash
# Add AI voiceover to silent video
curl -X POST "http://localhost:3000/api/text-to-speech" \
  -H "Content-Type: application/json" \
  -d '{
    "videoUrl": "https://example.com/silent-video.mp4",
    "text": "This is an AI-generated voiceover that explains the content of this video in a clear and engaging way.",
    "outputName": "video_with_ai_voice",
    "speed": 1.1
  }' \
  --output video_with_ai_voice.mp4
```

### 3. Social Media Content Creation
```bash
# Create TikTok-style video with vibrant subtitles
curl -X POST "http://localhost:3000/api/encode-template" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com/content.mp4",
    "srtContent": "1\n00:00:00,000 --> 00:00:02,500\nCRAZY life hack! 🤯\n\n2\n00:00:02,500 --> 00:00:05,000\nYou NEED to try this! 🔥\n\n3\n00:00:05,000 --> 00:00:07,500\nLike and follow for MORE! 👍",
    "templateName": "tiktokstyle",
    "outputName": "viral_content",
    "options": {
      "resolution": "720x1280",
      "speedFactor": 1.2,
      "saturationFactor": 1.3
    }
  }' \
  --output viral_content.mp4
```

---

## Error Handling

All APIs return appropriate HTTP status codes and error messages:

**Success Response (200):**
- Returns video file stream for processing endpoints
- Returns JSON for information endpoints

**Error Response (500):**
```json
{
  "error": "Failed to process video: [specific error message]"
}
```

Common error scenarios:
- Invalid video URL or inaccessible video
- Missing required parameters
- Invalid parameter values
- Missing API keys for external services
- Processing failures

---

## Environment Variables

Set these environment variables for full functionality:

```bash
# Required for text-to-speech API
ELEVENLABS_API_KEY=your_elevenlabs_api_key

# Required for transcription API  
ASSEMBLYAI_API_KEY=your_assemblyai_api_key
```

---

## Tips and Best Practices

1. **Video URLs**: Ensure videos are publicly accessible via HTTP/HTTPS
2. **SRT Format**: Use proper SRT timing format: `HH:MM:SS,mmm --> HH:MM:SS,mmm`
3. **Template Selection**: Choose templates based on content type (business vs. social media)
4. **Performance**: Larger videos take longer to process; consider video size and length
5. **Output Names**: Use only alphanumeric characters, underscores, and hyphens
6. **Anti-Detection**: Enable anti-detection features for content that needs to avoid automated detection
7. **Testing**: Test with shorter videos first to verify settings before processing long content

---

## Supported Formats

**Input:** MP4, MOV, AVI, MKV (any format supported by FFmpeg)  
**Output:** MP4, GIF, PNG (depending on endpoint)  
**Subtitles:** SRT format required for all subtitle operations 