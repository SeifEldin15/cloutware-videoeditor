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

// Helper function to create a clonable video stream using stream-buffers
async function createClonableVideoStream(url: string): Promise<{
  getStream: () => Readable,
  cleanup: () => void
}> {
  return new Promise((resolve, reject) => {
    const ytdlpProcess = spawn('yt-dlp', [
      url,
      '-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
      '-o', '-',
      '--no-warnings',
      '--no-check-certificates',
      '--force-overwrites',
      '--no-playlist',
    ]);

    // Handle process errors
    ytdlpProcess.on('error', (err) => {
      reject(new Error(`Failed to spawn yt-dlp: ${err.message}`));
    });

    // Log stderr for debugging
    ytdlpProcess.stderr.on('data', (data) => {
      const message = data.toString();
      if (message.includes('ERROR') || message.includes('Error')) {
        console.error(`yt-dlp error: ${message}`);
      } else {
        console.log(`yt-dlp: ${message}`);
      }
    });

    // Check if process exits with error
    ytdlpProcess.on('exit', (code) => {
      if (code !== 0 && code !== null) {
        reject(new Error(`yt-dlp exited with code ${code}`));
      }
    });

    // Create a more robust buffering and distribution system
    const dataChunks: Buffer[] = [];
    let ended = false;
    const streams: PassThrough[] = [];
    
    // Collect data from yt-dlp
    ytdlpProcess.stdout.on('data', (chunk) => {
      dataChunks.push(Buffer.from(chunk));
      // Send new data to all streams
      for (const stream of streams) {
        if (!stream.destroyed) {
          stream.write(chunk);
        }
      }
    });
    
    // Handle stream end
    ytdlpProcess.stdout.on('end', () => {
      ended = true;
      // End all streams
      for (const stream of streams) {
        if (!stream.destroyed) {
          stream.end();
        }
      }
    });

    // Function to get a new stream
    const getStream = () => {
      const newStream = new PassThrough();
      
      // For new streams, write all existing data first
      if (dataChunks.length > 0) {
        for (const chunk of dataChunks) {
          newStream.write(chunk);
        }
        
        // If download already finished, end the stream
        if (ended) {
          newStream.end();
        }
      }
      
      // Add to active streams if not ended
      if (!ended) {
        streams.push(newStream);
      }
      
      return newStream;
    };

    // Cleanup function
    const cleanup = () => {
      try {
        ytdlpProcess.kill();
        for (const stream of streams) {
          try { stream.destroy(); } catch (e) { /* ignore */ }
        }
      } catch (e) { /* ignore */ }
    };

    // Return stream factory and cleanup
    resolve({ getStream, cleanup });
  });
}

export default eventHandler(async (event) => {
  const { url } = await getValidatedQuery(event, schema.parse)
  
  try {
    const { getStream, cleanup } = await createClonableVideoStream(url);
    
    const archive = archiver('zip', {
      zlib: { level: 1 }
    });
    
    setResponseHeader(event, 'Content-Type', 'application/zip');
    setResponseHeader(event, 'Content-Disposition', 'attachment; filename="video-package.zip"');
    
    archive.pipe(event.node.res);
    
    const addEmptyFile = (name: string) => {
      try {
        archive.append(Buffer.from([]), { name });
      } catch (err) {
        console.error(`Failed to add empty file ${name}:`, err);
      }
    };
    
    const tasks: Promise<void>[] = [];
    
    tasks.push((async () => {
      console.log('Generating thumbnail...');
      try {
        const thumbnailStream = new PassThrough();
        await new Promise<void>((resolve, reject) => {
          ffmpeg(getStream())
            .seekInput('5') // Seek to 5 seconds (adjust as needed)
            .frames(1)
            .outputOptions([
              '-f', 'image2',
              '-vcodec', 'png'
            ])
            .on('start', (commandLine: string) => {
              console.log('FFmpeg started:', commandLine);
            })
            .on('error', reject)
            .pipe(thumbnailStream)
            .on('end', resolve);
        });
        archive.append(thumbnailStream, { name: 'thumbnail.png' });
      } catch (error) {
        console.error('Thumbnail processing error:', error);
        addEmptyFile('thumbnail.png');
      }
    })());
        
    // Generate GIF directly to memory
    tasks.push((async () => {
      console.log('Generating GIF...');
      try {
        const gifStream = new PassThrough();
        ffmpeg(getStream())
          .inputOptions(['-t', '3'])
          .outputOptions([
            '-vf', 'fps=10,scale=320:-1:flags=lanczos',
            '-f', 'gif'
          ])
          .on('error', (err: Error) => console.error('GIF error:', err))
          .pipe(gifStream, { end: true });
        
        archive.append(gifStream, { name: 'preview.gif' });
      } catch (error) {
        console.error('GIF processing error:', error);
        addEmptyFile('preview.gif');
      }
    })());
    
    // Generate MKV
    tasks.push((async () => {
      console.log('Processing MKV...');
      try {
        const mkvStream = new PassThrough();
        ffmpeg(getStream())
          .outputOptions([
            '-c:v', 'copy',
            '-c:a', 'copy',
            '-f', 'matroska'
          ])
          .on('error', (err: Error) => console.error('MKV error:', err))
          .pipe(mkvStream, { end: true });
        
        archive.append(mkvStream, { name: 'video.mkv' });
      } catch (error) {
        console.error('MKV processing error:', error);
        addEmptyFile('video.mkv');
      }
    })());
    
    // H.265 encoding
    tasks.push((async () => {
      console.log('Processing H.265 video...');
      try {
        const h265Stream = new PassThrough();
        ffmpeg(getStream())
          .outputOptions([
            '-c:v', 'libx265',
            '-preset', 'ultrafast',
            '-crf', '28',
            '-movflags', '+faststart',
            '-f', 'mp4',
            '-strict', 'experimental'
          ])
          .on('start', (commandLine: string) => {
            console.log('FFmpeg started:', commandLine);
          })
          .on('progress', (progress: any) => {
            console.log('H.265 Processing:', progress.percent?.toFixed(2) + '%');
          })
          .on('error', (err: Error) => {
            console.error('H.265 error:', err);
            h265Stream.end();
          })
          .pipe(h265Stream, { end: true });
        
        archive.append(h265Stream, { name: 'video.mp4' });
      } catch (error) {
        console.error('H.265 processing error:', error);
        addEmptyFile('video.mp4');
      }
    })());
    
    await Promise.all(tasks);
    await archive.finalize();
    cleanup();
    
  } catch (error) {
    console.error('Error processing video:', error);
    event.node.res.statusCode = 500;
    return { error: 'Failed to process video' };
  }
});
