# Template-Based Video Processing System

This new functionality allows users to easily process videos with predefined subtitle style templates. Instead of manually configuring all the styling parameters, users can simply specify a template name along with their video and SRT content.

## 🚀 Quick Start

### Basic Usage

Send a POST request to `/api/encode-template` with just 3 required fields:

```bash
curl -X POST http://localhost:3000/api/encode-template \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com/your-video.mp4",
    "srtContent": "1\n00:00:00,000 --> 00:00:03,000\nHello World!",
    "templateName": "girlboss"
  }' \
  --output my_video.mp4
```

## 📋 Available Templates

### 1. **Girlboss** (`girlboss`)
- **Style**: Bold, energetic with shake animation
- **Colors**: Pink (#FF1493) 
- **Font**: Luckiest Guy (32px)
- **Word Mode**: Single word emphasis (1 word per group)
- **Perfect for**: Motivational content, empowerment videos

### 2. **Hormozi** (`hormozi`) 
- **Style**: High-energy multi-color attention-grabbing
- **Colors**: Green, Red, Blue, Yellow rotating
- **Font**: Luckiest Guy (50px)
- **Word Mode**: Single word impact (1 word per group)
- **Perfect for**: Sales videos, urgent announcements

### 3. **TikTok Style** (`tiktokstyle`)
- **Style**: Single vibrant color with shake
- **Colors**: Bright Yellow (#FFFF00)
- **Font**: Luckiest Guy (50px)
- **Word Mode**: Multiple words for social flow (2 words per group)
- **Perfect for**: Social media content, viral videos

### 4. **Thin to Bold** (`thintobold`)
- **Style**: Elegant transformation effect
- **Colors**: White text
- **Font**: Montserrat Thin → Bold transition (50px)
- **Word Mode**: Normal flow for elegance (standard timing)
- **Perfect for**: Professional content, sophisticated videos

### 5. **Wavy Colors** (`wavycolors`)
- **Style**: Rainbow-colored wavy animations
- **Colors**: Full spectrum rainbow
- **Font**: Luckiest Guy (50px)
- **Word Mode**: Multiple words for color effects (2 words per group)
- **Perfect for**: Creative content, artistic videos

### 6. **Shrinking Pairs** (`shrinkingpairs`)
- **Style**: Dynamic shrinking effect for word groups
- **Colors**: White text
- **Font**: Luckiest Guy (36px)
- **Word Mode**: Multiple words for shrinking effect (4 words per group)
- **Perfect for**: Multiple word emphasis, dynamic content

### 7. **Reveal & Enlarge** (`revealenlarge`)
- **Style**: Color-cycling with reveal and enlarge effects
- **Colors**: Multiple colors rotating
- **Font**: Luckiest Guy (50px)
- **Word Mode**: Single word for dramatic reveals (1 word per group)
- **Perfect for**: Dramatic reveals, exciting announcements

### 8. **Basic** (`basic`)
- **Style**: Clean and professional
- **Colors**: White text on black background
- **Font**: Arial (32px)
- **Word Mode**: Normal flow for professional presentation (standard timing)
- **Perfect for**: Business content, professional videos

## 🔗 API Endpoints

### GET `/api/encode-template`
Lists all available templates with descriptions.

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
    }
  ]
}
```

### POST `/api/encode-template`
Process video with template styling.

**Required Fields:**
- `url`: Video URL (string)
- `srtContent`: SRT subtitle content (string)
- `templateName`: Template name (string)

**Optional Fields:**
- `outputName`: Output filename (string, default: "template_video")
- `options`: Video processing options (object)

## 📝 SRT Format

Your SRT content should follow standard SRT format:

```
1
00:00:00,000 --> 00:00:03,000
First subtitle line

2
00:00:03,000 --> 00:00:06,000
Second subtitle line

3
00:00:06,000 --> 00:00:09,000
Third subtitle line
```

## 🧪 Testing

### Test Single Template
```bash
./test-template-functionality.sh girlboss
```

### List Available Templates
```bash
./test-template-functionality.sh list
```

### Test All Templates
```bash
./examples/template-usage-examples.sh all
```

## 💻 JavaScript Example

```javascript
const response = await fetch('http://localhost:3000/api/encode-template', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    url: 'https://example.com/video.mp4',
    srtContent: '1\n00:00:00,000 --> 00:00:03,000\nHello World!',
    templateName: 'girlboss',
    outputName: 'my_video'
  })
});

if (response.ok) {
  const blob = await response.blob();
  // Handle the video blob
} else {
  const error = await response.json();
  console.error('Error:', error);
}
```

## 🎯 Benefits

1. **Simplicity**: Only 3 required fields vs 15+ styling parameters
2. **Consistency**: Predefined templates ensure consistent branding
3. **Speed**: No need to research optimal styling combinations
4. **Quality**: Templates are tested and optimized for each style

## 🔄 Migration from Manual Styling

**Before (Manual):**
```json
{
  "url": "video.mp4",
  "caption": {
    "srtContent": "...",
    "subtitleStyle": "girlboss",
    "fontFamily": "Luckiest Guy",
    "fontSize": 32,
    "girlbossColor": "#FF1493",
    "shadowStrength": 2.0,
    "animation": "shake",
    "verticalPosition": 18,
    "outlineWidth": 3,
    "outlineColor": "#000000",
    "outlineBlur": 1
  }
}
```

**After (Template):**
```json
{
  "url": "video.mp4",
  "srtContent": "...",
  "templateName": "girlboss"
}
```

## 🚀 Example with Your Video

Using the provided example video:

```bash
curl -X POST http://localhost:3000/api/encode-template \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://dkkaakuajsyehonlipbu.supabase.co/storage/v1/object/public/videos/tiktok/6736250773027767302/7362188339048353066",
    "srtContent": "1\n00:00:00,000 --> 00:00:03,000\nGIRLBOSS ENERGY! 💅✨\n\n2\n00:00:03,000 --> 00:00:06,000\nOWN YOUR POWER! 👑",
    "templateName": "girlboss",
    "outputName": "my_girlboss_video"
  }' \
  --output my_girlboss_video.mp4
```

This will apply the exact same Girlboss styling parameters from your test file, but using your custom SRT content and video URL. 