# 🔤 Font System Documentation

## 📁 Font Directory Structure

All fonts are located in `public/fonts/` and include:

### Available Fonts:
- **Arial** (`arial.ttf`) - Clean, professional
- **Arial Black** (`Arial Black.ttf`) - Bold variant
- **Montserrat** (`Montserrat.ttf`) - Modern sans-serif
- **Montserrat Thin** (`Montserrat Thin.ttf`) - Elegant thin weight
- **Montserrat ExtraBold** (`Montserrat ExtraBold.ttf`) - Heavy weight
- **Montserrat Black** (`Montserrat Black.ttf`) - Maximum weight
- **Luckiest Guy** (`luckiestguy.ttf`) - Fun, bold display font
- **Impact** (`impact.ttf`) - Strong, condensed
- **Times New Roman** (`TimesNewRoman.ttf`) - Classic serif
- **Georgia** (`georgia.ttf`) - Readable serif
- **Helvetica** (`helvetica.ttf`) - Swiss classic
- **Verdana** (`Verdana.ttf`) - Web-optimized
- **Trebuchet** (`Trebuchet.ttf`) - Humanist sans-serif
- **Comic Sans MS** (`Comic Sans MS.ttf`) - Casual, friendly
- **Courier New** (`Courier New.ttf`) - Monospace
- **Garamond** (`Garamond.ttf`) - Elegant serif
- **Palatino Linotype** (`Palatino Linotype.ttf`) - Humanist serif
- **Bookman Old Style** (`Bookman Old Style.ttf`) - Traditional serif
- **Erica One** (`Erica One.ttf`) - Display font
- **Bungee** (`bungee.ttf`) - Modern display
- **Sigmar** (`sigmar.ttf`) - Decorative
- **Sora** (`sora.ttf`) - Geometric sans-serif
- **Tahoma** (`tahoma.ttf`) - Humanist sans-serif
- **Gotham Ultra** (`Gotham Ultra.ttf`) - Geometric bold
- **Bodoni Moda** (`Bodoni Moda.ttf`) - High-contrast serif

## 🎭 Style-to-Font Mappings

### Animation Styles with Font Assignments:

#### **Montserrat Thin Font Family**
- `alternatingBoldThinAnimation` → **Montserrat Thin**
- `ThinToBold` / `thintobold` → **Montserrat Thin**

*Perfect for elegant, sophisticated typography animations*

#### **Luckiest Guy Font Family** 
- `HormoziViralSentence2` → **Luckiest Guy**
- `PewDiePie` → **Luckiest Guy**
- `Enlarge` → **Luckiest Guy**
- `WormEffect` → **Luckiest Guy**
- `quickfox4` → **Luckiest Guy**
- `HormoziViralSentence4` → **Luckiest Guy**
- `ShrinkingPairs` → **Luckiest Guy**
- `Wavycolors` / `wavycolors` → **Luckiest Guy**
- `quickfox` → **Luckiest Guy**
- `Girlboss` / `girlboss` → **Luckiest Guy**
- `GreenToRedPair` → **Luckiest Guy**
- `hormoziViral` / `hormozi` → **Luckiest Guy**
- `quickfox5` → **Luckiest Guy**
- `RevealEnlarge` → **Luckiest Guy**
- `TrendingAli` → **Luckiest Guy**
- `HormoziViralSentence` → **Luckiest Guy**
- `weakGlitch` → **Luckiest Guy**
- `HormoziViralWord` → **Luckiest Guy**
- `SimpleDisplay` → **Luckiest Guy**
- `none` → **Luckiest Guy**

*Perfect for fun, energetic, attention-grabbing content*

#### **Arial Font Family**
- `basic` → **Arial**

*Professional, clean, universal readability*

## 🚀 Usage Examples

### In API Requests

The font assignment happens automatically based on the subtitle style:

