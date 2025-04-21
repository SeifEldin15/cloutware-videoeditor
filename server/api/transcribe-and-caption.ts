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
  verticalMargin: z.number().optional().default(50) 
});

if (!process.env.ASSEMBLYAI_API_KEY) {
  throw new Error('ASSEMBLYAI_API_KEY environment variable is not set');
}

const apiKey = process.env.ASSEMBLYAI_API_KEY;

async function transcribeVideo(url: string, language: string) {
  console.log(`Transcribing video from URL: ${url}`);

  const response = await fetch('https://api.assemblyai.com/v2/transcript', {
    method: 'POST',
    headers: {
      'Authorization': apiKey,
      'Content-Type': 'application/json'
    } as HeadersInit,
    body: JSON.stringify({
      audio_url: url,
      language_code: language,
      speaker_labels: false,
      punctuate: true,
      format_text: true
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`AssemblyAI API error: ${error.message || 'Unknown error'}`);
  }

  const transcriptionRequest = await response.json();
  const transcriptId = transcriptionRequest.id;

  while (true) {
    const statusResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
      headers: {
        'Authorization': apiKey
      } as HeadersInit
    });

    if (!statusResponse.ok) {
      const error = await statusResponse.json();
      throw new Error(`AssemblyAI API error: ${error.message || 'Unknown error'}`);
    }

    const transcript = await statusResponse.json();

    if (transcript.status === 'completed') {
      return transcript;
    } else if (transcript.status === 'error') {
      throw new Error(`Transcription failed: ${transcript.error}`);
    }

    await new Promise(resolve => setTimeout(resolve, 3000));
  }
}

async function processVideoWithSimpleSubtitle(inputUrl: string, transcript: any, options: any) {
  return new Promise((resolve, reject) => {
    try {
      const outputStream = new PassThrough();
      
      let subtitleText = '';
      if (transcript.text) {
        subtitleText = transcript.text.substring(0, 200)
          .replace(/'/g, "")
          .replace(/"/g, "")
          .replace(/\n/g, " ")
          .replace(/:/g, "\\:")
          .replace(/\\/g, "\\\\");
      }
      
      let yPosition;
      if (options.subtitlePosition === 'top') {
        yPosition = options.verticalMargin;
      } else if (options.subtitlePosition === 'middle') {
        yPosition = "(h-th)/2";
      } else { 
        yPosition = `h-th-${options.verticalMargin}`;
      }
      
      let xPosition;
      if (options.horizontalAlignment === 'left') {
        xPosition = options.verticalMargin; 
      } else if (options.horizontalAlignment === 'right') {
        xPosition = `w-tw-${options.verticalMargin}`;
      } else { 
        xPosition = "(w-tw)/2";
      }
      
      console.log(`Setting subtitle position - x: ${xPosition}, y: ${yPosition}`);
      
      const command = ffmpeg(inputUrl, { timeout: 180 })
        .inputOptions([
          '-protocol_whitelist', 'file,http,https,tcp,tls',
          '-reconnect', '1',
          '-reconnect_streamed', '1',
          '-reconnect_delay_max', '5'
        ]);
      
      if (subtitleText) {
        command.videoFilters([
          `drawtext=text='${subtitleText}':fontsize=${options.fontSize}:fontcolor=${options.fontColor}:x=${xPosition}:y=${yPosition}:box=1:boxcolor=black@0.5:boxborderw=5`
        ]);
      }
      
      command.outputOptions([
        '-c:v', 'libx264',
        '-preset', 'ultrafast',
        '-crf', '28',
        '-c:a', 'aac',
        '-b:a', '128k',
        '-f', 'mpegts', 
        '-tune', 'zerolatency' 
      ])
      .on('start', (commandLine: string) => {
        console.log('FFmpeg started:', commandLine);
      })
      .on('stderr', (stderrLine: string) => {
        console.log('FFmpeg stderr:', stderrLine);
      })
      .on('error', (err: Error) => {
        console.error('FFmpeg error:', err);
        reject(err);
      })
      .on('end', () => {
        console.log('FFmpeg processing finished');
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
    const { url, outputName, language, fontSize, fontColor, subtitlePosition, horizontalAlignment, verticalMargin } = requestSchema.parse(body);
    
    console.log('Step 1: Transcribing video...');
    const transcript = await transcribeVideo(url, language);
    
    console.log('Step 2: Processing video with basic subtitle...');
    const videoStream = await processVideoWithSimpleSubtitle(url, transcript, {
      fontSize,
      fontColor,
      subtitlePosition,
      horizontalAlignment,
      verticalMargin
    });
    
    setResponseHeader(event, 'Content-Type', 'video/MP2T');
    setResponseHeader(event, 'Content-Disposition', `attachment; filename="${outputName}.ts"`);
    
    return videoStream;
    
  } catch (error) {
    console.error('Error processing video with transcription:', error);
    event.node.res.statusCode = 500;
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Unknown error occurred';
      
    return { error: 'Failed to process video with transcription: ' + errorMessage };
  }
}); 