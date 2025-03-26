import { z } from 'zod'
import ffmpeg from '../utils/ffmpeg'
import { Readable, PassThrough } from 'stream'

import archiver from 'archiver'
import { spawn } from 'child_process'
import { pipeline } from 'stream'
import { promisify } from 'util'



const pipelineAsync = promisify(pipeline)

const schema = z.object({
  url: z.string().url()
})

async function createClonableVideoStream(url: string): Promise<{
  getStream: () => Readable,
  cleanup: () => void
}> {
  return new Promise((resolve, reject) => {
    const isTikTok = url.includes('tiktok.com');
    const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');
    
    const ytdlpArgs = [
      url,
      '-o', '-',
      '--no-warnings',
      '--no-check-certificates',
      '--force-overwrites',
      '--no-playlist',
      '-f', 'best[height<=1080]'
    ];
    
    console.log(`Starting yt-dlp with args: ${ytdlpArgs.join(' ')}`);
    const ytdlpProcess = spawn('yt-dlp', ytdlpArgs);

    ytdlpProcess.on('error', (err) => {
      reject(new Error(`Failed to spawn yt-dlp: ${err.message}`));
    });

    let hasError = false;

    ytdlpProcess.stderr.on('data', (data) => {
      const message = data.toString();
      if (message.includes('ERROR') || message.includes('Error')) {
        console.error(`yt-dlp error: ${message}`);
        hasError = true;
        
        if (isTikTok && message.includes('Unable to extract webpage video data')) {
          reject(new Error('Cannot process this TikTok video - yt-dlp needs to be updated. Try updating yt-dlp with: yt-dlp -U'));
        }
      } else {
        console.log(`yt-dlp: ${message}`);
      }
    });

    ytdlpProcess.on('exit', (code) => {
      if ((code !== 0 && code !== null) || hasError) {
        reject(new Error(`yt-dlp exited with code ${code}. This video may be unavailable or the service may be unsupported.`));
      }
    });

    if (isYouTube) {
      const dataChunks: Buffer[] = [];
      let ended = false;
      
      ytdlpProcess.stdout.on('data', (chunk) => {
        dataChunks.push(Buffer.from(chunk));
      });
      
      ytdlpProcess.stdout.on('end', () => {
        ended = true;
        console.log(`YouTube download complete, received ${dataChunks.length} chunks`);
      });

      const getStream = () => {
        const newStream = new PassThrough();
        
        if (dataChunks.length > 0) {
          console.log(`Sending ${dataChunks.length} chunks to stream`);
          for (const chunk of dataChunks) {
            newStream.write(chunk);
          }
          
          if (ended) {
            console.log('Download already complete, ending stream');
            newStream.end();
          }
        } else if (ended) {
          console.log('WARNING: Download ended but no data chunks available');
          newStream.end();
        }
        
        return newStream;
      };

      const cleanup = () => {
        try {
          ytdlpProcess.kill();
        } catch (e) { /* ignore */ }
      };

      resolve({ getStream, cleanup });
    } else {
      const dataChunks: Buffer[] = [];
      let ended = false;
      const streams: PassThrough[] = [];
      
      const noDataTimeout = setTimeout(() => {
        if (dataChunks.length === 0 && !ended) {
          reject(new Error('No data received from yt-dlp after 30 seconds'));
          try { ytdlpProcess.kill(); } catch (e) { /* ignore */ }
        }
      }, 30000);
      
      ytdlpProcess.stdout.on('data', (chunk) => {
        dataChunks.push(Buffer.from(chunk));
        for (const stream of streams) {
          if (!stream.destroyed) {
            stream.write(chunk);
          }
        }
      });
      
      ytdlpProcess.stdout.on('end', () => {
        clearTimeout(noDataTimeout);
        ended = true;
        console.log(`Download complete, received ${dataChunks.length} chunks`);
        
        if (dataChunks.length === 0 && !hasError) {
          reject(new Error('yt-dlp completed but no video data was received'));
          return;
        }
        
        for (const stream of streams) {
          if (!stream.destroyed) {
            stream.end();
          }
        }
      });

      const getStream = () => {
        const newStream = new PassThrough();
        
        if (dataChunks.length > 0) {
          console.log(`Sending ${dataChunks.length} chunks to stream`);
          for (const chunk of dataChunks) {
            newStream.write(chunk);
          }
          
          if (ended) {
            console.log('Download already complete, ending stream');
            newStream.end();
          }
        }
        
        if (!ended) {
          streams.push(newStream);
        }
        
        return newStream;
      };

      const cleanup = () => {
        clearTimeout(noDataTimeout);
        try {
          ytdlpProcess.kill();
          for (const stream of streams) {
            try { stream.destroy(); } catch (e) { /* ignore */ }
          }
        } catch (e) { /* ignore */ }
      };

      resolve({ getStream, cleanup });
    }
  });
}

