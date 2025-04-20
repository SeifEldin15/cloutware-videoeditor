import { z } from 'zod'
import ffmpeg from '../utils/ffmpeg'
import { PassThrough } from 'stream'
import { readBody, setResponseHeader } from 'h3'

const requestSchema = z.object({
  url: z.string().url('Invalid video URL'),
  outputName: z.string().optional().default('video'),
  format: z.enum(['mp4', 'gif', 'h265', 'png', 'mkv']).optional().default('h265'),
  options: z.object({
    speedFactor: z.number().min(0.5).max(2).optional(),
    zoomFactor: z.number().min(1).max(2).optional(),
    saturationFactor: z.number().min(0.5).max(2).optional(),
    framerate: z.number().optional(),
    lightness: z.number().min(-0.5).max(0.5).optional(),
    subtitleText: z.string().optional(),
    resolution: z.string().optional(),
    audioPitch: z.number().min(0.5).max(1.5).optional(),
    backgroundAudio: z.boolean().optional().default(false),
    backgroundAudioVolume: z.number().min(0.05).max(0.5).optional().default(0.2),
    smartCrop: z.object({
      percentage: z.number().min(0.1).max(2).optional(),
      direction: z.enum(['center', 'top', 'bottom', 'left', 'right', 'random']).optional()
    }).optional(),
    temporalModification: z.object({
      dropFrames: z.number().min(0).max(10).optional(),
      duplicateFrames: z.number().min(0).max(10).optional(),
      reverseSegments: z.boolean().optional()
    }).optional(),
    audioTempoMod: z.object({
      tempoFactor: z.number().min(0.8).max(1.2).optional(),
      preservePitch: z.boolean().optional()
    }).optional(),
    syncShift: z.number().min(-500).max(500).optional(),
    eqAdjustments: z.object({
      low: z.number().min(-5).max(5).optional(),
      mid: z.number().min(-5).max(5).optional(),
      high: z.number().min(-5).max(5).optional()
    }).optional(),
    reverbEffect: z.object({
      level: z.number().min(0.05).max(0.2).optional(),
      delay: z.number().min(20).max(100).optional()
    }).optional(),
    backgroundAddition: z.object({
      type: z.enum(['room', 'crowd', 'nature', 'white_noise']).optional(),
      level: z.number().min(0.01).max(0.1).optional()
    }).optional(),
    metadata: z.record(z.string()).optional(),
    visibleChanges: z.object({
      horizontalFlip: z.boolean().optional().default(false),
      border: z.boolean().optional().default(false),
      timestamp: z.boolean().optional().default(false)
    }).optional().default({}),
    antiDetection: z.object({
      pixelShift: z.boolean().optional().default(true),
      microCrop: z.boolean().optional().default(true),
      subtleRotation: z.boolean().optional().default(true),
      noiseAddition: z.boolean().optional().default(true),
      metadataPoisoning: z.boolean().optional().default(true),
      frameInterpolation: z.boolean().optional().default(true)
    }).optional().default({})
  }).optional().default({})
});

type VideoProcessingOptions = z.infer<typeof requestSchema>['options'];

