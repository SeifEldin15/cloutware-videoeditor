import { generateSpeech } from './elevenlabs'
import { translateText } from './translate-text'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'
import { getInitializedFfmpeg } from './ffmpeg'
import type { FfmpegCommand } from 'fluent-ffmpeg'

export interface SrtNarrationOptions {
  voice?: string
  speed?: number
  stability?: number
  similarityBoost?: number
  /** Volume of narration audio (0.0 - 1.0), default 1.0 */
  narrationVolume?: number
  /** Volume of original video audio (0.0 - 1.0), default 0.1 (ducked) */
  originalVolume?: number
  /** Whether to keep original audio mixed in, default true */
  keepOriginalAudio?: boolean
  /** Source language code (e.g. 'en'), default 'en' */
  sourceLanguage?: string
  /** Target language code for translation (e.g. 'es'). If set and different from source, SRT text is translated before TTS */
  targetLanguage?: string
}

interface SrtSegment {
  index: number
  startTime: number   // in seconds
  endTime: number     // in seconds
  text: string
}

/**
 * Parse SRT timestamp string to seconds
 * Format: HH:MM:SS,mmm
 */
function parseSrtTimestamp(timestamp: string): number {
  const match = timestamp.trim().match(/^(\d{2}):(\d{2}):(\d{2})[,.](\d{3})$/)
  if (!match) {
    throw new Error(`Invalid SRT timestamp format: "${timestamp}"`)
  }
  const [, hours, minutes, seconds, milliseconds] = match
  return parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseInt(seconds) + parseInt(milliseconds) / 1000
}

/**
 * Parse SRT content string into structured segments
 */
export function parseSrt(srtContent: string): SrtSegment[] {
  const segments: SrtSegment[] = []
  // Normalize line endings
  const normalizedContent = srtContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const blocks = normalizedContent.trim().split(/\n\n+/)

  for (const block of blocks) {
    const lines = block.trim().split('\n')
    if (lines.length < 3) continue

    const index = parseInt(lines[0].trim())
    if (isNaN(index)) continue

    const timestampLine = lines[1].trim()
    const timestampMatch = timestampLine.match(/^(.+?)\s*-->\s*(.+?)$/)
    if (!timestampMatch) continue

    const startTime = parseSrtTimestamp(timestampMatch[1])
    const endTime = parseSrtTimestamp(timestampMatch[2])
    const text = lines.slice(2).join(' ').trim()

    if (text.length > 0) {
      segments.push({ index, startTime, endTime, text })
    }
  }

  return segments.sort((a, b) => a.startTime - b.startTime)
}

/**
 * Generate narrated video from SRT content and video URL.
 * 
 * Process:
 * 1. Parse SRT into timed text segments
 * 2. Generate TTS audio for each segment via ElevenLabs
 * 3. Place each audio clip at the correct timestamp
 * 4. Merge narration audio track with original video
 * 
 * @returns Buffer containing the final narrated video (MP4)
 */
