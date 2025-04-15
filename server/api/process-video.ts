import { z } from 'zod'
import ffmpeg from '../utils/ffmpeg'
import { PassThrough } from 'stream'
import archiver from 'archiver'
import { readBody } from 'h3'

// Schema for request validation
const requestSchema = z.object({
  url: z.string().url('Invalid video URL'),
  outputName: z.string().optional().default('video'),
  options: z.object({
    speedFactor: z.number().min(0.5).max(2).optional(),
    zoomFactor: z.number().min(1).max(2).optional(),
    saturationFactor: z.number().min(0.5).max(2).optional(),
    framerate: z.number().optional(),
    lightness: z.number().min(-0.5).max(0.5).optional(),
    subtitleText: z.string().optional(),
    resolution: z.string().optional(),
    audioPitch: z.number().min(0.5).max(1.5).optional(),
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
    metadata: z.record(z.string()).optional()
  }).optional().default({})
});

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
      
      const ffmpegCommand = ffmpeg(inputUrl);
      
      if (options.inputOptions?.length) {
        ffmpegCommand.inputOptions(options.inputOptions);
      }
      
      ffmpegCommand
        .inputOptions(['-protocol_whitelist', 'file,http,https,tcp,tls'])
        .outputOptions(options.outputOptions)
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

async function generateThumbnail(inputUrl: string): Promise<Buffer> {
  const positions = [1, 3, 0];  
  
  for (const position of positions) {
    try {
      const result = await processWithFFmpeg(inputUrl, {
        name: `thumbnail.png`,
        outputOptions: ['-vframes', '1', '-f', 'image2', '-vcodec', 'png'],
        inputOptions: ['-ss', position.toString()]
      });
      
      return result.buffer;
    } catch (error) {
      console.log(`Failed to generate thumbnail at position ${position}s:`, error);
    }
  }
  
  throw new Error('Failed to generate thumbnail at any position');
}

// Process video with custom filters based on provided options
function buildAdvancedProcessingOptions(options: any): string[] {
  // Return simple array of output options instead of trying to build complex filters
  const outputOptions = [];
  
  // Use basic encoding settings
  outputOptions.push('-c:v', 'libx264');
  outputOptions.push('-preset', 'ultrafast');
  outputOptions.push('-crf', '28');
  outputOptions.push('-c:a', 'aac');
  outputOptions.push('-b:a', '128k');
  
  // Simple speed filter - use separate -filter_complex option
  if (options.speedFactor) {
    const speed = Math.min(2, Math.max(0.5, options.speedFactor));
    outputOptions.push('-filter_complex', `[0:v]setpts=${1/speed}*PTS[v];[0:a]atempo=${speed}[a]`);
    outputOptions.push('-map', '[v]');
    outputOptions.push('-map', '[a]');
  }
  
  // If we're not changing speed, but want to adjust colors
  else if (options.saturationFactor || options.lightness) {
    let eq = 'eq=';
    if (options.saturationFactor) {
      eq += `saturation=${options.saturationFactor}:`;
    }
    if (options.lightness) {
      eq += `brightness=${options.lightness}:`;
    }
    // Remove trailing colon if exists
    eq = eq.endsWith(':') ? eq.slice(0, -1) : eq;
    outputOptions.push('-vf', eq);
  }
  
  // Force MPEGTS format for pipe compatibility (instead of MP4)
  outputOptions.push('-f', 'mpegts');
  
  return outputOptions;
}

