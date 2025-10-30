import { defineEventHandler, readBody, createError } from 'h3'
import { detectTextWithCoordinates } from '../utils/text-detection-coords'
import { generateSpeech } from '../utils/elevenlabs'
import { PassThrough } from 'node:stream'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'
import { getInitializedFfmpeg } from '../utils/ffmpeg'
import type { FfmpegCommand } from 'fluent-ffmpeg'

/**
 * OCR-to-Speech Pipeline
 * Extracts text from video using OCR, generates speech, optionally merges with video
 * 
 * Request Body:
 * {
 *   videoUrl: string;              // Video URL to process
 *   numberOfFrames?: number;       // Number of frames to extract (default: 5)
 *   confidenceThreshold?: number;  // OCR confidence threshold (default: 60)
 *   voice?: string;               // ElevenLabs voice ID
 *   speed?: number;               // Speech speed (0.25 - 4.0)
 *   stability?: number;           // Voice stability (0.0 - 1.0)
 *   similarityBoost?: number;     // Voice similarity (0.0 - 1.0)
 *   style?: number;              // Voice style intensity (0.0 - 1.0)
 *   mergeWithVideo?: boolean;     // Whether to merge audio with original video
 * }
 */
export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const {
      videoUrl,
      numberOfFrames = 5,
      confidenceThreshold = 60,
      voice = '21m00Tcm4TlvDq8ikWAM', // Default: Rachel
      speed = 1.0,
      stability,
      similarityBoost,
      style,
      mergeWithVideo = false
    } = body

    if (!videoUrl) {
      throw createError({
        statusCode: 400,
        message: 'videoUrl is required'
      })
    }

    // Step 1: Extract text from video using OCR
    console.log('[OCR-to-Speech] Step 1: Extracting text from video...')
    let ocrResults = await detectTextWithCoordinates(videoUrl, {
      numberOfFrames,
      confidenceThreshold,
      language: 'eng'
    })

    // Get the full text from all detected texts
    let extractedText = ocrResults.detectedTexts
      .map(d => d.text)
      .join(' ')
      .trim()

    // If OCR returned nothing, try a safe retry with more frames and a lower threshold
    if (!extractedText || extractedText.trim().length === 0) {
      console.warn('[OCR-to-Speech] No text found on first pass — retrying with more frames / lower threshold')
      const retryFrames = Math.min(50, Math.max(numberOfFrames * 2, 10))
      const retryConfidence = Math.max(30, (confidenceThreshold || 60) - 15)
      try {
        ocrResults = await detectTextWithCoordinates(videoUrl, {
          numberOfFrames: retryFrames,
          confidenceThreshold: retryConfidence,
          language: 'eng'
        })
        extractedText = ocrResults.detectedTexts
          .map(d => d.text)
          .join(' ')
          .trim()
        console.log(`[OCR-to-Speech] Retry extracted ${extractedText?.length || 0} characters (frames=${retryFrames}, threshold=${retryConfidence})`)
      } catch (retryErr) {
        console.warn('[OCR-to-Speech] Retry OCR failed:', retryErr)
      }
    }

    if (!extractedText || extractedText.trim().length === 0) {
      throw createError({
        statusCode: 400,
        message: 'No text could be extracted from the video'
      })
    }

    console.log(`[OCR-to-Speech] Extracted ${extractedText.length} characters from ${ocrResults.detectedTexts.length} text regions`)

    // Step 2: Generate speech from extracted text
    console.log('[OCR-to-Speech] Step 2: Generating speech...')
    const audioStream = await generateSpeech(extractedText, {
      voiceId: voice,
      speed,
      stability,
      similarityBoost,
      style
    })

    // Step 3: Optionally merge with video
    if (mergeWithVideo) {
      console.log('[OCR-to-Speech] Step 3: Merging audio with video...')
      const mergedStream = await combineVideoWithAudio(videoUrl, audioStream)
      
      // Set response headers for video
      event.node.res.setHeader('Content-Type', 'video/mp4')
      event.node.res.setHeader('Content-Disposition', 'attachment; filename="ocr_narrated_video.mp4"')
      event.node.res.setHeader('X-OCR-Text-Length', extractedText.length.toString())
      event.node.res.setHeader('X-OCR-Text-Regions', ocrResults.detectedTexts.length.toString())
      
      return mergedStream
    } else {
      // Return audio only
      console.log('[OCR-to-Speech] Returning audio only')
      event.node.res.setHeader('Content-Type', 'audio/mpeg')
      event.node.res.setHeader('Content-Disposition', 'attachment; filename="ocr_narration.mp3"')
      event.node.res.setHeader('X-OCR-Text', Buffer.from(extractedText).toString('base64'))
      event.node.res.setHeader('X-OCR-Text-Length', extractedText.length.toString())
      event.node.res.setHeader('X-OCR-Text-Regions', ocrResults.detectedTexts.length.toString())
      
      return audioStream
    }
  } catch (error: any) {
    console.error('[OCR-to-Speech] Error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to process video with OCR-to-Speech'
    })
  }
})

/**
 * Combine video with audio using FFmpeg
 */
async function combineVideoWithAudio(videoUrl: string, audioStream: PassThrough): Promise<PassThrough> {
  const ffmpeg = await getInitializedFfmpeg()
  const outputStream = new PassThrough()

  // Save audio stream to a buffer first
  const audioChunks: Buffer[] = []
  await new Promise<void>((resolve, reject) => {
    audioStream.on('data', (chunk) => audioChunks.push(chunk))
    audioStream.on('end', resolve)
    audioStream.on('error', reject)
  })
  const audioBuffer = Buffer.concat(audioChunks)

  // Write audio buffer to a temp file - more reliable than piping into fluent-ffmpeg
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ocr-audio-'))
  const audioPath = path.join(tempDir, 'speech.mp3')
  const outputPath = path.join(tempDir, 'output.mp4')
  await fs.writeFile(audioPath, audioBuffer)

  return new Promise<PassThrough>((resolve, reject) => {
    let resolved = false

    const command: FfmpegCommand = ffmpeg()
      .input(videoUrl)
      .input(audioPath)
      .outputOptions([
        '-c:v copy',           // Copy video codec
        '-c:a aac',            // Encode audio to AAC
        '-b:a 192k',           // Audio bitrate
        '-map 0:v:0',          // Map video from first input
        '-map 1:a:0',          // Map audio from second input (file)
        '-shortest'            // Match shortest stream duration
      ])
      .output(outputPath)      // Write to temp file instead of pipe
      .on('start', (commandLine: any) => {
        console.log('[FFmpeg] Spawned:', commandLine)
      })
      .on('progress', (progress: any) => {
        console.log('[FFmpeg] Progress:', progress.percent?.toFixed(2) + '%')
      })
      .on('end', async () => {
        console.log('[FFmpeg] Video merging complete')
        try {
          // Read the output file and stream it
          const videoBuffer = await fs.readFile(outputPath)
          outputStream.write(videoBuffer)
          outputStream.end()
          
          // cleanup temp files
          await fs.rm(tempDir, { recursive: true, force: true })
        } catch (err) {
          console.error('[OCR-to-Speech] Failed to read output or clean temp dir:', err)
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
          /* ignore */
        }
        if (!resolved) {
          resolved = true
          reject(new Error(`FFmpeg error: ${err?.message || err}`))
        }
      })

    // Start the conversion
    command.run()

    // Resolve with the output stream immediately
    resolve(outputStream)
  })
}