```json
{
  "caption": {
    "subtitleStyle": "girlboss",    // Will use "Luckiest Guy"
    "srtContent": "Your subtitles...",
    // Other options...
  }
}
```

```json
{
  "caption": {
    "subtitleStyle": "thintobold",  // Will use "Montserrat Thin"
    "srtContent": "Your subtitles...",
    // Other options...
  }
}
```

### Override Font (Optional)

You can still override the font if needed:

```json
{
  "caption": {
    "subtitleStyle": "girlboss",
    "fontFamily": "Impact",         // Override with Impact
    "srtContent": "Your subtitles...",
    // Other options...
  }
}
```

## 🎬 Testing the Font System

### Run All Styles with Fonts
```bash
# Windows (Git Bash)
& "C:\Program Files\Git\bin\bash.exe" ./test-all-features.sh

# Linux/Mac
./test-all-features.sh
```

### Test Individual Styles
```bash
# Test Girlboss with Luckiest Guy font
& "C:\Program Files\Git\bin\bash.exe" ./test-single-style.sh girlboss

# Test ThinToBold with Montserrat Thin font
& "C:\Program Files\Git\bin\bash.exe" ./test-single-style.sh thintobold

# Test Hormozi with Luckiest Guy font
& "C:\Program Files\Git\bin\bash.exe" ./test-single-style.sh hormozi

# Test WavyColors with Luckiest Guy font
& "C:\Program Files\Git\bin\bash.exe" ./test-single-style.sh wavycolors

# Test Basic with Arial font
& "C:\Program Files\Git\bin\bash.exe" ./test-single-style.sh basic
```

## 🔧 Technical Implementation

### Font Loading Process

1. **Font Mapping**: Each subtitle style is mapped to a specific font in `subtitleUtils.ts`
2. **Font Path Resolution**: Fonts are loaded from `public/fonts/` directory
3. **FFmpeg Integration**: Font directory is passed to FFmpeg for subtitle rendering
4. **ASS File Generation**: Subtitle files are generated with proper font references

### Font Path Structure

```
public/
└── fonts/
    ├── arial.ttf
    ├── luckiestguy.ttf
    ├── Montserrat Thin.ttf
    ├── Montserrat.ttf
    └── ... (other fonts)
```

### Code Integration

The font system is integrated at multiple levels:

1. **`subtitleUtils.ts`**: Font mapping and ASS file generation
2. **`subtitle-processor.ts`**: Font path resolution and FFmpeg integration
3. **Test Scripts**: Demonstrate font usage per style

## 💡 Font Selection Rationale

### **Luckiest Guy** - Viral Content Styles
- Bold, attention-grabbing
- Great for social media content
- High impact, fun personality
- Perfect for: Girlboss, Hormozi, WavyColors styles

### **Montserrat Thin** - Elegant Typography
- Modern, sophisticated
- Excellent for transitions
- Professional yet stylish
- Perfect for: ThinToBold animations

### **Arial** - Professional Default
- Universal compatibility
- Clean, readable
- Neutral personality
- Perfect for: Basic, professional content

## 🎯 Style Characteristics

| Style | Font | Character | Use Case |
|-------|------|-----------|----------|
| **Girlboss** | Luckiest Guy | Bold, Feminine, Energetic | Empowerment content |
| **Hormozi** | Luckiest Guy | Attention-grabbing, Viral | Marketing content |
| **ThinToBold** | Montserrat Thin | Elegant, Sophisticated | Professional presentations |
| **WavyColors** | Luckiest Guy | Fun, Psychedelic | Creative content |
| **Basic** | Arial | Clean, Professional | Standard subtitles |

## 🚀 Next Steps

1. **Test All Styles**: Run the test scripts to see fonts in action
2. **Custom Fonts**: Add more fonts to `public/fonts/` as needed
3. **Font Variants**: Use different weights (Bold, Light, etc.) for variety
4. **Performance**: Monitor rendering performance with different fonts

---

🎬 **Your video processing now has professional font support for every style!** 