export default eventHandler(async (event) => {
  try {
    const body = await readBody(event);
    
    // Validate request
    const { url, outputName, options } = requestSchema.parse(body);
    
    console.log(`Processing video from URL: ${url} with options:`, JSON.stringify(options, null, 2));
    
    const archive = archiver('zip', {
      zlib: { level: 1 }
    });
    
    archive.on('error', (err) => {
      console.error('Archive error:', err);
      event.node.res.statusCode = 500;
      event.node.res.end('Error creating archive');
    });
    
    console.log('Setting response headers...');
    setResponseHeader(event, 'Content-Type', 'application/zip');
    setResponseHeader(event, 'Content-Disposition', `attachment; filename="${outputName}-package.zip"`);
    
    console.log('Piping archive to response...');
    archive.pipe(event.node.res);
    
    const addEmptyFile = (name: string) => {
      console.log(`Adding empty file: ${name}`);
      archive.append(Buffer.from([]), { name });
    };
    
    console.log('Adding info.txt to archive...');
    archive.append(`Video URL: ${url}\nProcessed: ${new Date().toISOString()}\n`, { name: 'info.txt' });
    
    // Simplified processed video with minimal options
    try {
      // Process the video with basic options
      const processedVideo = await processWithFFmpeg(url, {
        name: 'processed.mp4',
        outputOptions: buildAdvancedProcessingOptions(options)
      });
      archive.append(processedVideo.buffer, { name: 'processed.mp4' });
      console.log(`Successfully processed MP4 with size: ${processedVideo.buffer.length} bytes`);
    } catch (error) {
      console.error('Error processing MP4:', error);
      // Fallback to create a basic MP4 without filters as backup
      try {
        console.log('Attempting fallback MP4 processing without filters...');
        const fallbackVideo = await processWithFFmpeg(url, {
          name: 'processed.mp4',
          outputOptions: [
            '-c:v', 'libx264',
            '-preset', 'ultrafast',
            '-crf', '28',
            '-c:a', 'aac',
            '-b:a', '128k',
            '-f', 'mpegts'  // Changed from mp4 to mpegts for pipe compatibility
          ]
        });
        archive.append(fallbackVideo.buffer, { name: 'processed.mp4' });
        console.log(`Created fallback MP4 with size: ${fallbackVideo.buffer.length} bytes`);
      } catch (fallbackError) {
        console.error('Fallback MP4 processing failed:', fallbackError);
        addEmptyFile('processed.mp4');
      }
    }
    
    // Process other formats
    const processings = [
      {
        name: 'preview.gif',
        inputOptions: ['-t', '3'],
        outputOptions: ['-vf', 'fps=10,scale=320:-1:flags=lanczos', '-f', 'gif']
      },
      {
        name: 'video.mkv',
        outputOptions: ['-c:v', 'copy', '-c:a', 'copy', '-f', 'matroska']
      },
      {
        name: 'video.h265.mp4',
        outputOptions: [
          '-c:v', 'libx265',
          '-preset', 'ultrafast',
          '-crf', '28',
          '-c:a', 'aac',
          '-f', 'mpegts',  // Already using mpegts, which is correct
          '-strict', 'experimental'
        ]
      }
    ];
    
    // Process each output format
    const processingPromises = processings.map(async (config) => {
      try {
        const result = await processWithFFmpeg(url, {
          name: config.name,
          outputOptions: config.outputOptions,
          inputOptions: config.inputOptions
        });
        
        archive.append(result.buffer, { name: config.name });
        return true;
      } catch (error) {
        console.error(`Error processing ${config.name}:`, error);
        addEmptyFile(config.name);
        return false;
      }
    });
    
    // Generate thumbnail
    try {
      const thumbnailBuffer = await generateThumbnail(url);
      archive.append(thumbnailBuffer, { name: 'thumbnail.png' });
    } catch (error) {
      console.error('Failed to generate thumbnail:', error);
      addEmptyFile('thumbnail.png');
    }
    
    // Wait for all processing to complete
    await Promise.all(processingPromises);
    
    // Add metadata if provided
    if (options.metadata) {
      const metadataStr = Object.entries(options.metadata)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n');
      archive.append(metadataStr, { name: 'metadata.txt' });
    }
    
    console.log('Finalizing archive...');
    await archive.finalize();
    console.log('Archive finalized successfully and sent to client');
    
  } catch (error) {
    console.error('Error processing video:', error);
    event.node.res.statusCode = 500;
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Unknown error occurred';
      
    event.node.res.end(JSON.stringify({ error: 'Failed to process video: ' + errorMessage }));
  }
}); 