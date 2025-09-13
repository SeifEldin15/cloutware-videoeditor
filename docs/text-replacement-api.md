# Text Replacement API Documentation

## Overview
The text replacement functionality allows you to replace static text that appears in videos by covering it with a background and overlaying new text. This is different from subtitles as it's designed to replace text that's already burned into the video.

## API Endpoints

### 1. `/api/text-replace` - Dedicated Text Replacement
Replace static text in videos with new text and background.

**Method:** `POST`  
**Content-Type:** `application/json`

#### Request Body
```json
{
  "url": "https://example.com/video.mp4",
  "outputName": "text_replaced_video",
  "textReplacements": [
    {
      "region": {
        "x": 100,
        "y": 50,
        "width": 300,
        "height": 80
      },
      "background": {
        "color": "black",
        "opacity": 0.8
      },
      "text": "NEW TEXT",
      "textStyle": {
        "fontSize": 24,
        "fontColor": "#FFFFFF",
        "fontFamily": "Arial",
        "fontWeight": "bold",
        "alignment": "center",
        "verticalAlignment": "center",
        "outlineWidth": 2,
        "outlineColor": "#000000"
      }
    }
  ],
  "options": {
    "speedFactor": 1.0,
    "saturationFactor": 1.1
  }
}
```

### 2. `/api/encode` - General Processing with Text Replacement
Use text replacement as part of general video processing.

**Method:** `POST`  
**Content-Type:** `application/json`

#### Request Body (Extended)
```json
{
  "url": "https://example.com/video.mp4",
  "outputName": "processed_video",
  "format": "mp4",
  "caption": {
    "textReplacements": [
      {
        "region": {
          "x": 100,
          "y": 50,
          "width": 300,
          "height": 80
        },
        "background": {
          "color": "black",
          "opacity": 0.8
        },
        "text": "REPLACED TEXT",
        "textStyle": {
          "fontSize": 24,
          "fontColor": "#FFFFFF"
        }
      }
    ]
  },
  "options": {
    // Other video processing options
  }
}
```

## Parameters

### Required Parameters
- **url** (string): Video URL to process
- **textReplacements** (array): Array of text replacement configurations

### Text Replacement Configuration
Each text replacement object contains:

#### Region (required)
- **x** (number, optional): X coordinate for text positioning (pixels) - not needed if using `centerHorizontally`
- **y** (number): Y coordinate for text positioning (pixels)  
- **width** (number): Width reference for manual positioning (pixels) - not used with `centerHorizontally`
- **height** (number): Height reference for manual positioning (pixels) - not used with `centerHorizontally`
- **centerHorizontally** (boolean, optional): Automatically center text horizontally (default: `false`)

#### Background (optional)
- **color** (enum): Background color - `"black"`, `"white"`, `"transparent"` (default: `"black"`)
- **opacity** (number): Background opacity - 0 to 1 (default: 1)

**Note**: Background is automatically sized and positioned behind the text with configurable padding.

#### Text (required)
- **text** (string): The replacement text to overlay

#### Text Style (optional)
- **fontSize** (number): Font size in pixels (8-200, default: 24)
- **fontColor** (string): Text color hex code (default: `"#FFFFFF"`)
- **fontFamily** (string): Font family name (default: `"Arial"`)
- **fontWeight** (enum): `"normal"` or `"bold"` (default: `"normal"`)
- **fontStyle** (enum): `"normal"` or `"italic"` (default: `"normal"`)
- **alignment** (enum): Horizontal alignment - `"left"`, `"center"`, `"right"` (default: `"center"`)
- **verticalAlignment** (enum): Vertical alignment - `"top"`, `"center"`, `"bottom"` (default: `"center"`)
- **outlineWidth** (number): Text outline width (0-10, default: 0)
- **outlineColor** (string): Outline color hex code (default: `"#000000"`)
- **shadowOffsetX** (number): Shadow horizontal offset (-50 to 50, default: 0)
- **shadowOffsetY** (number): Shadow vertical offset (-50 to 50, default: 0)
- **shadowColor** (string): Shadow color hex code (default: `"#000000"`)
- **shadowOpacity** (number): Shadow opacity (0-1, default: 0)

### Optional General Parameters
- **outputName** (string): Output filename (default: `"text_replaced_video"`)
- **options** (object): General video processing options (speed, zoom, saturation, lightness)

## Usage Examples

### Basic Text Replacement (Auto-Centered)
Replace a logo or watermark with your own branding:

