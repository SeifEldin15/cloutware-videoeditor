import { defineEventHandler, readBody, createError } from 'h3'
import { detectTextWithCoordinates } from '../utils/text-detection-coords'
import { generateSpeech } from '../utils/elevenlabs'
import { PassThrough } from 'node:stream'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'
import { getInitializedFfmpeg } from '../utils/ffmpeg'
import type { FfmpegCommand } from 'fluent-ffmpeg'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { videoUrl, numberOfFrames = 30, confidenceThreshold = 80, voice = '21m00Tcm4TlvDq8ikWAM', timedNarration = true } = body

  if (!videoUrl) throw createError({ statusCode: 400, message: 'videoUrl is required' })

  const ocrResults = await detectTextWithCoordinates(videoUrl, { numberOfFrames, confidenceThreshold, language: 'eng' })
  
  // Sort detected texts by vertical position (top to bottom) within same time blocks
  const sortedTexts = ocrResults.detectedTexts.sort((a, b) => {
    const timeA = a.startTime ?? a.timestamp
    const timeB = b.startTime ?? b.timestamp
    if (Math.abs(timeA - timeB) > 0.5) return timeA - timeB
    return a.boundingBox.y - b.boundingBox.y
  })

  if (sortedTexts.length === 0) {
    throw createError({ statusCode: 400, message: 'No text could be extracted' })
  }

  console.log(`[OCR-to-Speech] Found ${sortedTexts.length} text regions`)

  if (timedNarration) {
    // Generate timed narration - each text at its appearance time
    console.log('[OCR-to-Speech] Generating timed narration video...')
    const videoStream = await generateTimedNarration(videoUrl, sortedTexts, voice)
    
    event.node.res.setHeader('Content-Type', 'video/mp4')
    event.node.res.setHeader('Content-Disposition', 'attachment; filename="ocr_timed_narration.mp4"')
    
    return videoStream
  } else {
    // Generate single audio file with all text
    const extractedText = sortedTexts.map(d => d.text).join(' ').trim()
    console.log(`[OCR-to-Speech] Generating single narration: "${extractedText}"`)
    
    const audioStream = await generateSpeech(extractedText, { voiceId: voice })

    event.node.res.setHeader('Content-Type', 'audio/mpeg')
    event.node.res.setHeader('X-OCR-Text', Buffer.from(extractedText).toString('base64'))
    
    return audioStream
  }
})

async function generateTimedNarration(videoUrl: string, texts: any[], voice: string): Promise<PassThrough> {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'timed-narration-'))
  const audioFiles: Array<{ path: string, startTime: number }> = []

  try {
    // Generate audio for each text segment
    for (let i = 0; i < texts.length; i++) {
      const textObj = texts[i]
      const startTime = textObj.startTime ?? textObj.timestamp
      
      console.log(`[OCR-to-Speech] Generating audio ${i + 1}/${texts.length}: "${textObj.text}" at ${startTime.toFixed(2)}s`)
      
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

    // Create a concat file to merge all audio with proper timing
    const concatFilePath = path.join(tempDir, 'concat.txt')
    const silencePath = path.join(tempDir, 'silence.mp3')
    
    // Create a 0.1s silence file for padding
    const ffmpegSilence = await getInitializedFfmpeg()
    await new Promise<void>((resolve, reject) => {
      ffmpegSilence()
        .input('anullsrc=r=44100:cl=stereo')
        .inputFormat('lavfi')
        .duration(0.1)
        .audioCodec('libmp3lame')
        .output(silencePath)
        .on('end', () => resolve())
        .on('error', (err: any) => reject(err))
        .run()
    })

    // Build concat list with silences for timing
    let concatContent = ''
    let currentTime = 0
    
    for (const audio of audioFiles) {
      // Add silence to reach the start time
      if (audio.startTime > currentTime) {
        const silenceDuration = audio.startTime - currentTime
        const ffmpegGap = await getInitializedFfmpeg()
        const gapPath = path.join(tempDir, `gap_${currentTime}.mp3`)
        
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
    const outputStream = new PassThrough()

    return new Promise<PassThrough>((resolve, reject) => {
      let resolved = false
      
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
            console.log(`[FFmpeg] Progress: ${progress.percent.toFixed(1)}%`)
          }
        })
        .on('end', async () => {
          console.log('[FFmpeg] Timed narration complete')
          try {
            const videoBuffer = await fs.readFile(outputPath)
            outputStream.write(videoBuffer)
            outputStream.end()
            await fs.rm(tempDir, { recursive: true, force: true })
          } catch (err) {
            console.error('[OCR-to-Speech] Failed to read output:', err)
            reject(err)
          }
          if (!resolved) {
            resolved = true
          }
        })
        .on('error', async (err: any, stdout: any, stderr: any) => {
          console.error('[FFmpeg] Error:', err?.message || err)
          console.error('[FFmpeg] stderr:', stderr)
          try {
            await fs.rm(tempDir, { recursive: true, force: true })
          } catch (e) {
            // ignore
          }
          if (!resolved) {
            resolved = true
            reject(new Error(`FFmpeg error: ${err?.message || err}`))
          }
        })

      command.run()
      resolve(outputStream)
    })
  } catch (error) {
    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {})
    throw error
  }
}
