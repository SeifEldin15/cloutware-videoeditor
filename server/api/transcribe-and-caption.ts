import { z } from 'zod'
import { readBody, setResponseHeader } from 'h3'
import ffmpeg from '../utils/ffmpeg'
import { PassThrough } from 'stream'

const requestSchema = z.object({
  url: z.string().url('Invalid video URL'),
  outputName: z.string().optional().default('captioned_video'),
  language: z.string().optional().default('en'),
  fontSize: z.number().optional().default(24),
  fontColor: z.string().optional().default('white'),
  subtitlePosition: z.string().optional().default('bottom'),
  horizontalAlignment: z.enum(['left', 'center', 'right']).optional().default('center'),
  verticalMargin: z.number().optional().default(50),
  showBackground: z.boolean().optional().default(true)
});

if (!process.env.ASSEMBLYAI_API_KEY) {
  throw new Error('ASSEMBLYAI_API_KEY environment variable is not set');
}

const apiKey = process.env.ASSEMBLYAI_API_KEY;

async function transcribeVideo(url: string, language: string) {
  try {
    const response = await fetch('https://api.assemblyai.com/v2/transcript', {
      method: 'POST',
      headers: {
        'Authorization': apiKey,
        'Content-Type': 'application/json'
      } as HeadersInit,
      body: JSON.stringify({
        audio_url: url
      })
    });
    
    const responseText = await response.text();
    let responseData;
    
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      throw new Error(`Invalid JSON response from AssemblyAI`);
    }

    if (!response.ok) {
      throw new Error(`AssemblyAI API error`);
    }

    const transcriptId = responseData.id;
    if (!transcriptId) {
      throw new Error(`AssemblyAI did not return a transcript ID`);
    }

    while (true) {
      const statusResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
        headers: {
          'Authorization': apiKey
        } as HeadersInit
      });
      
      const statusText = await statusResponse.text();
      let statusData;
      
      try {
        statusData = JSON.parse(statusText);
      } catch (e) {
        throw new Error(`Invalid JSON from status check`);
      }

      if (!statusResponse.ok) {
        throw new Error(`AssemblyAI status check error`);
      }
      
      if (statusData.status === 'completed') {
        return statusData;
      } else if (statusData.status === 'error') {
        throw new Error(`Transcription failed`);
      }

      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  } catch (error) {
    throw error;
  }
}

function groupWordsIntoSegments(words: any[]) {
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

async function processVideoWithTimedSubtitles(inputUrl: string, transcript: any, options: any) {
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
          ? ':box=1:boxcolor=black@0.5:boxborderw=5' 
          : '';
        
        return `drawtext=text='${escapedText}':fontsize=${options.fontSize}:fontcolor=${options.fontColor}:x=${xPosition}:y=${yPosition}${boxSettings}:enable='${enableExpr}'`;
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

export default eventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { url, outputName, language, fontSize, fontColor, subtitlePosition, horizontalAlignment, verticalMargin, showBackground } = requestSchema.parse(body);
    
    try {
      const headResponse = await fetch(url, { method: 'HEAD' });
      if (!headResponse.ok) {
        throw new Error(`Video URL not accessible`);
      }
    } catch (error: any) {
      throw new Error(`Cannot access video URL`);
    }
    
    const transcript = await transcribeVideo(url, language);
    const videoStream = await processVideoWithTimedSubtitles(url, transcript, {
      fontSize,
      fontColor,
      subtitlePosition,
      horizontalAlignment,
      verticalMargin,
      showBackground
    });
    
    setResponseHeader(event, 'Content-Type', 'video/mp4');
    setResponseHeader(event, 'Content-Disposition', `attachment; filename="${outputName}.mp4"`);
    
    return videoStream;
    
  } catch (error) {
    event.node.res.statusCode = 500;
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Unknown error occurred';
      
    return { error: 'Failed to process video: ' + errorMessage };
  }
}); 