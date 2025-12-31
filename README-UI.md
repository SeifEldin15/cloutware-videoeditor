# 🎬 Cloutware Video Editor UI

A beautiful, user-friendly web interface for the Cloutware Video Processing API.

## ✨ Features

### 🎯 Simple & Intuitive
- **Video URL Input**: Paste any video URL (direct links, cloud storage, etc.)
- **SRT Subtitle Editor**: Built-in textarea with format guidance
- **Template Selector**: Visual grid of all available templates with descriptions
- **Output Naming**: Custom filename with validation
- **One-Click Processing**: Simple form submission

### 🎨 Available Templates
- **💅 Girlboss**: Bold, energetic style with shake animation and pink colors
- **🔥 Hormozi**: High-energy multi-color style for attention-grabbing content
- **🎵 TikTok Style**: Single vibrant color style perfect for social media
- **✨ Thin to Bold**: Elegant style with smooth transitions
- **🌈 Wavy Colors**: Rainbow-colored text with wavy animations
- **🎯 Shrinking Pairs**: Dynamic shrinking effect for word groups
- **🌟 Reveal & Enlarge**: Color-cycling text with reveal effects
- **📋 Basic**: Clean and professional style for business content

### 🛡️ Anti-Detection Features
When enabled, applies multiple techniques to help content bypass automated detection:
- **Pixel Shifting**: Subtle pixel displacement
- **Micro Cropping**: Small cropping adjustments
- **Subtle Rotation**: Minor rotation (~0.25°)
- **Noise Addition**: Film grain effect
- **Metadata Poisoning**: Random metadata injection
- **Frame Interpolation**: Smart frame blending

## 🚀 Getting Started

### Prerequisites
- Node.js 22.0.0 or higher
- PNPM package manager
- FFmpeg installed on system

### Installation
```bash
# Install dependencies
pnpm install

# Start development server
pnpm run dev
```

### Usage

1. **Start the Server**
   ```bash
   pnpm run dev
   ```
   Open http://localhost:3000 in your browser

2. **Paste Video URL**
   - Enter any publicly accessible video URL
   - Supports MP4, MOV, AVI, MKV formats

3. **Add Subtitles**
   - Write your subtitles in SRT format:
   ```
   1
   00:00:00,000 --> 00:00:03,000
   Your awesome content here!
   
   2
   00:00:03,000 --> 00:00:06,000
   This will be amazing!
   ```

4. **Choose Template**
   - Click on any template card to select it
   - Preview shows emoji, name, and description

5. **Configure Options**
   - Enter output filename (letters, numbers, hyphens, underscores only)
   - Toggle anti-detection features if needed

6. **Process Video**
   - Click "Create Amazing Video"
   - Wait for processing to complete
   - Video will automatically download

## 🎯 Example Usage

### Basic Template Processing
```javascript
// The UI sends this request to the API:
{
  "url": "https://example.com/video.mp4",
  "srtContent": "1\n00:00:00,000 --> 00:00:03,000\nHello World!",
  "templateName": "girlboss",
  "outputName": "my_video"
}
```

### With Anti-Detection
```javascript
// When anti-detection is enabled:
{
  "url": "https://example.com/video.mp4",
  "srtContent": "1\n00:00:00,000 --> 00:00:03,000\nHello World!",
  "templateName": "girlboss",
  "outputName": "my_video",
  "options": {
    "antiDetection": {
      "pixelShift": true,
      "microCrop": true,
      "subtleRotation": true,
      "noiseAddition": true,
      "metadataPoisoning": true,
      "frameInterpolation": true
    }
  }
}
```

## 🎨 UI Features

### Responsive Design
- Works perfectly on desktop, tablet, and mobile
- Grid layout adapts to screen size
- Touch-friendly interface

### Visual Feedback
- Loading states with animated spinner
- Success/error messages with auto-dismiss
- Form validation with helpful hints
- Hover effects and smooth transitions

### User Experience
- Pre-filled example SRT content
- Input validation and error handling
- Auto-download of processed videos
- Clear status messages throughout process

## 🛠️ Technical Details

### Built With
- **Nuxt 3**: Vue.js framework for server-side rendering
- **Tailwind CSS**: Utility-first CSS framework
- **Vue 3**: Reactive JavaScript framework
- **TypeScript**: Type-safe JavaScript

### API Integration
- Automatic template loading from `/api/encode-template`
- Real-time processing with `/api/encode-template` POST
- Blob handling for video downloads
- Error handling with user-friendly messages

### Form Validation
- URL format validation
- SRT content requirement
- Filename pattern validation (alphanumeric + underscore/hyphen)
- Template selection requirement

## 🎥 Workflow

1. **Template Loading**: UI fetches available templates on load
2. **Form Validation**: Real-time validation of user inputs
3. **API Request**: Sends POST request to `/api/encode-template`
4. **Processing**: Server processes video with selected template
5. **Download**: Completed video automatically downloads
6. **Feedback**: Success/error messages keep user informed

## 📱 Mobile Support

The UI is fully responsive and works great on mobile devices:
- Template grid adapts to smaller screens (2 columns on mobile, 4 on desktop)
- Touch-friendly buttons and inputs
- Optimized text sizes and spacing
- Smooth scrolling and interactions

## 🎯 Production Deployment

For production use:

```bash
# Build for production
pnpm run build

# Start production server
pnpm run start
```

The UI will be available at your configured domain/port with all features working seamlessly.

## 🔧 Customization

### Adding New Templates
Templates are automatically loaded from the API. To add new templates:
1. Add template configuration to `server/utils/style-templates.ts`
2. Add corresponding emoji to the `templateEmojis` object in `app.vue`
3. Template will appear automatically in the UI

### Styling
- Modify `assets/css/main.css` for global styles
- Update `app.vue` template for layout changes
- Tailwind classes can be customized in component

### Features
- Additional form fields can be added to the reactive `form` object
- New API options can be included in the `processVideo` method
- Custom validation rules can be added to form inputs

## 🎬 Perfect for Content Creators

This UI makes video processing accessible to everyone:
- **No technical knowledge required**
- **Visual template selection**
- **Instant results**
- **Professional quality output**
- **Anti-detection features for social media**

Start creating amazing videos with just a few clicks! 🚀