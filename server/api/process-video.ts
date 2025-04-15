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
      
      // Handle multiple inputs in outputOptions
      const inputs: string[] = [];
      const cleanedOutputOptions: string[] = [];
      
      for (let i = 0; i < options.outputOptions.length; i++) {
        if (options.outputOptions[i] === '-i' && i + 1 < options.outputOptions.length) {
          inputs.push(options.outputOptions[i + 1]);
          i++; // Skip the next item which is the input path
        } else {
          cleanedOutputOptions.push(options.outputOptions[i]);
        }
      }
      
      // Add all additional inputs
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

function buildAdvancedProcessingOptions(options: any): string[] {
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
  
  // VIDEO FILTERS 
  const videoFilter = [
    'crop=in_w-20:in_h-20:10:10',
    'scale=708:1260',
    'hue=h=20:s=1.2',
    'eq=gamma=1.1:contrast=1.1:brightness=0.05',
    'setpts=0.92*PTS',
    'rotate=0.5*PI/180:bilinear=0',
    'pad=iw+4:ih+4:2:2:black@0.8',
    
    // zoom effect (+2%)
    'scale=iw*1.02:ih*1.02,crop=iw/1.02:ih/1.02',
    
    // HSL lightness adjustment (+3%)
    'eq=brightness=0.03:saturation=1.03',
    
    // Random pixel shift (1-2px)
    'crop=in_w-2:in_h-2:1:1',

    // random noise (very subtle)
    'noise=alls=1:allf=t'
  ].join(',');
  
  // Apply video filters
  outputOptions.push('-vf', videoFilter);
  
  //  AUDIO FILTERS
  const audioFilter = [
    'volume=0.8',
    'atempo=1.08',
    
    // subtle EQ adjustments
    'equalizer=f=250:t=q:width=100:g=-2',  // Reduce around 250Hz
    'equalizer=f=12000:t=q:width=2000:g=1' // Slight boost in highs
  ].join(',');
  
  // Apply audio filters
  outputOptions.push('-af', audioFilter);
  
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
  
  // Force MPEGTS format
  outputOptions.push('-f', 'mpegts');
  
  return outputOptions;
}

// Fallback 
function buildMinimalFallbackOptions(options: any = {}): string[] {
  const timestamp = new Date().getTime().toString();
  const randomTime = new Date(Math.floor(Math.random() * 1000000000000)).toISOString();
  
  return [
    //  metadata removal
    '-map_metadata', '-1',
    '-fflags', '+bitexact',
    '-metadata', `title=processed_${timestamp}`,
    '-metadata', `artist=modified_${timestamp}`,
    '-metadata', `creation_time=${randomTime}`,
    
    // Unified  video filters
    '-vf', `crop=in_w-20:in_h-20:10:10,scale=708:1260,hue=h=20:s=1.2,eq=brightness=0.03:saturation=1.03`,
    
    // Encoding settings
    '-c:v', 'libx264',
    '-preset', 'ultrafast', 
    '-crf', '24',
    '-pix_fmt', 'yuv420p',
    '-r', '29.97',
    
    //  audio settings with EQ
    '-c:a', 'aac',
    '-b:a', '124k',
    '-af', 'volume=0.8,atempo=1.08,equalizer=f=250:t=q:width=100:g=-2',
    
    '-f', 'mpegts'
  ];
}

// add high frequency audio  processed video
async function addHighFrequencyAudio(processedVideoBuffer: Buffer, originalUrl: string): Promise<Buffer> {
  console.log('Adding high frequency audio to processed video...');
  
  try {
    // stream from the processed video buffer
    const { Readable } = require('stream');
    const videoStream = new Readable();
    videoStream.push(processedVideoBuffer);
    videoStream.push(null);
    
    return new Promise<Buffer>((resolve, reject) => {
      const outputBuffers: Buffer[] = [];
      
      const outputStream = new PassThrough();
      outputStream.on('data', (chunk) => outputBuffers.push(chunk));
      outputStream.on('end', () => {
        const finalBuffer = Buffer.concat(outputBuffers);
        resolve(finalBuffer);
      });
      
      ffmpeg(videoStream)
        .input('audio.mp3')
        .outputOptions([
          '-c:v', 'copy',  
          '-filter_complex', '[0:a][1:a]amix=inputs=2:duration=first:weights=0.9 0.1[a]',
          '-map', '0:v',
          '-map', '[a]',
          '-c:a', 'aac',
          '-b:a', '128k'
        ])
        .format('mp4')
        .on('error', (err) => {
          console.error('Error adding high frequency audio:', err);
          resolve(processedVideoBuffer);
        })
        .pipe(outputStream, { end: true });
    });
  } catch (error) {
    console.error('Error in high frequency audio processing:', error);
    return processedVideoBuffer;
  }
}

export default eventHandler(async (event) => {
  try {
    const body = await readBody(event);
    
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
    
    try {
      console.log('Processing with simplified filters');
      const processedVideo = await processWithFFmpeg(url, {
        name: 'processed.mp4',
        outputOptions: buildAdvancedProcessingOptions(options)
      });
      
      archive.append(processedVideo.buffer, { name: 'processed.mp4' });
      console.log(`Successfully processed MP4 with size: ${processedVideo.buffer.length} bytes`);
      
    } catch (error) {
      console.error('Error processing MP4:', error);
      try {
        console.log('Attempting absolute minimal fallback');
        const fallbackVideo = await processWithFFmpeg(url, {
          name: 'processed.mp4',
          outputOptions: buildMinimalFallbackOptions(options)
        });
        archive.append(fallbackVideo.buffer, { name: 'processed.mp4' });
        console.log(`Created fallback MP4 with size: ${fallbackVideo.buffer.length} bytes`);
      } catch (fallbackError) {
        console.error('Fallback MP4 processing failed:', fallbackError);
        addEmptyFile('processed.mp4');
      }
    }
    
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
          '-f', 'mpegts',  
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