async function processWithFFmpeg(
  inputUrl: string, 
  options: {
    outputOptions: string[],
    name: string,
    inputOptions?: string[]
  }
): Promise<{ buffer: Buffer, name: string }> {
  console.log(`Processing ${options.name}...`);
  try {
    const buffer = await new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      const outputStream = new PassThrough();
      let commandOutput = '';
      
      outputStream.on('data', (chunk) => chunks.push(chunk));
      outputStream.on('error', (err) => {
        console.error(`${options.name} stream error:`, err);
        reject(new Error(`Stream error: ${err.message}\nCommand output: ${commandOutput}`));
      });
      outputStream.on('end', () => {
        const buffer = Buffer.concat(chunks);
        console.log(`${options.name} stream ended with ${buffer.length} bytes`);
        if (buffer.length === 0) {
          reject(new Error(`Zero bytes returned. Command output: ${commandOutput}`));
        } else {
          resolve(buffer);
        }
      });
      
      let ffmpegCommand = ffmpeg(inputUrl);
      
      if (options.inputOptions?.length) {
        ffmpegCommand.inputOptions(options.inputOptions);
      }
      
      const inputs: string[] = [];
      const cleanedOutputOptions: string[] = [];
      
      for (let i = 0; i < options.outputOptions.length; i++) {
        if (options.outputOptions[i] === '-i' && i + 1 < options.outputOptions.length) {
          inputs.push(options.outputOptions[i + 1]);
          i++; 
        } else {
          cleanedOutputOptions.push(options.outputOptions[i]);
        }
      }
      
      inputs.forEach(input => {
        ffmpegCommand = ffmpegCommand.input(input);
      });
      
      ffmpegCommand
        .inputOptions(['-protocol_whitelist', 'file,http,https,tcp,tls'])
        .outputOptions(cleanedOutputOptions)
        .on('start', (commandLine: string) => {
          console.log(`${options.name} FFmpeg started:`, commandLine);
        })
        .on('progress', (progress: any) => {
          if (progress.percent) {
            console.log(`${options.name} Processing: ${progress.percent.toFixed(2)}%`);
          }
        })
        .on('stderr', (stderrLine: string) => {
          commandOutput += stderrLine + '\n';
          if (stderrLine.includes('Error')) {
            console.error(`${options.name} FFmpeg stderr:`, stderrLine);
          }
        })
        .on('error', (err: Error) => {
          console.error(`${options.name} FFmpeg error:`, err);
          console.error(`${options.name} Command output:`, commandOutput);
          reject(new Error(`FFmpeg error: ${err.message}\nCommand output: ${commandOutput}`));
        })
        .on('end', () => {
          console.log(`${options.name} FFmpeg process ended`);
        })
        .pipe(outputStream, { end: true });
    });
    
    console.log(`${options.name} generated: ${buffer.length} bytes`);
    return { buffer, name: options.name };
  } catch (error) {
    console.error(`${options.name} processing error:`, error);
    throw error;
  }
}


function buildAdvancedProcessingOptions(options: VideoProcessingOptions): string[] {
  const outputOptions = [];
  const timestamp = new Date().getTime().toString();
  
  //  METADATA STRIPPING AND POISONING
  outputOptions.push('-map_metadata', '-1');
  outputOptions.push('-fflags', '+bitexact'); 
  
  //  random metadata 
  const randomTime = new Date(Math.floor(Math.random() * 1000000000000)).toISOString();
  outputOptions.push('-metadata', `title=processed_${timestamp}`);
  outputOptions.push('-metadata', `comment=modified_${timestamp.slice(-6)}`);
  outputOptions.push('-metadata', `creation_time=${randomTime}`);
  outputOptions.push('-metadata', `encoder=custom_${timestamp.slice(-4)}`);
  
  if (options.backgroundAudio) {
    outputOptions.push('-i', 'audio.mp3');
  }
  
  // VIDEO FILTERS 
  const videoFilter = [
    'crop=in_w-20:in_h-20:10:10',
    'scale=708:1260',
    'hue=h=5:s=1.05',
    'eq=gamma=1.1:contrast=1.1:brightness=0.05',
    'setpts=0.92*PTS',
    'rotate=0.5*PI/180:bilinear=0',
    'pad=iw+4:ih+4:2:2:black@0.8',
    
    // zoom effect (+2%)
    'scale=iw*1.02:ih*1.02,crop=iw/1.02:ih/1.04',
    
    // HSL lightness adjustment (+3%)
    'eq=brightness=0.03:saturation=1.06',
    
    // Random pixel shift (1-2px)
    'crop=in_w-2:in_h-2:1:1',

    // random noise (very subtle)
    'noise=alls=1:allf=t'
  ].join(',');
  
  // Apply video filters
  outputOptions.push('-vf', videoFilter);
  
  //  AUDIO FILTERS
  let audioFilter = [
    'volume=0.8',
    'atempo=1.09',
    
    // subtle EQ adjustments
    'equalizer=f=250:t=q:width=100:g=-2',  // Reduce around 250Hz
    'equalizer=f=12000:t=q:width=2000:g=1' // Slight boost in highs
  ].join(',');
  
  if (options.backgroundAudio) {
    const afIndex = outputOptions.indexOf('-af');
    if (afIndex !== -1) {
      outputOptions.splice(afIndex, 2);
    }
    
    const bgVolume = options.backgroundAudioVolume || 0.2;
    
    outputOptions.push('-filter_complex', 
      `[0:a]${audioFilter}[a0]; [1:a]volume=${bgVolume},aloop=loop=-1:size=2048[a1]; [a0][a1]amix=inputs=2:duration=first[aout]`);
    
    outputOptions.push('-map', '0:v', '-map', '[aout]');
  } else {
    outputOptions.push('-af', audioFilter);
  }
  
  // CODEC MIXING & ADVANCED SETTINGS
  outputOptions.push('-c:v', 'libx264');
  outputOptions.push('-preset', 'ultrafast');
  outputOptions.push('-crf', '24');
  outputOptions.push('-pix_fmt', 'yuv420p'); // Explicit pixel format
  
  // Change frame rate slightly
  outputOptions.push('-r', '29.97');
  
  // Standard audio codec and settings
  outputOptions.push('-c:a', 'aac');
  outputOptions.push('-b:a', '124k'); // Slightly different bitrate
  
  outputOptions.push('-movflags', 'isml+frag_keyframe+faststart');
  outputOptions.push('-tune', 'zerolatency');
  outputOptions.push('-f', 'mp4');
  
  return outputOptions;
}

