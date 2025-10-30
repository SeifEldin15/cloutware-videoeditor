import { createWorker } from 'tesseract.js'
import { getInitializedFfmpeg } from './ffmpeg'
import { PassThrough } from 'stream'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'
import sharp from 'sharp'

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
 * Preprocess image for better OCR results
 * - Convert to grayscale
 * - Increase contrast
 * - Sharpen
 * - Denoise
 */
async function preprocessImage(inputPath: string): Promise<string> {
  const outputPath = inputPath.replace('.png', '_processed.png')
  
  await sharp(inputPath)
    .greyscale()
    .normalize() // Auto-adjust contrast
    .sharpen({ sigma: 1.5 }) // Sharpen text
    .threshold(128) // Convert to black and white
    .toFile(outputPath)
  
  return outputPath
}

/**
 * Extract text from video using Tesseract OCR
 * Extracts frames from the video and performs OCR on each frame
 */
export async function extractTextFromVideo(
  videoUrl: string,
  options: OCROptions = {}
): Promise<OCRResult> {
  const {
    numberOfFrames = 10,
    language = 'eng',
    confidenceThreshold = 30  // Lowered from 70 to 30 for better text detection
  } = options

  console.log(`🔍 Starting OCR on video: ${videoUrl}`)
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

    // Initialize Tesseract worker with better configuration
    console.log('🤖 Initializing Tesseract OCR...')
    const worker = await createWorker(language, 1, {
      logger: m => {
        // Silent mode - only show completion
      }
    })
    
    // Configure Tesseract for better accuracy with subtitle text
    await worker.setParameters({
      tessedit_pageseg_mode: 6 as any, // Assume uniform block of text (better for subtitles)
      preserve_interword_spaces: '1',
      tessedit_char_blacklist: '|[]{}\\<>', // Remove common OCR mistakes
    })
    console.log('✅ Tesseract ready with enhanced settings')

    // Process each frame
    const frameResults: OCRResult['frameResults'] = []
    let allText = ''

    for (let i = 0; i < frames.length; i++) {
      console.log(`📝 Processing frame ${i + 1}/${frames.length}...`)
      
      // Preprocess image for better OCR
      const processedPath = await preprocessImage(frames[i].path)
      
      // Perform OCR with better settings
      const { data } = await worker.recognize(processedPath, {
        rotateAuto: true,
      })
      
      console.log(`   Raw text: "${data.text.trim().substring(0, 100)}..."`)
      console.log(`   Confidence: ${data.confidence.toFixed(2)}%`)
      console.log(`   Text length: ${data.text.trim().length}`)
      
      if (data.confidence >= confidenceThreshold) {
        const cleanText = data.text
          .trim()
          .replace(/\s+/g, ' ') // Normalize whitespace
        
        if (cleanText && cleanText.length > 0) { // Accept any non-empty text
          frameResults.push({
            frameNumber: i + 1,
            text: cleanText,
            confidence: data.confidence,
            timestamp: frames[i].timestamp
          })
          
          allText += cleanText + ' '
          console.log(`   ✅ Accepted: "${cleanText.substring(0, 50)}..."`)
        } else {
          console.log(`   ⚠️ Skipped (empty after cleaning)`)
        }
      } else {
        console.log(`   ⚠️ Skipped (confidence ${data.confidence.toFixed(2)}% < ${confidenceThreshold}%)`)
      }
    }

    await worker.terminate()

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
              '-vf', 'scale=2560:-1,eq=contrast=1.5:brightness=0.1', // Higher res + better contrast
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
