import { getInitializedFfmpeg } from './ffmpeg'
import { PassThrough } from 'stream'

export function groupWordsIntoSegments(words: any[]) {
  if (!words || !words.length) return [];
  
  const segments: Array<{
    text: string;
    start: number;
    end: number;
  }> = [];
  
  let currentSegment = {
    text: '',
    start: words[0].start,
    end: 0
  };
  
  let wordCount = 0;
  
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    currentSegment.text += (currentSegment.text.length > 0 ? ' ' : '') + word.text;
    currentSegment.end = word.end;
    wordCount++;
    
    const isPunctuation = word.text.match(/[.!?,;:]$/);
    const isMaxWords = wordCount >= 10;
    const isLastWord = i === words.length - 1;
    
    if (isPunctuation || isMaxWords || isLastWord) {
      segments.push({ ...currentSegment });
      
      if (!isLastWord) {
        currentSegment = {
          text: '',
          start: words[i + 1].start,
          end: 0
        };
        wordCount = 0;
      }
    }
  }
  
  return segments;
}

export async function processVideoWithTimedSubtitles(inputUrl: string, transcript: any, options: any) {
  return new Promise(async (resolve, reject) => {
    try {
      const outputStream = new PassThrough();
      
      const segments = transcript.words ? groupWordsIntoSegments(transcript.words) : [];
      
      if (segments.length === 0) {
        if (transcript.text) {
          segments.push({
            text: transcript.text.substring(0, 200),
            start: 0,
            end: 60000 
          });
        }
      }
      
      let yPosition;
      if (options.subtitlePosition === 'top') {
        yPosition = options.verticalMargin;
      } else if (options.subtitlePosition === 'middle') {
        yPosition = "(h-th)/2";
      } else { // bottom
        yPosition = `h-th-${options.verticalMargin}`;
      }
      
      let xPosition;
      if (options.horizontalAlignment === 'left') {
        xPosition = `w*0.2`;
      } else if (options.horizontalAlignment === 'right') {
        xPosition = `w*0.8-tw`;
      } else { // center
        xPosition = "(w-tw)/2";
      }
      
      const fontSpec = options.fontFamily || 'Sans';
      let fontString = fontSpec;
      
      if (options.fontStyle !== 'regular') {
        fontString += `:style=${options.fontStyle}`;
      }
      
      const videoFilters: string[] = [];
      
      segments.forEach((segment, index) => {
        const escapedText = segment.text
          .replace(/'/g, "")
          .replace(/"/g, "")
          .replace(/\n/g, " ")
          .replace(/:/g, "\\:")
          .replace(/\\/g, "\\\\");
          
        const startTime = segment.start / 1000;
        const endTime = segment.end / 1000;
        
        const enableExpr = `between(t,${startTime},${endTime})`;
        
        const padding = Math.round((options.fontSize || 40) * 0.1);
        const boxSettings = options.showBackground 
          ? ':box=1:boxcolor=' + options.backgroundColor + `:boxborderw=${padding}` 
          : '';
        
        // Create CONSISTENT outline using shadow layers instead of borderw
        // borderw creates uneven outlines (thicker on top than sides)
        // Shadow-based outline: draw text multiple times offset in 8 directions
        const outlineWidth = options.outlineWidth || 0;
        const outlineColor = options.outlineColor || '#000000';
        
        if (outlineWidth > 0) {
          // Draw outline by rendering text 8 times in all directions
          const offsets = [
            { x: -outlineWidth, y: 0 },           // left
            { x: outlineWidth, y: 0 },            // right
            { x: 0, y: -outlineWidth },           // up
            { x: 0, y: outlineWidth },            // down
            { x: -outlineWidth, y: -outlineWidth }, // top-left
            { x: outlineWidth, y: -outlineWidth },  // top-right
            { x: -outlineWidth, y: outlineWidth },  // bottom-left
            { x: outlineWidth, y: outlineWidth }    // bottom-right
          ];
          
          // Add shadow/outline layers first (behind the main text)
          offsets.forEach(offset => {
            const offsetX = offset.x >= 0 ? `+${offset.x}` : `${offset.x}`;
            const offsetY = offset.y >= 0 ? `+${offset.y}` : `${offset.y}`;
            videoFilters.push(
              `drawtext=text='${escapedText}':font='${fontString}':fontsize=${options.fontSize}:fontcolor=${outlineColor}:x=${xPosition}${offsetX}:y=${yPosition}${offsetY}:enable='${enableExpr}'`
            );
          });
        }
        
        // Main text layer (on top of outline)
        videoFilters.push(
          `drawtext=text='${escapedText}':font='${fontString}':fontsize=${options.fontSize}:fontcolor=${options.fontColor}:x=${xPosition}:y=${yPosition}${boxSettings}:enable='${enableExpr}'`
        );
      });
      
      const command = ffmpeg(inputUrl)
        .inputOptions([
          '-protocol_whitelist', 'file,http,https,tcp,tls',
          '-reconnect', '1',
          '-reconnect_streamed', '1',
          '-reconnect_delay_max', '5'
        ]);
      
      if (videoFilters.length > 0) {
        command.videoFilters(videoFilters);
      }
      
      command.outputOptions([
        '-c:v', 'libx264',      
        '-preset', 'medium',                              // Medium for crisp text (fast causes text artifacts)
        '-crf', '18',                                     // Good quality
        '-tune', 'stillimage',                            // Optimize for sharp edges like text
        '-profile:v', 'high',                             // H.264 high profile
        '-level', '4.1',                                  // H.264 compatibility level
        '-c:a', 'copy',         
        '-map_metadata', '0',   
        '-movflags', 'frag_keyframe+empty_moov+faststart', 
        '-f', 'mp4'            
      ])
      .on('error', (err: Error) => {
        reject(new Error('Error processing video'));
      })
      .on('end', () => {
      });
      
      command.pipe(outputStream, { end: true });
      
      resolve(outputStream);
      
    } catch (error) {
      reject(error);
    }
  });
}

export async function processVideoWithSubtitlesFile(inputUrl: string, srtContent: string, options: any) {
  return new Promise(async (resolve, reject) => {
    try {
      const outputStream = new PassThrough({highWaterMark: 4 * 1024 * 1024});
      
      // Parse SRT content to get segments
      const segments = parseSRTContent(srtContent);
      
      let yPosition;
      if (options.subtitlePosition === 'top') {
        yPosition = options.verticalMargin;
      } else if (options.subtitlePosition === 'middle') {
        yPosition = "(h-th)/2";
      } else { // bottom
        yPosition = `h-th-${options.verticalMargin}`;
      }
      
      let xPosition;
      if (options.horizontalAlignment === 'left') {
        xPosition = `w*0.2`;
      } else if (options.horizontalAlignment === 'right') {
        xPosition = `w*0.8-tw`;
      } else { // center
        xPosition = "(w-tw)/2";
      }
      
      // Modify font string depending on style
      let fontString;
      if (options.fontStyle === 'bold') {
        fontString = options.fontFamily || 'Sans-Bold';
      } else if (options.fontStyle === 'italic') {
        fontString = options.fontFamily || 'Sans-Italic';
      } else {
        fontString = options.fontFamily || 'Sans';
      }
      
      const videoFilters: string[] = [];
      
      segments.forEach((segment) => {
        const escapedText = segment.text
          .replace(/'/g, "")
          .replace(/"/g, "")
          .replace(/\n/g, " ")
          .replace(/:/g, "\\:")
          .replace(/\\/g, "\\\\");
          
        const startTime = segment.start / 1000;
        const endTime = segment.end / 1000;
        
        const enableExpr = `between(t,${startTime},${endTime})`;
        
        const padding = Math.round((options.fontSize || 40) * 0.1);
        const boxSettings = options.showBackground 
          ? ':box=1:boxcolor=' + options.backgroundColor + `:boxborderw=${padding}` 
          : '';
        
        // Create CONSISTENT outline using shadow layers instead of borderw
        // borderw creates uneven outlines (thicker on top than sides)
        // Shadow-based outline: draw text multiple times offset in 8 directions
        const outlineWidth = options.outlineWidth || 0;
        const outlineColor = options.outlineColor || '#000000';
        
        if (outlineWidth > 0) {
          // Draw outline by rendering text 8 times in all directions
          const offsets = [
            { x: -outlineWidth, y: 0 },           // left
            { x: outlineWidth, y: 0 },            // right
            { x: 0, y: -outlineWidth },           // up
            { x: 0, y: outlineWidth },            // down
            { x: -outlineWidth, y: -outlineWidth }, // top-left
            { x: outlineWidth, y: -outlineWidth },  // top-right
            { x: -outlineWidth, y: outlineWidth },  // bottom-left
            { x: outlineWidth, y: outlineWidth }    // bottom-right
          ];
          
          // Add shadow/outline layers first (behind the main text)
          offsets.forEach(offset => {
            const offsetX = offset.x >= 0 ? `+${offset.x}` : `${offset.x}`;
            const offsetY = offset.y >= 0 ? `+${offset.y}` : `${offset.y}`;
            videoFilters.push(
              `drawtext=text='${escapedText}':font='${fontString}':fontsize=${options.fontSize}:fontcolor=${outlineColor}:x=${xPosition}${offsetX}:y=${yPosition}${offsetY}:enable='${enableExpr}'`
            );
          });
        }
        
        // Main text layer (on top of outline)
        videoFilters.push(
          `drawtext=text='${escapedText}':font='${fontString}':fontsize=${options.fontSize}:fontcolor=${options.fontColor}:x=${xPosition}:y=${yPosition}${boxSettings}:enable='${enableExpr}'`
        );
      });
      
      const ffmpeg = await getInitializedFfmpeg()
      const command = ffmpeg(inputUrl)
        .inputOptions([
          '-protocol_whitelist', 'file,http,https,tcp,tls',
          '-reconnect', '1',
          '-reconnect_streamed', '1',
          '-reconnect_delay_max', '5',
          '-analyzeduration', '10000000',
          '-probesize', '10000000',
          '-thread_queue_size', '512',
          '-hwaccel', 'auto'
        ]);
      
      if (videoFilters.length > 0) {
        command.videoFilters(videoFilters);
      }
      
      command.outputOptions([
        '-c:v', 'libx264',      
        '-preset', 'medium',                              // Medium for crisp text (fast causes text artifacts)
        '-crf', '18',                                     // Good quality
        '-tune', 'stillimage',                            // Optimize for sharp edges like text
        '-profile:v', 'high',                             // H.264 high profile  
        '-level', '4.1',                                  // H.264 compatibility level
        '-c:a', 'aac',
        '-b:a', '192k',                                   // Good audio quality
        '-ac', '2',                                       // Stereo audio
        '-ar', '48000',                                   // High sample rate
        '-map_metadata', '-1',   
        '-movflags', 'frag_keyframe+empty_moov+faststart', 
        '-pix_fmt', 'yuv420p',
        '-f', 'mp4'            
      ])
      .on('start', (commandLine: string) => {
        console.log('FFmpeg started with command:', commandLine);
      })
      .on('stderr', (stderrLine: string) => {
        console.log('FFmpeg stderr:', stderrLine);
      })
      .on('error', (err: Error) => {
        console.error('Error processing video with captions:', err);
        reject(new Error('Error processing video with captions: ' + err.message));
      })
      .on('end', () => {
        console.log('FFmpeg caption processing finished');
      });
      
      command.pipe(outputStream, { end: true });
      
      resolve(outputStream);
      
    } catch (error) {
      console.error('Caption processing error:', error);
      reject(error);
    }
  });
}

function parseSRTContent(srtContent: string) {
  const segments: Array<{
    text: string;
    start: number;
    end: number;
  }> = [];

  // Split by double newline to get individual subtitle entries
  const entries = srtContent.trim().split(/\n\s*\n/);
  
  for (const entry of entries) {
    const lines = entry.trim().split('\n');
    if (lines.length < 3) continue;
    
    // Parse the timing line (second line)
    const timingLine = lines[1];
    const timingMatch = timingLine.match(/(\d{2}):(\d{2}):(\d{2}),(\d{3}) --> (\d{2}):(\d{2}):(\d{2}),(\d{3})/);
    
    if (!timingMatch) continue;
    
    // Convert hours, minutes, seconds, milliseconds to milliseconds
    const startHours = parseInt(timingMatch[1], 10);
    const startMinutes = parseInt(timingMatch[2], 10);
    const startSeconds = parseInt(timingMatch[3], 10);
    const startMilliseconds = parseInt(timingMatch[4], 10);
    
    const endHours = parseInt(timingMatch[5], 10);
    const endMinutes = parseInt(timingMatch[6], 10);
    const endSeconds = parseInt(timingMatch[7], 10);
    const endMilliseconds = parseInt(timingMatch[8], 10);
    
    const startMs = (startHours * 3600 + startMinutes * 60 + startSeconds) * 1000 + startMilliseconds;
    const endMs = (endHours * 3600 + endMinutes * 60 + endSeconds) * 1000 + endMilliseconds;
    
    // Get the subtitle text (third line and beyond)
    const text = lines.slice(2).join(' ');
    
    segments.push({
      text,
      start: startMs,
      end: endMs
    });
  }
  
  return segments;
} 