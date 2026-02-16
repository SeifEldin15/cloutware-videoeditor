import { detectTextGoogle } from './google-vision'
import { getInitializedFfmpeg } from './ffmpeg'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'

export interface OCROptions {
  numberOfFrames?: number
  language?: string
  confidenceThreshold?: number
}

export interface OCRResult {
  text: string
  confidence: number
  frameResults: Array<{
    frameNumber: number
    text: string
    confidence: number
    timestamp: number
  }>
}

/**
 * Extract text from video using Google Cloud Vision API
 * Extracts frames from the video and performs OCR on each frame
 */
export async function extractTextFromVideo(
  videoUrl: string,
  options: OCROptions = {}
): Promise<OCRResult> {
  const {
    numberOfFrames = 10,
    language = 'eng',
    confidenceThreshold = 30
  } = options

  console.log(`🔍 Starting OCR on video (Google Vision): ${videoUrl}`)
  console.log(`📊 Settings: ${numberOfFrames} frames, ${language} language, ${confidenceThreshold}% confidence threshold`)

  // Create temporary directory for frames
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'video-ocr-'))
  
  try {
    // Download video to temp location if it's a URL
    let videoPath: string
    if (videoUrl.startsWith('http://') || videoUrl.startsWith('https://')) {
      console.log('📥 Downloading video...')
      videoPath = path.join(tempDir, 'temp_video.mp4')
      const response = await fetch(videoUrl)
      if (!response.ok) {
        throw new Error(`Failed to download video: ${response.statusText}`)
      }
      const buffer = await response.arrayBuffer()
      await fs.writeFile(videoPath, Buffer.from(buffer))
      console.log('✅ Video downloaded')
    } else {
      videoPath = videoUrl
    }

    // Extract frames
    console.log(`🎬 Extracting ${numberOfFrames} frames from video...`)
    const frames = await extractFrames(videoPath, numberOfFrames, tempDir)
    console.log(`✅ Extracted ${frames.length} frames`)

    console.log('🤖 Google Vision API ready')

    // Process each frame
    const frameResults: OCRResult['frameResults'] = []
    let allText = ''

    // Process frames in batches
    const CONCURRENCY = 3
    
    for (let i = 0; i < frames.length; i += CONCURRENCY) {
      const batch = frames.slice(i, i + CONCURRENCY)
      console.log(`📝 Processing batch ${Math.floor(i / CONCURRENCY) + 1}/${Math.ceil(frames.length / CONCURRENCY)}...`)
      
      const promises = batch.map(async (frame, index) => {
        const frameIndex = i + index
        try {
          // Call Google Vision API
          const { words, fullText } = await detectTextGoogle(frame.path, language)
          
          // Calculate average confidence for the frame
          const confidence = words.length > 0
            ? words.reduce((sum, w) => sum + w.confidence, 0) / words.length
            : 0

          return { frameIndex, fullText, confidence, timestamp: frame.timestamp }
        } catch (error) {
          console.error(`❌ Error processing frame ${frameIndex + 1}:`, error)
          return { frameIndex, fullText: '', confidence: 0, timestamp: frame.timestamp }
        }
      })
      
      const results = await Promise.all(promises)
      
      for (const result of results) {
        const { frameIndex, fullText, confidence, timestamp } = result
        
        console.log(`   Frame ${frameIndex + 1}: Found text length ${fullText.length}`)
        
        if (confidence >= confidenceThreshold && fullText.trim().length > 0) {
          const cleanText = fullText
            .trim()
            .replace(/\s+/g, ' ') // Normalize whitespace
          
          frameResults.push({
            frameNumber: frameIndex + 1,
            text: cleanText,
            confidence: confidence,
            timestamp: timestamp
          })
          
          allText += cleanText + ' '
          console.log(`   ✅ Accepted: "${cleanText.substring(0, 50)}..." (${confidence.toFixed(1)}%)`)
        } else {
          console.log(`   ⚠️ Skipped (confidence ${confidence.toFixed(1)}% < ${confidenceThreshold}% or empty)`)
        }
      }
    }

    // Calculate average confidence
    const avgConfidence = frameResults.length > 0
      ? frameResults.reduce((sum, r) => sum + r.confidence, 0) / frameResults.length
      : 0

    console.log(`✅ OCR complete. Found text in ${frameResults.length}/${frames.length} frames`)

    return {
      text: allText.trim(),
      confidence: avgConfidence,
      frameResults
    }

  } finally {
    // Cleanup temp directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true })
    } catch (error) {
      console.warn('Failed to cleanup temp directory:', error)
    }
  }
}

/**
 * Extract frames from video at regular intervals
 */
async function extractFrames(
  videoPath: string,
  numberOfFrames: number,
  outputDir: string
): Promise<Array<{ path: string; timestamp: number }>> {
  return new Promise(async (resolve, reject) => {
    const ffmpeg = await getInitializedFfmpeg()
    const frames: Array<{ path: string; timestamp: number }> = []
    
    // First, get video duration
    ffmpeg.ffprobe(videoPath, async (err: any, metadata: any) => {
      if (err) {
        reject(new Error(`Failed to probe video: ${err.message}`))
        return
      }

      const duration = metadata.format.duration || 0
      const interval = duration / (numberOfFrames + 1)

      // Extract frames at calculated intervals
      for (let i = 1; i <= numberOfFrames; i++) {
        const timestamp = interval * i
        const framePath = path.join(outputDir, `frame_${i}.png`)
        
        await new Promise<void>((resolveFrame, rejectFrame) => {
          ffmpeg(videoPath)
            .inputOptions([
              '-protocol_whitelist', 'file,http,https,tcp,tls'
            ])
            .seekInput(timestamp)
            .outputOptions([
              '-vf', 'scale=1920:-1,eq=contrast=1.7:brightness=0.1', // 1080p resolution + stronger contrast
              '-q:v', '1' // Highest quality
            ])
            .frames(1)
            .output(framePath)
            .on('end', () => {
              frames.push({ path: framePath, timestamp })
              resolveFrame()
            })
            .on('error', (error: any) => {
              rejectFrame(new Error(`Failed to extract frame: ${error.message}`))
            })
            .run()
        })
      }

      resolve(frames)
    })
  })
}
