import ffmpeg from './ffmpeg'
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
  return new Promise((resolve, reject) => {
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
      
      const videoFilters = segments.map((segment, index) => {
        const escapedText = segment.text
          .replace(/'/g, "")
          .replace(/"/g, "")
          .replace(/\n/g, " ")
          .replace(/:/g, "\\:")
          .replace(/\\/g, "\\\\");
          
        const startTime = segment.start / 1000;
        const endTime = segment.end / 1000;
        
        const enableExpr = `between(t,${startTime},${endTime})`;
        
        const boxSettings = options.showBackground 
          ? ':box=1:boxcolor=' + options.backgroundColor + ':boxborderw=5' 
          : '';
        
        return `drawtext=text='${escapedText}':font='${fontString}':fontsize=${options.fontSize}:fontcolor=${options.fontColor}:x=${xPosition}:y=${yPosition}${boxSettings}:enable='${enableExpr}'`;
      });
      
      const command = ffmpeg(inputUrl, { timeout: 240 })
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
        '-preset', 'ultrafast', 
        '-crf', '18',           
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