export async function generateSrtNarration(
  videoUrl: string,
  srtContent: string,
  options: SrtNarrationOptions = {}
): Promise<Buffer> {
  const {
    voice = '21m00Tcm4TlvDq8ikWAM', // Default: Rachel
    speed = 1.0,
    stability = 0.5,
    similarityBoost = 0.75,
    narrationVolume = 1.0,
    originalVolume = 0.1,
    keepOriginalAudio = true,
    sourceLanguage = 'en',
    targetLanguage
  } = options

  const shouldTranslate = targetLanguage && targetLanguage !== sourceLanguage

  // Step 1: Parse SRT
  console.log('[SRT-Narration] Parsing SRT content...')
  const segments = parseSrt(srtContent)

  if (segments.length === 0) {
    throw new Error('No valid segments found in SRT content')
  }

  console.log(`[SRT-Narration] Found ${segments.length} text segments`)

  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'srt-narration-'))
  const audioFiles: Array<{ path: string; startTime: number }> = []

  try {
    // Step 2: Generate TTS audio for each segment
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i]
      let textToSpeak = segment.text

      // Translate if a target language is specified
      if (shouldTranslate) {
        console.log(`[SRT-Narration] Translating segment ${i + 1} to ${targetLanguage}...`)
        textToSpeak = await translateText(textToSpeak, sourceLanguage, targetLanguage!)
      }

      console.log(`[SRT-Narration] Generating audio ${i + 1}/${segments.length}: "${textToSpeak.substring(0, 50)}..." at ${segment.startTime.toFixed(2)}s`)

      const audioStream = await generateSpeech(textToSpeak, {
        voiceId: voice,
        speed,
        stability,
        similarityBoost
      })

      // Collect audio stream into buffer
      const chunks: Buffer[] = []
      await new Promise<void>((resolve, reject) => {
        audioStream.on('data', (chunk) => chunks.push(chunk))
        audioStream.on('end', resolve)
        audioStream.on('error', reject)
      })

      const audioPath = path.join(tempDir, `segment_${i}.mp3`)
      await fs.writeFile(audioPath, Buffer.concat(chunks))
      audioFiles.push({ path: audioPath, startTime: segment.startTime })
    }

    console.log(`[SRT-Narration] Generated ${audioFiles.length} audio clips, building narration track...`)

    // Step 3: Build the merged narration audio track with correct timing
    // We'll use FFmpeg's amix/adelay filters to position each clip at the right time
    const mergedAudioPath = path.join(tempDir, 'merged_narration.mp3')

    if (audioFiles.length === 1) {
      // Simple case: just one audio clip with delay
      const audio = audioFiles[0]
      const delayMs = Math.round(audio.startTime * 1000)
      const ffmpegSingle = await getInitializedFfmpeg()

      await new Promise<void>((resolve, reject) => {
        const cmd = ffmpegSingle()
          .input(audio.path)

        if (delayMs > 0) {
          cmd.audioFilters(`adelay=${delayMs}|${delayMs}`)
        }

        cmd.audioCodec('libmp3lame')
          .audioBitrate('192k')
          .output(mergedAudioPath)
          .on('end', () => resolve())
          .on('error', (err: any) => reject(err))
          .run()
      })
    } else {
      // Multiple clips: use concat approach with silence gaps
      const concatFilePath = path.join(tempDir, 'concat.txt')
      let concatContent = ''
      let currentTime = 0

      for (let i = 0; i < audioFiles.length; i++) {
        const audio = audioFiles[i]

        // Add silence gap to reach the start time of this segment
        if (audio.startTime > currentTime) {
          const gapDuration = audio.startTime - currentTime
          const gapPath = path.join(tempDir, `gap_${i}.mp3`)

          const ffmpegGap = await getInitializedFfmpeg()
          await new Promise<void>((resolve, reject) => {
            ffmpegGap()
              .input('anullsrc=r=44100:cl=stereo')
              .inputFormat('lavfi')
              .duration(gapDuration)
              .audioCodec('libmp3lame')
              .audioBitrate('192k')
              .output(gapPath)
              .on('end', () => resolve())
              .on('error', (err: any) => reject(err))
              .run()
          })

          concatContent += `file '${gapPath.replace(/\\/g, '/')}'\n`
        }

        // Add the audio clip
        concatContent += `file '${audio.path.replace(/\\/g, '/')}'\n`

        // Get duration of this audio clip to track position
        const ffmpegProbe = await getInitializedFfmpeg()
        const duration = await new Promise<number>((resolve, reject) => {
          ffmpegProbe.ffprobe(audio.path, (err: any, metadata: any) => {
            if (err) reject(err)
            else resolve(metadata.format.duration || 0)
          })
        })

        currentTime = audio.startTime + duration
      }

      await fs.writeFile(concatFilePath, concatContent)

      // Concatenate all audio files
      console.log('[SRT-Narration] Concatenating audio clips with timing...')
      const ffmpegConcat = await getInitializedFfmpeg()
      await new Promise<void>((resolve, reject) => {
        ffmpegConcat()
          .input(concatFilePath)
          .inputOptions(['-f', 'concat', '-safe', '0'])
          .audioCodec('libmp3lame')
          .audioBitrate('192k')
          .output(mergedAudioPath)
          .on('end', () => resolve())
          .on('error', (err: any) => reject(err))
          .run()
      })
    }

    // Step 4: Merge narration audio with the original video
    const outputPath = path.join(tempDir, 'output.mp4')
    const ffmpeg = await getInitializedFfmpeg()

    console.log('[SRT-Narration] Merging narration with video...')

    if (keepOriginalAudio) {
      // Mix original audio (ducked) with narration
      await new Promise<void>((resolve, reject) => {
        const command: FfmpegCommand = ffmpeg()
          .input(videoUrl)
          .input(mergedAudioPath)
          .complexFilter([
            `[0:a]volume=${originalVolume}[original]`,
            `[1:a]volume=${narrationVolume}[narration]`,
            `[original][narration]amix=inputs=2:duration=longest:dropout_transition=2[aout]`
          ])
          .outputOptions([
            '-c:v copy',
            '-c:a aac',
            '-b:a 192k',
            '-map 0:v:0',
            '-map [aout]'
          ])
          .output(outputPath)
          .on('start', (cmd: any) => {
            console.log('[FFmpeg] Command:', cmd)
          })
          .on('progress', (progress: any) => {
            if (progress.percent) {
              console.log(`[FFmpeg] Merge progress: ${progress.percent.toFixed(1)}%`)
            }
          })
          .on('end', () => {
            console.log('[FFmpeg] Narration merge complete')
            resolve()
          })
          .on('error', (err: any, stdout: any, stderr: any) => {
            console.error('[FFmpeg] Error:', err?.message || err)
            console.error('[FFmpeg] stderr:', stderr)
            reject(new Error(`FFmpeg error: ${err?.message || err}`))
          })

        command.run()
      })
    } else {
      // Replace original audio entirely with narration
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
              console.log(`[FFmpeg] Merge progress: ${progress.percent.toFixed(1)}%`)
            }
          })
          .on('end', () => {
            console.log('[FFmpeg] Narration merge complete')
            resolve()
          })
          .on('error', (err: any, stdout: any, stderr: any) => {
            console.error('[FFmpeg] Error:', err?.message || err)
            console.error('[FFmpeg] stderr:', stderr)
            reject(new Error(`FFmpeg error: ${err?.message || err}`))
          })

        command.run()
      })
    }

    // Step 5: Read and return the final video buffer
    console.log('[SRT-Narration] Reading final video buffer...')
    const videoBuffer = await fs.readFile(outputPath)
    console.log(`[SRT-Narration] Final video buffer size: ${videoBuffer.length} bytes`)

    // Cleanup
    await fs.rm(tempDir, { recursive: true, force: true })

    return videoBuffer
  } catch (error) {
    // Cleanup on error
    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {})
    throw error
  }
}
