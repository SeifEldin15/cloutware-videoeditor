import { detectTextWithCoordinates } from './text-detection-coords'
import { generateSpeech } from './elevenlabs'
import { PassThrough } from 'node:stream'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'
import { getInitializedFfmpeg } from './ffmpeg'
import type { FfmpegCommand } from 'fluent-ffmpeg'

interface OcrNarrationOptions {
  numberOfFrames?: number
  confidenceThreshold?: number
  voice?: string
  timedNarration?: boolean
}

/**
 * Generate narrated video from OCR text detection
 * Returns a buffer containing the complete narrated video
 */
export async function generateOcrNarration(
  videoUrl: string,
  options: OcrNarrationOptions = {}
): Promise<Buffer> {
  const {
    numberOfFrames = 100,
    confidenceThreshold = 79,
    voice = '21m00Tcm4TlvDq8ikWAM',
    timedNarration = true
  } = options

  console.log(`[OCR-Narration] Starting text detection with ${numberOfFrames} frames at ${confidenceThreshold}% confidence`)
  
  const ocrResults = await detectTextWithCoordinates(videoUrl, {
    numberOfFrames,
    confidenceThreshold,
    language: 'eng'
  })

  // Sort detected texts by vertical position (top to bottom) within same time blocks
  const sortedTexts = ocrResults.detectedTexts.sort((a, b) => {
    const timeA = a.startTime ?? a.timestamp
    const timeB = b.startTime ?? b.timestamp
    if (Math.abs(timeA - timeB) > 0.5) return timeA - timeB
    return a.boundingBox.y - b.boundingBox.y
  })

  if (sortedTexts.length === 0) {
    throw new Error('No text could be extracted from video')
  }

  console.log(`[OCR-Narration] Found ${sortedTexts.length} text regions`)

  if (!timedNarration) {
    // Single audio narration (not implemented as buffer return - would need video merge)
    throw new Error('Non-timed narration not supported in buffer mode')
  }

  // Generate timed narration
  console.log('[OCR-Narration] Generating timed narration video...')
  const videoBuffer = await generateTimedNarrationBuffer(videoUrl, sortedTexts, voice)
  
  return videoBuffer
}

async function generateTimedNarrationBuffer(
  videoUrl: string,
  texts: any[],
  voice: string
): Promise<Buffer> {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'timed-narration-'))
  const audioFiles: Array<{ path: string, startTime: number }> = []

  try {
    // Generate audio for each text segment
    for (let i = 0; i < texts.length; i++) {
      const textObj = texts[i]
      const startTime = textObj.startTime ?? textObj.timestamp
      
      console.log(`[OCR-Narration] Generating audio ${i + 1}/${texts.length}: "${textObj.text}" at ${startTime.toFixed(2)}s`)
      
      const audioStream = await generateSpeech(textObj.text, { voiceId: voice })
      
      // Save audio to file
      const audioPath = path.join(tempDir, `audio_${i}.mp3`)
      const chunks: Buffer[] = []
      
      await new Promise<void>((resolve, reject) => {
        audioStream.on('data', (chunk) => chunks.push(chunk))
        audioStream.on('end', resolve)
        audioStream.on('error', reject)
      })
      
      await fs.writeFile(audioPath, Buffer.concat(chunks))
      audioFiles.push({ path: audioPath, startTime })
    }

    console.log(`[OCR-Narration] Generated ${audioFiles.length} audio clips, merging with video...`)

    // Create a concat file to merge all audio with proper timing
    const concatFilePath = path.join(tempDir, 'concat.txt')
    
    // Build concat list with silences for timing
    let concatContent = ''
    let currentTime = 0
    
    for (let i = 0; i < audioFiles.length; i++) {
      const audio = audioFiles[i]
      
      // Add silence to reach the start time
      if (audio.startTime > currentTime) {
        const silenceDuration = audio.startTime - currentTime
        const ffmpegGap = await getInitializedFfmpeg()
        const gapPath = path.join(tempDir, `gap_${i}.mp3`)
        
        await new Promise<void>((resolve, reject) => {
          ffmpegGap()
            .input('anullsrc=r=44100:cl=stereo')
            .inputFormat('lavfi')
            .duration(silenceDuration)
            .audioCodec('libmp3lame')
            .output(gapPath)
            .on('end', () => resolve())
            .on('error', (err: any) => reject(err))
            .run()
        })
        
        concatContent += `file '${gapPath.replace(/\\/g, '/')}'\n`
      }
      
      // Add the audio file
      concatContent += `file '${audio.path.replace(/\\/g, '/')}'\n`
      
      // Get duration of this audio file to track current time
      const probe = await getInitializedFfmpeg()
      const duration = await new Promise<number>((resolve, reject) => {
        probe.ffprobe(audio.path, (err: any, metadata: any) => {
          if (err) reject(err)
          else resolve(metadata.format.duration)
        })
      })
      
      currentTime = audio.startTime + duration
    }
    
    await fs.writeFile(concatFilePath, concatContent)
    
    // Concatenate all audio files
    const mergedAudioPath = path.join(tempDir, 'merged_audio.mp3')
    const ffmpegConcat = await getInitializedFfmpeg()
    
    console.log('[OCR-Narration] Concatenating audio clips...')
    await new Promise<void>((resolve, reject) => {
      ffmpegConcat()
        .input(concatFilePath)
        .inputOptions(['-f', 'concat', '-safe', '0'])
        .audioCodec('libmp3lame')
        .output(mergedAudioPath)
        .on('end', () => resolve())
        .on('error', (err: any) => reject(err))
        .run()
    })

    // Now merge the timed audio with the original video
    const ffmpeg = await getInitializedFfmpeg()
    const outputPath = path.join(tempDir, 'output.mp4')

    console.log('[OCR-Narration] Merging audio with video...')
    await new Promise<void>((resolve, reject) => {
      const command: FfmpegCommand = ffmpeg()
        .input(videoUrl)
        .input(mergedAudioPath)
        .outputOptions([
          '-c:v copy',
          '-c:a aac',
          '-b:a 192k',
          '-map 0:v:0',
          '-map 1:a:0'
        ])
        .output(outputPath)
        .on('start', (cmd: any) => {
          console.log('[FFmpeg] Command:', cmd)
        })
        .on('progress', (progress: any) => {
          if (progress.percent) {
            console.log(`[FFmpeg] Merging progress: ${progress.percent.toFixed(1)}%`)
          }
        })
        .on('end', () => {
          console.log('[FFmpeg] Video merge complete')
          resolve()
        })
        .on('error', (err: any, stdout: any, stderr: any) => {
          console.error('[FFmpeg] Error:', err?.message || err)
          console.error('[FFmpeg] stderr:', stderr)
          reject(new Error(`FFmpeg error: ${err?.message || err}`))
        })

      command.run()
    })

    // Read the final video buffer
    console.log('[OCR-Narration] Reading final video buffer...')
    const videoBuffer = await fs.readFile(outputPath)
    console.log(`[OCR-Narration] Buffer size: ${videoBuffer.length} bytes`)

    // Cleanup temp directory
    await fs.rm(tempDir, { recursive: true, force: true })

    return videoBuffer
  } catch (error) {
    // Cleanup on error
    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {})
    throw error
  }
}
