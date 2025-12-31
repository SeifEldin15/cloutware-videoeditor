# Video Processing Animation Styles Documentation

**Version:** 1.0  
**Last Updated:** January 2025  
**System:** Video Processing with Advanced Subtitle Animations

---

## Table of Contents

1. [Overview](#overview)
2. [Animation Styles](#animation-styles)
   - [Girlboss Animation](#1-girlboss-animation)
   - [Hormozi Viral Animation](#2-hormozi-viral-animation)
   - [ThinToBold Animation](#3-thintobold-animation)
   - [WavyColors Animation](#4-wavycolors-animation)
   - [Basic Animation](#5-basic-animation)
3. [Font Recommendations](#font-recommendations)
4. [Common Parameters](#common-parameters)
5. [API Usage](#api-usage)
6. [Best Practices](#best-practices)
7. [Troubleshooting](#troubleshooting)
8. [Subtitle Styles](#subtitle-styles)
9. [Basic Settings](#basic-settings)
10. [Style-Specific Options](#style-specific-options)
11. [Word Mode Processing](#word-mode-processing)
12. [Examples](#examples)
13. [Testing](#testing)

---

## Overview

This system provides **5 main animation styles** for subtitle rendering, each with unique visual effects, parameters, and use cases. 

### Core Features
- ✅ Dynamic font selection
- ✅ Color customization  
- ✅ Shadow/glow effects
- ✅ Positioning controls
- ✅ Shake animations (optional)
- ✅ ASS subtitle format output

---

## Animation Styles

### 1. Girlboss Animation

**Perfect for:** Beauty, lifestyle, empowerment content

#### Description
Feminine, empowering style with pink/customizable colors, smooth word-by-word reveals with glow effects.

#### Font
**Luckiest Guy** (Bold, Impact style)

#### Parameters
| Parameter | Type | Range | Default | Description |
|-----------|------|-------|---------|-------------|
| `subtitleStyle` | string | - | - | `"girlboss"` |
| `fontFamily` | string | - | - | `"Luckiest Guy"` (recommended) |
| `fontSize` | number | 10-72 | 48 | Font size in pixels |
| `girlbossColor` | string | HEX | `"#FF1493"` | Hot pink color |
| `girlbossShadowStrength` | number | 0.5-3.0 | 1.0 | Shadow intensity |
| `girlbossAnimation` | string | none/shake | `"none"` | Animation type |
| `verticalPosition` | number | 0-100 | 18 | Position from bottom (%) - UNIVERSAL |

#### Visual Effects
- Word-by-word color reveal
- Soft glow/shadow effects
- Smooth transitions
- Optional shake animation for emphasis

#### Example Usage
```json
{
  "subtitleStyle": "girlboss",
  "fontFamily": "Luckiest Guy",
  "fontSize": 48,
  "girlbossColor": "#FF1493",
  "girlbossShadowStrength": 2.0,
  "girlbossAnimation": "shake",
  "verticalPosition": 18
}
```

---

### 2. Hormozi Viral Animation

**Perfect for:** Business, entrepreneurship, viral content

#### Description
High-energy viral style with alternating bright colors per word. Designed for maximum attention and engagement. Inspired by Alex Hormozi's viral content style.

#### Font
**Luckiest Guy** (Bold, Impact style)

#### Parameters
| Parameter | Type | Range | Default | Description |
|-----------|------|-------|---------|-------------|
| `subtitleStyle` | string | - | - | `"hormozi"` |
| `fontFamily` | string | - | - | `"Luckiest Guy"` (recommended) |
| `fontSize` | number | 10-72 | 50 | Font size in pixels |
| `hormoziColors` | array | HEX colors | See below | Array of colors |
| `hormoziShadowStrength` | number | 1-5 | 3 | Shadow intensity |
| `hormoziAnimation` | string | none/shake | `"none"` | Animation type |
| `verticalPosition` | number | 0-100 | 15 | Position from bottom (%) - UNIVERSAL |

#### Default Color Sequence
1. **#0BF431** - Bright Green (signature Hormozi color)
2. **#2121FF** - Blue
3. **#1DE0FE** - Cyan
4. **#FFFF00** - Yellow

#### Visual Effects
- Word-by-word alternating colors
- Strong glow/shadow effects
- High contrast for maximum visibility
- Optional shake animation for viral effect

#### Example Usage
```json
{
  "subtitleStyle": "hormozi",
  "fontFamily": "Luckiest Guy",
  "fontSize": 50,
  "hormoziColors": ["#0BF431", "#FF0000", "#0080FF", "#FFFF00"],
  "hormoziShadowStrength": 3.5,
  "hormoziAnimation": "shake",
  "verticalPosition": 15
}
```

---

### 3. ThinToBold Animation

**Perfect for:** Professional, corporate, educational content

#### Description
Elegant, sophisticated animation that groups words in pairs with smooth reveals. Perfect for professional and refined content.

#### Font
**Montserrat Thin** (Elegant, Refined)

#### Parameters
| Parameter | Type | Range | Default | Description |
|-----------|------|-------|---------|-------------|
| `subtitleStyle` | string | - | - | `"thintobold"` |
| `fontFamily` | string | - | - | `"Montserrat Thin"` (recommended) |
| `fontSize` | number | 10-72 | 50 | Font size in pixels |
| `thinToBoldColor` | string | HEX | `"#FFFFFF"` | Text color |
| `thinToBoldShadowStrength` | number | 0.5-3.0 | 1.8 | Shadow intensity |
| `thinToBoldAnimation` | string | none/shake | `"none"` | Animation type |
| `verticalPosition` | number | 0-100 | 22 | Position from bottom (%) - UNIVERSAL |

#### Visual Effects
- Word-pair grouping (2 words at a time)
- Smooth, elegant transitions
- Minimal glow effects
- Clean, professional appearance

#### Example Usage
```json
{
  "subtitleStyle": "thintobold",
  "fontFamily": "Montserrat Thin",
  "fontSize": 50,
  "thinToBoldColor": "#FFFFFF",
  "thinToBoldShadowStrength": 1.8,
  "thinToBoldAnimation": "none",
  "verticalPosition": 22
}
```

---

### 4. WavyColors Animation

**Perfect for:** Entertainment, music videos, gaming content

#### Description
Dynamic rainbow color effects with wavy, flowing transitions. Creates eye-catching visual movement with character-level color cycling.

#### Font
**Luckiest Guy** (Bold, Impact style)

#### Parameters
| Parameter | Type | Range | Default | Description |
|-----------|------|-------|---------|-------------|
| `subtitleStyle` | string | - | - | `"wavycolors"` |
| `fontFamily` | string | - | - | `"Luckiest Guy"` (recommended) |
| `fontSize` | number | 10-72 | 50 | Font size in pixels |
| `wavyColorsOutlineWidth` | number | 1-5 | 3 | Outline thickness |
| `verticalPosition` | number | 0-100 | 12 | Position from bottom (%) - UNIVERSAL |

#### Built-in Color Sequence
- **Green** (#00FF00)
- **Yellow** (#FFFF00)
- **Light Blue** (#00FFFF)

#### Visual Effects
- Character-level color cycling
- Strong outline effects
- Blur and glow combinations
- Stretch effects for emphasis
- Continuous color wave motion

#### Example Usage
```json
{
  "subtitleStyle": "wavycolors",
  "fontFamily": "Luckiest Guy",
  "fontSize": 50,
  "wavyColorsOutlineWidth": 3,
  "verticalPosition": 12
}
```

---

### 5. Basic Animation

**Perfect for:** Standard subtitles, accessibility, professional content

#### Description
Clean, professional subtitle style without special effects. Standard subtitle appearance with full customization options.

#### Font
**Arial** (Professional, Clean)

#### Parameters
| Parameter | Type | Range | Default | Description |
|-----------|------|-------|---------|-------------|
| `subtitleStyle` | string | - | - | `"basic"` |
| `fontSize` | number | 10-72 | 48 | Font size in pixels |
| `fontColor` | string | Any color | `"white"` | Text color |
| `fontFamily` | string | Any font | `"Arial"` | Font family |
| `fontStyle` | string | regular/bold/italic | `"regular"` | Font style |
| `subtitlePosition` | string | top/middle/bottom | `"bottom"` | Vertical position |
| `horizontalAlignment` | string | left/center/right | `"center"` | Text alignment |
| `verticalPosition` | number | 10-100 | 35 | Position from bottom (%) - UNIVERSAL |
| `showBackground` | boolean | true/false | true | Show background box |
| `backgroundColor` | string | Color with opacity | `"black@0.8"` | Background color |

#### Example Usage
```json
{
  "subtitleStyle": "basic",
  "fontSize": 48,
  "fontColor": "white",
  "fontStyle": "bold",
  "subtitlePosition": "bottom",
  "horizontalAlignment": "center",
  "verticalPosition": 35,
  "showBackground": true,
  "backgroundColor": "black@0.8"
}
```

---

## Font Recommendations

### Primary Fonts
- **Luckiest Guy** - Bold, impactful, perfect for viral content
- **Montserrat Thin** - Elegant, refined, professional
- **Arial** - Clean, readable, universal

### Font Mapping by Style
| Animation Style | Recommended Font |
|----------------|------------------|
| Girlboss | Luckiest Guy |
| Hormozi | Luckiest Guy |
| WavyColors | Luckiest Guy |
| ThinToBold | Montserrat Thin |
| Basic | Arial |

### Available Fonts
- Arial, Arial Black
- Montserrat, Montserrat Thin, Montserrat ExtraBold, Montserrat Black
- Luckiest Guy
- Impact, Helvetica, Georgia, Times New Roman
- Verdana, Trebuchet, Comic Sans MS, Courier New
- Garamond, Palatino Linotype, Bookman Old Style
- Erica One, Bungee, Sigmar, Sora, Tahoma
- Gotham Ultra, Bodoni Moda

---

## Common Parameters

### Global Parameters (Available for all styles)
- `srtContent`: SRT subtitle content (required)
- `fontSize`: 10-72 pixels
- `fontFamily`: Font name (see available fonts)
- `horizontalAlignment`: "left" | "center" | "right"

### Animation Parameters
- `[style]Animation`: "none" | "shake"
  - **"none"**: Static positioning
  - **"shake"**: Dynamic movement animation

### Positioning Parameters
- `[style]VerticalPosition`: 0-100 (percentage from bottom)
  - **0**: Bottom of screen
  - **50**: Middle of screen
  - **100**: Top of screen

### Shadow/Glow Parameters
- `[style]ShadowStrength`: Intensity of glow/shadow effects
  - **Lower values**: Subtle effects
  - **Higher values**: Strong, dramatic effects

---

## API Usage

### Endpoint
```
POST /api/encode
```

### Request Structure
```json
{
  "url": "video_url",
  "outputName": "output_filename",
  "format": "mp4",
  "caption": {
    // Animation parameters go here
  }
}
```

### Complete Example
```json
{
  "url": "https://example.com/video.mp4",
  "outputName": "viral_video",
  "format": "mp4",
  "caption": {
    "srtContent": "1\n00:00:00,000 --> 00:00:03,000\nATTENTION ENTREPRENEURS!\n\n2\n00:00:03,000 --> 00:00:06,000\nThis will CHANGE your business!",
    "subtitleStyle": "hormozi",
    "fontFamily": "Luckiest Guy",
    "fontSize": 50,
    "hormoziColors": ["#0BF431", "#FF0000", "#0080FF", "#FFFF00"],
    "hormoziShadowStrength": 3.5,
    "hormoziAnimation": "shake",
    "verticalPosition": 15
  }
}
```

---

## Best Practices

### 1. Content Matching
- **Business/Sales** → Hormozi style
- **Lifestyle/Beauty** → Girlboss style
- **Professional** → ThinToBold or Basic
- **Entertainment** → WavyColors style

### 2. Font Selection
- **Impact content** → Luckiest Guy
- **Professional content** → Montserrat Thin
- **Standard content** → Arial

### 3. Color Choices
- High contrast for readability
- Brand-appropriate colors
- Consideration for colorblind accessibility

### 4. Positioning
- Avoid blocking important visual elements
- Consider mobile viewing (larger fonts)
- Test readability on different screen sizes

### 5. Animation Settings
- Use shake animation sparingly for emphasis
- Match shadow strength to content energy
- Consider target audience preferences

---

## Troubleshooting

### Common Issues

#### 1. Font Not Loading
- Verify font name spelling
- Check font availability in system
- Fallback fonts will be used automatically

#### 2. Colors Not Displaying
- Use HEX format (#RRGGBB)
- Verify valid color codes
- Check for proper array format for multi-colors

#### 3. Positioning Issues
- Adjust verticalPosition parameter
- Check horizontalAlignment setting
- Verify SRT timing accuracy

#### 4. Performance Issues
- Reduce shadow strength for faster processing
- Use simpler animations for long content
- Consider basic style for large subtitle files

---

## Support

For additional support or custom animation requests:
- Check the system logs for detailed error messages
- Verify all parameter formats and ranges
- Test with basic style first, then add complexity
- Ensure SRT content is properly formatted

---

## Subtitle Styles

### 1. Girlboss Animation

**Perfect for:** Beauty, lifestyle, empowerment content

#### Description
Feminine, empowering style with pink/customizable colors, smooth word-by-word reveals with glow effects.

#### Font
**Luckiest Guy** (Bold, Impact style)

#### Parameters
| Parameter | Type | Range | Default | Description |
|-----------|------|-------|---------|-------------|
| `subtitleStyle` | string | - | - | `"girlboss"` |
| `fontFamily` | string | - | - | `"Luckiest Guy"` (recommended) |
| `fontSize` | number | 10-72 | 48 | Font size in pixels |
| `girlbossColor` | string | HEX | `"#FF1493"` | Hot pink color |
| `girlbossShadowStrength` | number | 0.5-3.0 | 1.0 | Shadow intensity |
| `girlbossAnimation` | string | none/shake | `"none"` | Animation type |
| `verticalPosition` | number | 0-100 | 18 | Position from bottom (%) - UNIVERSAL |

#### Visual Effects
- Word-by-word color reveal
- Soft glow/shadow effects
- Smooth transitions
- Optional shake animation for emphasis

#### Example Usage
```json
{
  "subtitleStyle": "girlboss",
  "fontFamily": "Luckiest Guy",
  "fontSize": 48,
  "girlbossColor": "#FF1493",
  "girlbossShadowStrength": 2.0,
  "girlbossAnimation": "shake",
  "verticalPosition": 18
}
```

### 2. Hormozi Viral Animation

**Perfect for:** Business, entrepreneurship, viral content

#### Description
High-energy viral style with alternating bright colors per word. Designed for maximum attention and engagement. Inspired by Alex Hormozi's viral content style.

#### Font
**Luckiest Guy** (Bold, Impact style)

#### Parameters
| Parameter | Type | Range | Default | Description |
|-----------|------|-------|---------|-------------|
| `subtitleStyle` | string | - | - | `"hormozi"` |
| `fontFamily` | string | - | - | `"Luckiest Guy"` (recommended) |
| `fontSize` | number | 10-72 | 50 | Font size in pixels |
| `hormoziColors` | array | HEX colors | See below | Array of colors |
| `hormoziShadowStrength` | number | 1-5 | 3 | Shadow intensity |
| `hormoziAnimation` | string | none/shake | `"none"` | Animation type |
| `verticalPosition` | number | 0-100 | 15 | Position from bottom (%) - UNIVERSAL |

#### Default Color Sequence
1. **#0BF431** - Bright Green (signature Hormozi color)
2. **#2121FF** - Blue
3. **#1DE0FE** - Cyan
4. **#FFFF00** - Yellow

#### Visual Effects
- Word-by-word alternating colors
- Strong glow/shadow effects
- High contrast for maximum visibility
- Optional shake animation for viral effect

#### Example Usage
```json
{
  "subtitleStyle": "hormozi",
  "fontFamily": "Luckiest Guy",
  "fontSize": 50,
  "hormoziColors": ["#0BF431", "#FF0000", "#0080FF", "#FFFF00"],
  "hormoziShadowStrength": 3.5,
  "hormoziAnimation": "shake",
  "verticalPosition": 15
}
```

### 3. ThinToBold Animation

**Perfect for:** Professional, corporate, educational content

#### Description
Elegant, sophisticated animation that groups words in pairs with smooth reveals. Perfect for professional and refined content.

#### Font
**Montserrat Thin** (Elegant, Refined)

#### Parameters
| Parameter | Type | Range | Default | Description |
|-----------|------|-------|---------|-------------|
| `subtitleStyle` | string | - | - | `"thintobold"` |
| `fontFamily` | string | - | - | `"Montserrat Thin"` (recommended) |
| `fontSize` | number | 10-72 | 50 | Font size in pixels |
| `thinToBoldColor` | string | HEX | `"#FFFFFF"` | Text color |
| `thinToBoldShadowStrength` | number | 0.5-3.0 | 1.8 | Shadow intensity |
| `thinToBoldAnimation` | string | none/shake | `"none"` | Animation type |
| `verticalPosition` | number | 0-100 | 22 | Position from bottom (%) - UNIVERSAL |

#### Visual Effects
- Word-pair grouping (2 words at a time)
- Smooth, elegant transitions
- Minimal glow effects
- Clean, professional appearance

#### Example Usage
```json
{
  "subtitleStyle": "thintobold",
  "fontFamily": "Montserrat Thin",
  "fontSize": 50,
  "thinToBoldColor": "#FFFFFF",
  "thinToBoldShadowStrength": 1.8,
  "thinToBoldAnimation": "none",
  "verticalPosition": 22
}
```

### 4. WavyColors Animation

**Perfect for:** Entertainment, music videos, gaming content

#### Description
Dynamic rainbow color effects with wavy, flowing transitions. Creates eye-catching visual movement with character-level color cycling.

#### Font
**Luckiest Guy** (Bold, Impact style)

#### Parameters
| Parameter | Type | Range | Default | Description |
|-----------|------|-------|---------|-------------|
| `subtitleStyle` | string | - | - | `"wavycolors"` |
| `fontFamily` | string | - | - | `"Luckiest Guy"` (recommended) |
| `fontSize` | number | 10-72 | 50 | Font size in pixels |
| `wavyColorsOutlineWidth` | number | 1-5 | 3 | Outline thickness |
| `verticalPosition` | number | 0-100 | 12 | Position from bottom (%) - UNIVERSAL |

#### Built-in Color Sequence
- **Green** (#00FF00)
- **Yellow** (#FFFF00)
- **Light Blue** (#00FFFF)

#### Visual Effects
- Character-level color cycling
- Strong outline effects
- Blur and glow combinations
- Stretch effects for emphasis
- Continuous color wave motion

#### Example Usage
```json
{
  "subtitleStyle": "wavycolors",
  "fontFamily": "Luckiest Guy",
  "fontSize": 50,
  "wavyColorsOutlineWidth": 3,
  "verticalPosition": 12
}
```

### 5. Basic Animation

**Perfect for:** Standard subtitles, accessibility, professional content

#### Description
Clean, professional subtitle style without special effects. Standard subtitle appearance with full customization options.

#### Font
**Arial** (Professional, Clean)

#### Parameters
| Parameter | Type | Range | Default | Description |
|-----------|------|-------|---------|-------------|
| `subtitleStyle` | string | - | - | `"basic"` |
| `fontSize` | number | 10-72 | 48 | Font size in pixels |
| `fontColor` | string | Any color | `"white"` | Text color |
| `fontFamily` | string | Any font | `"Arial"` | Font family |
| `fontStyle` | string | regular/bold/italic | `"regular"` | Font style |
| `subtitlePosition` | string | top/middle/bottom | `"bottom"` | Vertical position |
| `horizontalAlignment` | string | left/center/right | `"center"` | Text alignment |
| `verticalPosition` | number | 10-100 | 35 | Position from bottom (%) - UNIVERSAL |
| `showBackground` | boolean | true/false | true | Show background box |
| `backgroundColor` | string | Color with opacity | `"black@0.8"` | Background color |

#### Example Usage
```json
{
  "subtitleStyle": "basic",
  "fontSize": 48,
  "fontColor": "white",
  "fontStyle": "bold",
  "subtitlePosition": "bottom",
  "horizontalAlignment": "center",
  "verticalPosition": 35,
  "showBackground": true,
  "backgroundColor": "black@0.8"
}
```

---

## Basic Settings

### Global Parameters (Available for all styles)
- `srtContent`: SRT subtitle content (required)
- `fontSize`: 10-72 pixels
- `fontFamily`: Font name (see available fonts)
- `horizontalAlignment`: "left" | "center" | "right"

### Animation Parameters
- `[style]Animation`: "none" | "shake"
  - **"none"**: Static positioning
  - **"shake"**: Dynamic movement animation

### Positioning Parameters
- `[style]VerticalPosition`: 0-100 (percentage from bottom)
  - **0**: Bottom of screen
  - **50**: Middle of screen
  - **100**: Top of screen

### Shadow/Glow Parameters
- `[style]ShadowStrength`: Intensity of glow/shadow effects
  - **Lower values**: Subtle effects
  - **Higher values**: Strong, dramatic effects

---

## Style-Specific Options

### Girlboss Animation
- `girlbossColor`: HEX color
- `girlbossShadowStrength`: Shadow intensity
- `girlbossAnimation`: Animation type
- `verticalPosition`: Position from bottom (%)

### Hormozi Viral Animation
- `hormoziColors`: Array of HEX colors
- `hormoziShadowStrength`: Shadow intensity
- `hormoziAnimation`: Animation type
- `verticalPosition`: Position from bottom (%)

### ThinToBold Animation
- `thinToBoldColor`: Text color
- `thinToBoldShadowStrength`: Shadow intensity
- `thinToBoldAnimation`: Animation type
- `verticalPosition`: Position from bottom (%)

### WavyColors Animation
- `wavyColorsOutlineWidth`: Outline thickness
- `verticalPosition`: Position from bottom (%)

### Basic Animation
- `fontColor`: Text color
- `fontFamily`: Font family
- `fontStyle`: Font style
- `subtitlePosition`: Vertical position
- `horizontalAlignment`: Text alignment
- `verticalPosition`: Position from bottom (%)
- `showBackground`: Show background box
- `backgroundColor`: Background color

---

## Word Mode Processing

The video processing API now supports **Word Mode Processing**, which allows you to control how subtitles are displayed at the word level instead of showing entire subtitle segments at once.

### Available Word Modes

#### 1. Normal Mode (Default)
- **Value**: `"normal"`
- **Description**: Traditional subtitle display - entire subtitle segments appear at once
- **Use Case**: Standard subtitle behavior

#### 2. Single Word Mode  
- **Value**: `"single"`
- **Description**: Each word appears individually with its own timing
- **Use Case**: Word-by-word emphasis, learning content, dramatic effect
- **Parameters**: 
  - `wordsPerGroup`: Set to `1` (or omit, as it's the default)

#### 3. Multiple Word Mode
- **Value**: `"multiple"`  
- **Description**: Words appear in groups of specified size
- **Use Case**: Better reading flow while maintaining word-level control
- **Parameters**:
  - `wordsPerGroup`: Number of words to display together (1-10)

### Configuration Parameters

```json
{
  "caption": {
    "srtContent": "Your SRT content here...",
    "subtitleStyle": "girlboss", // or any other style
    "wordMode": "single",        // "normal", "single", or "multiple"
    "wordsPerGroup": 2,          // Only used with "multiple" mode
    // ... other caption options
  }
}
```

### How Word Mode Works

1. **Timing Calculation**: The original subtitle timing is divided equally among the words/groups
2. **Animation Preservation**: All subtitle animations (shake, colors, etc.) are preserved for each word/group
3. **Style Compatibility**: Works with all subtitle styles (basic, girlboss, hormozi, thintobold, wavycolors)

### Example Use Cases

#### Single Word Mode for Emphasis
```json
{
  "caption": {
    "srtContent": "1\n00:00:00,000 --> 00:00:06,000\nThis is an amazing demonstration\n\n2\n00:00:06,000 --> 00:00:10,000\nEach word appears individually",
    "subtitleStyle": "girlboss",
    "wordMode": "single",
    "girlbossColor": "#FF1493",
    "girlbossAnimation": "shake"
  }
}
```
Result: "This" → "is" → "an" → "amazing" → "demonstration" (each word appears for 1 second with girlboss styling)

#### Multiple Word Mode for Better Flow
```json
{
  "caption": {
    "srtContent": "1\n00:00:00,000 --> 00:00:08,000\nThis demonstrates multiple word grouping for better reading flow",
    "subtitleStyle": "hormozi", 
    "wordMode": "multiple",
    "wordsPerGroup": 3,
    "hormoziColors": ["#00FF00", "#FF0000", "#0080FF", "#FFFF00"]
  }
}
```
Result: 
- Group 1: "This demonstrates multiple" → This(Green) demonstrates(Red) multiple(Blue)
- Group 2: "word grouping for" → word(Yellow) grouping(Green) for(Red) 
- Group 3: "better reading flow" → better(Blue) reading(Yellow) flow(Green)

**Important**: In Hormozi style, each individual word always alternates colors from the color array, regardless of whether it's in single or multiple word mode. The color sequence continues across all words globally.

### Timing Details

- **Original**: 6-second subtitle with 6 words
- **Single Mode**: Each word shows for 1 second  
- **Multiple Mode (2 words)**: Each pair shows for 2 seconds
- **Multiple Mode (3 words)**: Each group shows for 2 seconds

### Compatibility

✅ **Compatible with:**
- All subtitle styles (basic, girlboss, hormozi, thintobold, wavycolors)
- All animation options (shake, static)
- All styling options (colors, fonts, shadows, outlines)
- Basic and advanced subtitle processing

✅ **Works with formats:**
- MP4 (advanced and basic processing)
- Note: GIF and PNG don't support subtitles

### Performance Notes

- **Processing Time**: Slightly longer for word mode due to increased subtitle segments
- **File Size**: Minimal impact on output file size
- **Memory Usage**: Proportional to number of word segments created

---

## Examples

### Girlboss Animation
```json
{
  "caption": {
    "srtContent": "1\n00:00:00,000 --> 00:00:03,000\nATTENTION ENTREPRENEURS!\n\n2\n00:00:03,000 --> 00:00:06,000\nThis will CHANGE your business!",
    "subtitleStyle": "girlboss",
    "fontFamily": "Luckiest Guy",
    "fontSize": 48,
    "girlbossColor": "#FF1493",
    "girlbossShadowStrength": 2.0,
    "girlbossAnimation": "shake",
    "verticalPosition": 18
  }
}
```

### Hormozi Viral Animation
```json
{
  "caption": {
    "srtContent": "1\n00:00:00,000 --> 00:00:03,000\nATTENTION ENTREPRENEURS!\n\n2\n00:00:03,000 --> 00:00:06,000\nThis will CHANGE your business!",
    "subtitleStyle": "hormozi",
    "fontFamily": "Luckiest Guy",
    "fontSize": 50,
    "hormoziColors": ["#0BF431", "#FF0000", "#0080FF", "#FFFF00"],
    "hormoziShadowStrength": 3.5,
    "hormoziAnimation": "shake",
    "verticalPosition": 15
  }
}
```

### ThinToBold Animation
```json
{
  "caption": {
    "srtContent": "1\n00:00:00,000 --> 00:00:03,000\nATTENTION ENTREPRENEURS!\n\n2\n00:00:03,000 --> 00:00:06,000\nThis will CHANGE your business!",
    "subtitleStyle": "thintobold",
    "fontFamily": "Montserrat Thin",
    "fontSize": 50,
    "thinToBoldColor": "#FFFFFF",
    "thinToBoldShadowStrength": 1.8,
    "thinToBoldAnimation": "none",
    "verticalPosition": 22
  }
}
```

### WavyColors Animation
```json
{
  "caption": {
    "srtContent": "1\n00:00:00,000 --> 00:00:03,000\nATTENTION ENTREPRENEURS!\n\n2\n00:00:03,000 --> 00:00:06,000\nThis will CHANGE your business!",
    "subtitleStyle": "wavycolors",
    "fontFamily": "Luckiest Guy",
    "fontSize": 50,
    "wavyColorsOutlineWidth": 3,
    "verticalPosition": 12
  }
}
```

### Basic Animation
```json
{
  "caption": {
    "srtContent": "1\n00:00:00,000 --> 00:00:03,000\nATTENTION ENTREPRENEURS!\n\n2\n00:00:03,000 --> 00:00:06,000\nThis will CHANGE your business!",
    "subtitleStyle": "basic",
    "fontSize": 48,
    "fontColor": "white",
    "fontFamily": "Arial",
    "fontStyle": "bold",
    "subtitlePosition": "bottom",
    "horizontalAlignment": "center",
    "verticalPosition": 35,
    "showBackground": true,
    "backgroundColor": "black@0.8"
  }
}
```

---

## Testing

### Girlboss Animation
- **Test Case**: Verify word-by-word color reveal and glow effects
- **Expected Result**: Words should appear with smooth color transitions and glow effects

### Hormozi Viral Animation
- **Test Case**: Verify word-by-word alternating colors and glow effects
- **Expected Result**: Words should alternate between colors and glow with strong contrast

### ThinToBold Animation
- **Test Case**: Verify word-pair grouping and smooth transitions
- **Expected Result**: Words should group in pairs and transition smoothly

### WavyColors Animation
- **Test Case**: Verify character-level color cycling and outline effects
- **Expected Result**: Colors should cycle smoothly between characters and outline should be visible

### Basic Animation
- **Test Case**: Verify text appearance and background box
- **Expected Result**: Text should appear clean and background box should be visible

---

*This documentation covers all available animation styles in the Video Processing system. For updates and additional features, refer to the latest system documentation.* 