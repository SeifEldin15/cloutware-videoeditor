import { z } from 'zod'
import ffmpeg from '../utils/ffmpeg'
import { PassThrough } from 'stream'
import archiver from 'archiver'
import { readMultipartFormData, readBody } from 'h3'
import fs from 'fs'

const urlSchema = z.object({
  url: z.string().url('Invalid video URL')
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
      
      outputStream.on('data', (chunk) => chunks.push(chunk));
      outputStream.on('error', reject);
      outputStream.on('end', () => resolve(Buffer.concat(chunks)));
      
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
        .on('error', (err: Error) => {
          console.error(`${options.name} FFmpeg error:`, err);
          reject(err);
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
        name: `thumbnail_attempt_${position}.png`,
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

export default eventHandler(async (event) => {
  try {
    const body = await readBody(event);
    let videoUrl: string;
    let filename: string;

    if (body.url) {
      try {
        urlSchema.parse({ url: body.url });
        videoUrl = body.url;
        filename = body.url.split('/').pop() || 'video.mp4';
      } catch (error) {
        if (error instanceof z.ZodError) {
          throw new Error(`Invalid URL: ${error.errors.map(e => e.message).join(', ')}`);
        }
        if (error instanceof Error) {
          throw new Error(`Failed to process video URL: ${error.message}`);
        }
        throw new Error('Failed to process video URL: Unknown error');
      }
    } else {
      throw new Error('URL is required');
    }
    
    console.log(`Processing video from URL: ${videoUrl}`);
    
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
    setResponseHeader(event, 'Content-Disposition', `attachment; filename="${filename}-package.zip"`);
    
    console.log('Piping archive to response...');
    archive.pipe(event.node.res);
    
    const addEmptyFile = (name: string) => {
      console.log(`Adding empty file: ${name}`);
      archive.append(Buffer.from([]), { name });
    };
    
    console.log('Adding info.txt to archive...');
    archive.append(`Video URL: ${videoUrl}\nProcessed: ${new Date().toISOString()}\n`, { name: 'info.txt' });
    
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
    
    const processingPromises = processings.map(async (config) => {
      try {
        const result = await processWithFFmpeg(videoUrl, {
          name: config.name,
          outputOptions: config.outputOptions,
          inputOptions: config.inputOptions
        });
        
        archive.append(result.buffer, { name: result.name });
        return true;
      } catch (error) {
        addEmptyFile(config.name);
        return false;
      }
    });
    
    try {
      const thumbnailBuffer = await generateThumbnail(videoUrl);
      archive.append(thumbnailBuffer, { name: 'thumbnail.png' });
    } catch (error) {
      console.error('Failed to generate thumbnail:', error);
      addEmptyFile('thumbnail.png');
    }
    
    await Promise.all(processingPromises);
    
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