```json
{
  "url": "https://example.com/branded-video.mp4",
  "outputName": "rebranded_video",
  "textReplacements": [
    {
      "region": {
        "y": 100,
        "width": 200,
        "height": 50,
        "centerHorizontally": true
      },
      "background": {"color": "black", "opacity": 0.9},
      "text": "YOUR BRAND",
      "textStyle": {
        "fontSize": 24,
        "fontColor": "#00FF00",
        "fontWeight": "bold"
      }
    }
  ]
}
```

### Multiple Text Replacements (Auto-Centered)
Replace multiple text elements in the same video:

```json
{
  "url": "https://example.com/video.mp4",
  "textReplacements": [
    {
      "region": {
        "y": 100,
        "width": 300,
        "height": 60,
        "centerHorizontally": true
      },
      "background": {"color": "black", "opacity": 0.8},
      "text": "Main Title Replacement",
      "textStyle": {"fontSize": 32, "fontWeight": "bold"}
    },
    {
      "region": {
        "y": 1600,
        "width": 200,
        "height": 40,
        "centerHorizontally": true
      },
      "background": {"color": "white", "opacity": 0.9},
      "text": "Subtitle Text",
      "textStyle": {"fontSize": 18, "fontColor": "#333333"}
    }
  ]
}
```

### Manual Positioning (Legacy)
For precise manual positioning (not recommended for most use cases):

```json
{
  "textReplacements": [
    {
      "region": {
        "x": 100,
        "y": 200,
        "width": 400,
        "height": 100
      },
      "background": {"color": "white", "opacity": 0.9},
      "text": "Manually Positioned Text",
      "textStyle": {
        "fontSize": 28,
        "fontColor": "#333333",
        "alignment": "center",
        "outlineWidth": 1,
        "outlineColor": "#000000"
      }
    }
  ]
}
```

**Note**: Auto-centering (`centerHorizontally: true`) is recommended for most use cases as it ensures perfect alignment and works across all video resolutions.

## Response
Returns processed video stream with specified text replacements applied.

**Content-Type:** `video/mp4`  
**Content-Disposition:** `attachment; filename="[outputName].mp4"`

## Error Handling
- **400**: Invalid request parameters or URL
- **500**: Video processing error

Common error messages:
- "Text replacements can only be applied to MP4 format videos"
- "At least one text replacement is required" 
- "Cannot access video URL"
- "Replacement text cannot be empty"

## Technical Notes
- Text replacement uses FFmpeg's `drawtext` filter with built-in background support
- **Perfect alignment**: Text and background are automatically aligned using FFmpeg's native `box` feature
- **Dynamic centering**: Uses FFmpeg's built-in variables (`w`, `tw`) for automatic centering
- **Resolution independent**: Works with any video resolution (720p, 1080p, 4K, etc.)
- Multiple text replacements are processed in sequence
- Only MP4 format supports text replacement functionality

## Dynamic Centering & Background Alignment

### How It Works
The new implementation uses FFmpeg's built-in text background feature for perfect alignment:
- `w` = video width (automatically detected)
- `h` = video height (automatically detected)  
- `tw` = text width (calculated by FFmpeg)
- `th` = text height (calculated by FFmpeg)

### Centering Formula
When `centerHorizontally: true` is set:
- **Text position**: `x = (w - tw) / 2` (perfectly centered)
- **Background**: Automatically positioned behind text using `box=1:boxcolor=...`
- **Padding**: Configurable padding around text via `boxborderw`

### Key Advantages
- ✅ **Perfect alignment**: Background is always exactly behind the text
- ✅ **No positioning errors**: FFmpeg handles alignment natively
- ✅ **Resolution independent**: Works on any video size automatically
- ✅ **Simpler configuration**: Just set `centerHorizontally: true`

## Implementation Changes (v2.0)

### What Changed
The text replacement system has been completely rewritten for better alignment and reliability:

**Previous Implementation (v1.x):**
- Used separate `drawbox` and `drawtext` filters
- Manual coordination between background and text positioning
- Potential alignment inconsistencies

**Current Implementation (v2.0):**
- Uses `drawtext` filter with built-in `box` feature
- Single filter handles both text and background
- Automatic perfect alignment
- Simplified centering using `(w-tw)/2`

### Migration Guide
If you're updating from v1.x:
1. **Centering**: Replace manual `x` calculations with `centerHorizontally: true`
2. **Background**: No changes needed - same `color` and `opacity` options
3. **Positioning**: `width` and `height` in `region` are now optional when using `centerHorizontally` 