function getOutputOptionsForFormat(format: string, options: VideoProcessingOptions): { 
  outputOptions: string[],
  inputOptions?: string[],
  contentType: string,
  fileExtension: string
} {
  switch (format) {
    case 'gif':
      return {
        inputOptions: ['-t', '3'],
        outputOptions: ['-vf', 'fps=10,scale=320:-1:flags=lanczos', '-f', 'gif'],
        contentType: 'image/gif',
        fileExtension: 'gif'
      };
    case 'h265':
      const h265Options = buildAdvancedProcessingOptions(options);
      
      const codecIndex = h265Options.indexOf('-c:v');
      if (codecIndex !== -1 && codecIndex + 1 < h265Options.length) {
        h265Options[codecIndex + 1] = 'libx265';
      }
      
      h265Options.push('-tag:v', 'hvc1', '-strict', 'experimental');
      
      return {
        outputOptions: h265Options,
        contentType: 'video/mp4',
        fileExtension: 'mp4'
      };
    case 'mkv':
      const mkvOptions = buildAdvancedProcessingOptions(options);
      
      const formatIndex = mkvOptions.indexOf('-f');
      if (formatIndex !== -1 && formatIndex + 1 < mkvOptions.length) {
        mkvOptions[formatIndex + 1] = 'matroska';
      } else {
        mkvOptions.push('-f', 'matroska');
      }
      
      const removeOptions = ['-movflags'];
      for (const opt of removeOptions) {
        const idx = mkvOptions.indexOf(opt);
        if (idx !== -1 && idx + 1 < mkvOptions.length) {
          mkvOptions.splice(idx, 2);
        }
      }
      
      return {
        outputOptions: mkvOptions,
        contentType: 'video/x-matroska',
        fileExtension: 'mkv'
      };
    case 'png':
      return {
        inputOptions: ['-ss', '1'],
        outputOptions: ['-vframes', '1', '-f', 'image2', '-vcodec', 'png'],
        contentType: 'image/png',
        fileExtension: 'png'
      };
    case 'mp4':
    default:
      return {
        outputOptions: buildAdvancedProcessingOptions(options),
        contentType: 'video/mp4',
        fileExtension: 'mp4'
      };
  }
}

export default eventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const query = getQuery(event);
    
    const formatFromQuery = typeof query.format === 'string' ? query.format : undefined;
    
    const requestData = { ...body, format: formatFromQuery || body.format };
    const { url, outputName, format, options } = requestSchema.parse(requestData);
    
    console.log(`Processing video from URL: ${url} with format: ${format} and options:`, JSON.stringify(options, null, 2));
    
    const outputConfig = getOutputOptionsForFormat(format, options);
    
    try {
      const result = await processWithFFmpeg(url, {
        name: `${outputName}.${outputConfig.fileExtension}`,
        outputOptions: outputConfig.outputOptions,
        inputOptions: outputConfig.inputOptions
      });
      
      console.log(`Successfully processed ${format} with size: ${result.buffer.length} bytes`);
      
      setResponseHeader(event, 'Content-Type', outputConfig.contentType);
      setResponseHeader(event, 'Content-Disposition', `attachment; filename="${outputName}.${outputConfig.fileExtension}"`);
      
      return result.buffer;
      
    } catch (error) {
      console.error(`Error processing ${format}:`, error);
      throw error;
    }
    
  } catch (error) {
    console.error('Error processing video:', error);
    event.node.res.statusCode = 500;
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Unknown error occurred';
      
    return { error: 'Failed to process video: ' + errorMessage };
  }
}); 