const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Test ASS file generation
const testSRT = `1
00:00:01,000 --> 00:00:03,000
Hello World

2
00:00:04,000 --> 00:00:06,000
This is a test`;

const testASSContent = `[Script Info]
Title: Test Subtitles
ScriptType: v4.00+

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,50,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,1,0,0,0,100,100,0,0,1,2,0,2,10,10,10,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
Dialogue: 0,0:00:01.00,0:00:03.00,Default,,0,0,0,,Hello World
Dialogue: 0,0:00:04.00,0:00:06.00,Default,,0,0,0,,This is a test`;

function debugSubtitleIssue() {
  console.log('=== Debug Subtitle Processing Issue ===');
  
  // Create temp ASS file
  const tempAssFile = path.join(os.tmpdir(), `debug_subtitle_${Date.now()}.ass`);
  
  try {
    // Write ASS file
    fs.writeFileSync(tempAssFile, testASSContent);
    console.log(`✅ ASS file created: ${tempAssFile}`);
    console.log(`📏 ASS file size: ${fs.statSync(tempAssFile).size} bytes`);
    
    // Test if file is readable
    const content = fs.readFileSync(tempAssFile, 'utf8');
    console.log(`📖 ASS file readable: ${content.length} characters`);
    
    // Test a simple FFmpeg command with this ASS file
    const testVideoUrl = 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4';
    
    console.log('🧪 Testing FFmpeg command...');
    const escapedPath = tempAssFile.replace(/\\/g, '/').replace(/:/g, '\\:');
    
    const ffmpegCmd = `ffmpeg -i "${testVideoUrl}" -vf "subtitles='${escapedPath}'" -t 5 -f null -`;
    
    console.log(`📋 FFmpeg command: ${ffmpegCmd}`);
    
    try {
      const result = execSync(ffmpegCmd, { 
        encoding: 'utf8', 
        timeout: 30000,
        stdio: ['pipe', 'pipe', 'pipe']
      });
      console.log('✅ FFmpeg test successful');
    } catch (error) {
      console.error('❌ FFmpeg test failed:');
      console.error('STDOUT:', error.stdout || 'none');
      console.error('STDERR:', error.stderr || 'none');
      console.error('Error:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  } finally {
    // Cleanup
    if (fs.existsSync(tempAssFile)) {
      fs.unlinkSync(tempAssFile);
      console.log('🧹 Cleaned up temp file');
    }
  }
}

debugSubtitleIssue();
