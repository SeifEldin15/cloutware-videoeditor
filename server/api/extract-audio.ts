import { readBody } from 'h3'
import { z } from 'zod'
import { getInitializedFfmpeg } from '~/server/utils/ffmpeg'
import { writeFileSync, unlinkSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'

const requestSchema = z.object({
  videoFile: z.any(), // File object
  videoUrl: z.string().url().optional()
});

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    
    // For now, we'll handle video URLs since file upload needs more complex handling
    if (!body.videoUrl && !body.videoFile) {
      throw new Error('Either videoUrl or videoFile is required');
    }

    const ffmpeg = await getInitializedFfmpeg();
    
    // Create temp directory for audio extraction
    const tempDir = join(process.cwd(), 'temp_audio');
    if (!existsSync(tempDir)) {
      mkdirSync(tempDir, { recursive: true });
    }

    const timestamp = Date.now();
    const audioFileName = `extracted_audio_${timestamp}.wav`;
    const audioPath = join(tempDir, audioFileName);

    return new Promise((resolve, reject) => {
      let inputSource = body.videoUrl;
      
      // If it's a file upload, we'd need to save it first
      // For now, we'll focus on URL-based extraction
      
      ffmpeg(inputSource)
        .output(audioPath)
        .audioCodec('pcm_s16le') // Uncompressed WAV for better transcription
        .audioFrequency(16000)   // 16kHz sample rate (optimal for speech recognition)
        .audioChannels(1)        // Mono audio
        .format('wav')
        .on('start', (commandLine: string) => {
          console.log('🎵 Extracting audio with command:', commandLine);
        })
        .on('progress', (progress: any) => {
          console.log(`⏳ Audio extraction progress: ${progress.percent?.toFixed(1) || 0}%`);
        })
        .on('end', () => {
          console.log('✅ Audio extraction completed');
          
          // Return the audio file path/URL for transcription
          resolve({
            success: true,
            audioUrl: `file://${audioPath}`,
            audioPath: audioPath,
            audioFileName: audioFileName,
            message: 'Audio extracted successfully'
          });
        })
        .on('error', (err: any, stdout: any, stderr: any) => {
          console.error('❌ Audio extraction error:', err.message);
          console.error('FFmpeg stderr:', stderr);
          
          // Clean up on error
          if (existsSync(audioPath)) {
            try {
              unlinkSync(audioPath);
            } catch (cleanupErr) {
              console.error('Failed to cleanup audio file:', cleanupErr);
            }
          }
          
          reject(new Error(`Audio extraction failed: ${err.message}`));
        })
        .run();
    });

  } catch (error) {
    console.error('Audio extraction API error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    throw createError({
      statusCode: 400,
      statusMessage: `Failed to extract audio: ${errorMessage}`
    });
  }
});