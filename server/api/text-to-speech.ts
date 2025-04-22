import { z } from 'zod'
import { readBody, setResponseHeader } from 'h3'
import ffmpeg from '../utils/ffmpeg'
import { PassThrough } from 'stream'

const requestSchema = z.object({
  videoUrl: z.string().url('Invalid video URL'),
  text: z.string().min(1, 'Text is required'),
  outputName: z.string().regex(/^[a-zA-Z0-9_-]+$/, 'Output name can only contain letters, numbers, underscores and hyphens').optional().default('voiceover_video'),
  voice: z.string().optional().default('21m00Tcm4TlvDq8ikWAM'), // Default Voice ID for ElevenLabs (Rachel)
  speed: z.number().min(0.5).max(2.0).optional().default(1.0)
});

if (!process.env.ELEVENLABS_API_KEY) {
  throw new Error('ELEVENLABS_API_KEY environment variable is not set');
}

const apiKey = process.env.ELEVENLABS_API_KEY;

async function generateSpeech(text: string, voice: string, speed: number) {
  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'xi-api-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: text,
        model_id: "eleven_monolingual_v1",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5,
          style: 0.0,
          speed: speed
        }
      })
    });

    if (!response.ok) {
      let errorMessage = `ElevenLabs API error: Status ${response.status}`;
      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const error = await response.json();
          errorMessage = `ElevenLabs API error: ${error.detail || error.message || JSON.stringify(error)}`;
        } else {
          const text = await response.text();
          errorMessage = `ElevenLabs API error: ${text}`;
        }
      } catch (e) {
        errorMessage = `ElevenLabs API error: ${response.statusText || 'Unknown error'}`;
      }
      throw new Error(errorMessage);
    }

    if (!response.body) {
      throw new Error('Response body is null');
    }
    return response.body;
  } catch (error) {
    throw error;
  }
}

async function combineVideoWithAudio(videoUrl: string, audioStream: ReadableStream<Uint8Array>) {
  return new Promise((resolve, reject) => {
    try {
      const outputStream = new PassThrough();
      
      const command = ffmpeg(videoUrl, { timeout: 240 })
        .inputOptions([
          '-protocol_whitelist', 'file,http,https,tcp,tls',
          '-reconnect', '1',
          '-reconnect_streamed', '1',
          '-reconnect_delay_max', '5'
        ]);
      
      const audioNodeStream = new PassThrough();
      
      command.input(audioNodeStream)
        .inputFormat('mp3')
        .outputOptions([
          '-c:v', 'copy',
          '-c:a', 'aac',
          '-map', '0:v',
          '-map', '1:a',
          '-shortest',
          '-movflags', 'frag_keyframe+empty_moov+faststart',
          '-f', 'mp4'
        ])
        .on('error', (err: Error) => {
          reject(new Error('Error processing video: ' + err.message));
        });
      
      command.pipe(outputStream, { end: true });
      
      const reader = audioStream.getReader();
      const pump = () => {
        reader.read().then(({ done, value }) => {
          if (done) {
            audioNodeStream.end();
            return;
          }
          audioNodeStream.write(value);
          pump();
        }).catch(err => {
          audioNodeStream.end();
          reject(err);
        });
      };
      
      pump();
      
      resolve(outputStream);
    } catch (error) {
      reject(error);
    }
  });
}

export default eventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { videoUrl, text, outputName, voice, speed } = requestSchema.parse(body);
    
    try {
      const headResponse = await fetch(videoUrl, { method: 'HEAD' });
      if (!headResponse.ok) {
        throw new Error(`Video URL not accessible`);
      }
    } catch (error: any) {
      throw new Error(`Cannot access video URL`);
    }
    
    console.log(`Generating speech for text: "${text.substring(0, 50)}..."`);
    const audioStream = await generateSpeech(text, voice, speed);
    
    console.log('Combining video with generated speech');
    const videoStream = await combineVideoWithAudio(videoUrl, audioStream);
    
    setResponseHeader(event, 'Content-Type', 'video/mp4');
    setResponseHeader(event, 'Content-Disposition', `attachment; filename="${outputName}.mp4"`);
    
    return videoStream;
    
  } catch (error) {
    console.error('Error in text-to-speech:', error);
    event.node.res.statusCode = 500;
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Unknown error occurred';
      
    return { error: 'Failed to add voiceover to video: ' + errorMessage };
  }
}); 