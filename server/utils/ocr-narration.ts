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
  backgroundMusicUrl?: string
  backgroundMusicVolume?: number
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
    timedNarration = true,
    backgroundMusicUrl,
    backgroundMusicVolume = 0.2
  } = options

  console.log(`[OCR-Narration] Starting text detection with ${numberOfFrames} frames at ${confidenceThreshold}% confidence`)
  console.log(`[OCR-Narration] Background music URL: ${backgroundMusicUrl || '(none)'}`)
  console.log(`[OCR-Narration] Background music volume: ${backgroundMusicVolume}`)
  
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
    console.warn('[OCR-Narration] ⚠️ No text could be extracted from video. Skipping narration.')
    return Buffer.alloc(0)
  }

  console.log(`[OCR-Narration] Found ${sortedTexts.length} text regions before dedup`)

  // Deduplicate: remove sentences that are identical or near-identical (>= 80% similar)
  // to a sentence already in the narration list (regardless of time position).
  // This prevents the same on-screen phrase from being narrated multiple times.
  const normalize = (t: string) => t.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim()
  const similarity = (a: string, b: string): number => {
    if (a === b) return 1
    const longer = a.length > b.length ? a : b
    const shorter = a.length > b.length ? b : a
    if (longer.length === 0) return 1
    const dp: number[][] = Array.from({ length: shorter.length + 1 }, (_, i) => [i])
    for (let j = 0; j <= longer.length; j++) dp[0][j] = j
    for (let i = 1; i <= shorter.length; i++) {
      for (let j = 1; j <= longer.length; j++) {
        dp[i][j] = shorter[i - 1] === longer[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1])
      }
    }
    return (longer.length - dp[shorter.length][longer.length]) / longer.length
  }

  const SIMILARITY_THRESHOLD = 0.80
  const seenNormalized: string[] = []
  const dedupedTexts = sortedTexts.filter(textObj => {
    const norm = normalize(textObj.text)
    if (!norm) return false
    const isDuplicate = seenNormalized.some(seen => similarity(norm, seen) >= SIMILARITY_THRESHOLD)
    if (isDuplicate) {
      console.log(`[OCR-Narration] 🚫 Skipping duplicate sentence: "${textObj.text}"`)
      return false
    }
    seenNormalized.push(norm)
    return true
  })

  console.log(`[OCR-Narration] ${dedupedTexts.length} unique text regions after dedup (removed ${sortedTexts.length - dedupedTexts.length} duplicates)`)

  if (!timedNarration) {
    // Single audio narration (not implemented as buffer return - would need video merge)
    throw new Error('Non-timed narration not supported in buffer mode')
  }

  // Generate timed narration
  console.log('[OCR-Narration] Generating timed narration video...')
  const videoBuffer = await generateTimedNarrationBuffer(videoUrl, dedupedTexts, voice, backgroundMusicUrl, backgroundMusicVolume)
  
  return videoBuffer
}

async function generateTimedNarrationBuffer(
  videoUrl: string,
  texts: any[],
  voice: string,
  backgroundMusicUrl?: string,
  backgroundMusicVolume: number = 0.2
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
    const outputPath = path.join(tempDir, 'output.mp4')

    // Download background music if provided
    let bgMusicLocalPath: string | null = null

    if (backgroundMusicUrl) {
      console.log(`[OCR-Narration] Downloading background music from ${backgroundMusicUrl}`)
      try {
        const musicResponse = await fetch(backgroundMusicUrl)
        if (musicResponse.ok) {
          const musicBuffer = Buffer.from(await musicResponse.arrayBuffer())
          bgMusicLocalPath = path.join(tempDir, `bg_music.mp3`)
          await fs.writeFile(bgMusicLocalPath, musicBuffer)
          console.log(`[OCR-Narration] ✅ Background music saved: ${bgMusicLocalPath} (${musicBuffer.length} bytes)`)
        } else {
          console.error(`[OCR-Narration] ❌ Failed to download background music: HTTP ${musicResponse.status}`)
        }
      } catch (err) {
        console.error(`[OCR-Narration] ❌ Background music download error:`, err)
      }
    } else {
      console.log(`[OCR-Narration] No background music URL provided, skipping music mix`)
    }

    // Merge narration (and optionally bg music) with the original video
    console.log('[OCR-Narration] Merging audio with video...')

    await new Promise<void>((resolve, reject) => {
      const { spawn } = require('child_process')

      let ffmpegArgs: string[]

      if (bgMusicLocalPath) {
        // 3-input mix: video + narration audio + background music
        const volMusic = backgroundMusicVolume !== undefined ? backgroundMusicVolume : 0.2
        ffmpegArgs = [
          '-i', videoUrl,                         // 0: original video
          '-i', mergedAudioPath,                   // 1: narration
          '-i', bgMusicLocalPath,                  // 2: background music
          '-filter_complex',
          `[1:a]volume=1.0[a1];[2:a]volume=${volMusic}[a2];[a1][a2]amix=inputs=2:duration=first:dropout_transition=2[aout]`,
          '-map', '0:v:0',
          '-map', '[aout]',
          '-c:v', 'copy',
          '-c:a', 'aac',
          '-b:a', '192k',
          '-shortest',
          '-y', outputPath
        ]
        console.log(`[OCR-Narration] FFmpeg: 3-input mix (narration + bg music at vol ${volMusic})`)
      } else {
        // 2-input: video + narration audio only
        ffmpegArgs = [
          '-i', videoUrl,                          // 0: original video
          '-i', mergedAudioPath,                   // 1: narration
          '-map', '0:v:0',
          '-map', '1:a:0',
          '-c:v', 'copy',
          '-c:a', 'aac',
          '-b:a', '192k',
          '-shortest',
          '-y', outputPath
        ]
        console.log('[OCR-Narration] FFmpeg: 2-input merge (narration only, no bg music)')
      }

      console.log('[OCR-Narration] FFmpeg spawn args:', ffmpegArgs.join(' '))

      const proc = spawn('ffmpeg', ffmpegArgs)
      let stderr = ''
      proc.stderr.on('data', (d: Buffer) => { stderr += d.toString() })
      proc.on('close', (code: number) => {
        if (code === 0) {
          console.log('[FFmpeg] ✅ Video merge complete')
          resolve()
        } else {
          console.error('[FFmpeg] ❌ stderr tail:', stderr.slice(-1000))
          reject(new Error(`FFmpeg merge failed (code ${code}): ${stderr.slice(-400)}`))
        }
      })
      proc.on('error', reject)
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