export default eventHandler(async (event) => {
  const { url } = await getValidatedQuery(event, schema.parse)
  
  try {
    console.log(`Processing video URL: ${url}`);
    const { getStream, cleanup } = await createClonableVideoStream(url);
    
    const archive = archiver('zip', {
      zlib: { level: 1 }
    });
    
    archive.on('error', (err) => {
      console.error('Archive error:', err);
      event.node.res.statusCode = 500;
      event.node.res.end('Error creating archive');
      cleanup();
    });
    
    archive.on('progress', (progress) => {
      console.log(`Archive progress: ${progress.entries.processed}/${progress.entries.total} entries, ${progress.fs.processedBytes} bytes`);
    });
    
    console.log('Setting response headers...');
    setResponseHeader(event, 'Content-Type', 'application/zip');
    setResponseHeader(event, 'Content-Disposition', 'attachment; filename="video-package.zip"');
    
    console.log('Piping archive to response...');
    archive.pipe(event.node.res);
    
    const addEmptyFile = (name: string) => {
      try {
        console.log(`Adding empty file: ${name}`);
        archive.append(Buffer.from([]), { name });
      } catch (err) {
        console.error(`Failed to add empty file ${name}:`, err);
      }
    };
    
    console.log('Adding info.txt to archive...');
    archive.append(`Video URL: ${url}\nProcessed: ${new Date().toISOString()}\n`, { name: 'info.txt' });
    
    console.log('Generating thumbnail...');
    try {
      const thumbnailBuffer = await new Promise<Buffer>((resolve, reject) => {
        const chunks: Buffer[] = [];
        const thumbnailStream = new PassThrough();
        
        thumbnailStream.on('data', (chunk) => chunks.push(chunk));
        thumbnailStream.on('error', reject);
        thumbnailStream.on('end', () => resolve(Buffer.concat(chunks)));
        
        const ffmpegProcess = ffmpeg(getStream())
          .seekInput('5') 
          .frames(1)
          .outputOptions([
            '-f', 'image2',
            '-vcodec', 'png'
          ])
          .on('start', (commandLine: any) => {
            console.log('Thumbnail FFmpeg started:', commandLine);
          })
          .on('error', (err: Error) => {
            console.error('Thumbnail FFmpeg error:', err);
            reject(err);
          });
        
        const timeout = setTimeout(() => {
          console.error('Thumbnail process timed out after 60 seconds');
          reject(new Error('Thumbnail process timed out'));
        }, 60000);
        
        ffmpegProcess.pipe(thumbnailStream);
        
        thumbnailStream.on('end', () => {
          clearTimeout(timeout);
        });
      });
      
      console.log(`Thumbnail generated: ${thumbnailBuffer.length} bytes`);
      archive.append(thumbnailBuffer, { name: 'thumbnail.png' });
    } catch (error) {
      console.error('Thumbnail processing error:', error);
      addEmptyFile('thumbnail.png');
    }
    
    console.log('Generating GIF...');
    try {
      const gifBuffer = await new Promise<Buffer>((resolve, reject) => {
        const chunks: Buffer[] = [];
        const gifStream = new PassThrough();
        
        gifStream.on('data', (chunk) => chunks.push(chunk));
        gifStream.on('error', reject);
        gifStream.on('end', () => resolve(Buffer.concat(chunks)));
        
        const ffmpegProcess = ffmpeg(getStream())
          .inputOptions(['-t', '3'])
          .outputOptions([
            '-vf', 'fps=10,scale=320:-1:flags=lanczos',
            '-f', 'gif'
          ])
          .on('start', (commandLine: string) => {
            console.log('GIF FFmpeg started:', commandLine);
          })
          .on('error', (err: Error) => {
            console.error('GIF FFmpeg error:', err);
            reject(err);
          });
        
        const timeout = setTimeout(() => {
          console.error('GIF process timed out after 60 seconds');
          reject(new Error('GIF process timed out'));
        }, 60000);
        
        ffmpegProcess.pipe(gifStream);
        
        gifStream.on('end', () => {
          clearTimeout(timeout);
        });
      });
      
      console.log(`GIF generated: ${gifBuffer.length} bytes`);
      archive.append(gifBuffer, { name: 'preview.gif' });
    } catch (error) {
      console.error('GIF processing error:', error);
      addEmptyFile('preview.gif');
    }
    
    console.log('Processing MKV...');
    try {
      const mkvBuffer = await new Promise<Buffer>((resolve, reject) => {
        const chunks: Buffer[] = [];
        const mkvStream = new PassThrough();
        
        mkvStream.on('data', (chunk) => chunks.push(chunk));
        mkvStream.on('error', reject);
        mkvStream.on('end', () => resolve(Buffer.concat(chunks)));
        
        ffmpeg(getStream())
          .outputOptions([
            '-c:v', 'copy',
            '-c:a', 'copy',
            '-f', 'matroska'
          ])
          .on('error', (err: Error) => {
            console.error('MKV error:', err);
            reject(err);
          })
          .pipe(mkvStream);
      });
      
      console.log(`MKV generated: ${mkvBuffer.length} bytes`);
      archive.append(mkvBuffer, { name: 'video.mkv' });
    } catch (error) {
      console.error('MKV processing error:', error);
      addEmptyFile('video.mkv');
    }
    
    console.log('Processing H.265 video...');
    try {
      const h265Buffer = await new Promise<Buffer>((resolve, reject) => {
        const chunks: Buffer[] = [];
        const h265Stream = new PassThrough();
        
        h265Stream.on('data', (chunk) => chunks.push(chunk));
        h265Stream.on('error', reject);
        h265Stream.on('end', () => resolve(Buffer.concat(chunks)));
        
        ffmpeg(getStream())
          .outputOptions([
            '-c:v', 'libx265',
            '-preset', 'ultrafast',
            '-crf', '28',
            '-c:a', 'aac',
            '-f', 'mpegts',    
            '-strict', 'experimental'
          ])
          .on('start', (commandLine: string) => {
            console.log('FFmpeg started:', commandLine);
          })
          .on('progress', (progress: any) => {
            let progressInfo = '';
            if (progress.percent) {
              progressInfo = `${progress.percent.toFixed(2)}%`;
            } else if (progress.frames) {
              progressInfo = `${progress.frames} frames`;
            } else if (progress.timemark) {
              progressInfo = `at ${progress.timemark}`;
            }
            console.log(`H.265 Processing: ${progressInfo}`);
          })
          .on('stderr', (stderrLine: string) => {
            console.log('FFmpeg stderr:', stderrLine);
          })
          .on('error', (err: Error) => {
            console.error('H.265 error:', err);
            console.error('Error details:', (err as any).message, (err as any).stderr || 'No stderr output');
            reject(err);
          })
          .pipe(h265Stream);
      });
      
      console.log(`H.265 video generated: ${h265Buffer.length} bytes`);
      archive.append(h265Buffer, { name: 'video.h265.mp4' }); 
    } catch (error) {
      console.error('H.265 processing error:', error);
      addEmptyFile('video.h265.mp4');
    }
    
    console.log('Finalizing archive...');
    await archive.finalize();
    console.log('Archive finalized successfully and sent to client');
    cleanup();
    
  } catch (error) {
    console.error('Error processing video:', error);
    event.node.res.statusCode = 500;
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Unknown error occurred';
      
    event.node.res.end(JSON.stringify({ error: 'Failed to process video: ' + errorMessage }));
    return;
  }
});
