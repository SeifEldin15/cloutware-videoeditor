import { createWorker } from 'tesseract.js'
import { getInitializedFfmpeg } from './ffmpeg'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'
import sharp from 'sharp'

export interface TextDetectionOptions {
  numberOfFrames?: number
  language?: string
  confidenceThreshold?: number
}

export interface TextBoundingBox {
  x: number
  y: number
  width: number
  height: number
}

export interface DetectedText {
  text: string
  confidence: number
  boundingBox: TextBoundingBox
  frameNumber: number
  timestamp: number
}

export interface TextDetectionResult {
  detectedTexts: DetectedText[]
  videoWidth: number
  videoHeight: number
  totalFrames: number
}

/**
 * Preprocess image for better OCR results
 */
async function preprocessImage(inputPath: string): Promise<string> {
  const outputPath = inputPath.replace('.png', '_processed.png')
  
  await sharp(inputPath)
    .greyscale()
    .normalize()
    .sharpen({ sigma: 1.5 })
    .threshold(128)
    .toFile(outputPath)
  
  return outputPath
}

/**
 * Detect text in video with bounding box coordinates
 */
export async function detectTextWithCoordinates(
  videoUrl: string,
  options: TextDetectionOptions = {}
): Promise<TextDetectionResult> {
  const {
    numberOfFrames = 10,
    language = 'eng',
    confidenceThreshold = 70
  } = options

  console.log(`🔍 Detecting text with coordinates in video: ${videoUrl}`)
  console.log(`📊 Settings: ${numberOfFrames} frames, ${language} language, ${confidenceThreshold}% confidence`)

  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'text-detect-'))
  
  try {
    // Download video
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

    // Get video dimensions
    const { width, height } = await getVideoDimensions(videoPath)
    console.log(`📐 Video dimensions: ${width}x${height}`)

    // Extract frames
    console.log(`🎬 Extracting ${numberOfFrames} frames...`)
    const frames = await extractFrames(videoPath, numberOfFrames, tempDir)
    console.log(`✅ Extracted ${frames.length} frames`)
    
    // Calculate scale factor: frames are extracted at 2560px width
    // We need to scale coordinates back to original video dimensions
    const FRAME_SCALE_WIDTH = 2560
    const scaleFactorX = width / FRAME_SCALE_WIDTH
    const scaleFactorY = scaleFactorX // Maintain aspect ratio
    console.log(`📏 Scale factors: X=${scaleFactorX.toFixed(3)}, Y=${scaleFactorY.toFixed(3)} (frame:${FRAME_SCALE_WIDTH}px -> video:${width}px)`)

    // Initialize Tesseract
    console.log('🤖 Initializing Tesseract OCR...')
    const worker = await createWorker(language)
    
    await worker.setParameters({
      tessedit_pageseg_mode: 6 as any,
      preserve_interword_spaces: '1',
      tessedit_char_blacklist: '|[]{}\\<>',
    })
    console.log('✅ Tesseract ready')

    const detectedTexts: DetectedText[] = []

    for (let i = 0; i < frames.length; i++) {
      console.log(`📝 Processing frame ${i + 1}/${frames.length}...`)
      
      const processedPath = await preprocessImage(frames[i].path)
      // Request detailed output with blocks structure
      const result = await worker.recognize(processedPath, {}, { text: true, blocks: true, tsv: true })
      const data = result.data
      
      console.log(`   Confidence: ${data.confidence.toFixed(2)}%`)
      console.log(`   Raw text: "${data.text.substring(0, 100)}..."`)
      
      // Parse TSV output which contains word-level coordinates
      // TSV format: level\tpage_num\tblock_num\tpar_num\tline_num\tword_num\tleft\ttop\twidth\theight\tconf\ttext
      const allWords: any[] = []
      const tsv = data.tsv || ''
      const tsvLines = tsv.split('\n')
      
      for (let i = 1; i < tsvLines.length; i++) { // Skip header row
        const parts = tsvLines[i].split('\t')
        if (parts.length >= 12) {
          const level = parseInt(parts[0])
          const left = parseInt(parts[6])
          const top = parseInt(parts[7])
          const wordWidth = parseInt(parts[8])
          const wordHeight = parseInt(parts[9])
          const conf = parseFloat(parts[10])
          const text = parts[11]?.trim() || ''
          
          // Level 5 = word level in Tesseract TSV output
          if (level === 5 && text.length > 0 && conf > 0) {
            // Scale coordinates from frame size (2560px) to video size
            allWords.push({
              text,
              confidence: conf,
              bbox: {
                x0: Math.round(left * scaleFactorX),
                y0: Math.round(top * scaleFactorY),
                x1: Math.round((left + wordWidth) * scaleFactorX),
                y1: Math.round((top + wordHeight) * scaleFactorY)
              }
            })
          }
        }
      }
      
      console.log(`   Words extracted from TSV: ${allWords.length}`)
      
      //Debug: check first word structure if available
      if (allWords.length > 0) {
        console.log(`   First word structure:`, JSON.stringify({
          text: allWords[0].text,
          confidence: allWords[0].confidence,
          bbox: allWords[0].bbox,
          bboxKeys: allWords[0].bbox ? Object.keys(allWords[0].bbox) : 'no bbox'
        }))
      }
      
      if (data.confidence >= confidenceThreshold && allWords.length > 0) {
        console.log(`   ✓ Frame passes threshold, grouping words into lines...`)
        // Group words into lines
        const lines = groupWordsIntoLines(allWords, width, height)
        console.log(`   ✓ Grouped into ${lines.length} lines`)
        
        for (const line of lines) {
          console.log(`   Line text: "${line.text.trim()}" (length: ${line.text.trim().length})`)
          if (line.text.trim().length > 0) {
            detectedTexts.push({
              text: line.text.trim(),
              confidence: line.confidence,
              boundingBox: line.boundingBox,
              frameNumber: i + 1,
              timestamp: frames[i].timestamp
            })
            console.log(`   ✓ Added text: "${line.text.trim()}" at (${line.boundingBox.x}, ${line.boundingBox.y})`)
          } else {
            console.log(`   ✗ Skipped (empty)`)
          }
        }
      } else {
        console.log(`   ✗ Skipped (confidence ${data.confidence.toFixed(2)}% < ${confidenceThreshold}% or no words)`)
      }
    }

    await worker.terminate()

    console.log(`✅ Detection complete. Found ${detectedTexts.length} text regions`)

    return {
      detectedTexts,
      videoWidth: width,
      videoHeight: height,
      totalFrames: numberOfFrames
    }

  } finally {
    try {
      await fs.rm(tempDir, { recursive: true, force: true })
    } catch (error) {
      console.warn('Failed to cleanup temp directory:', error)
    }
  }
}

/**
 * Group words into lines based on vertical position
 */
function groupWordsIntoLines(words: any[], videoWidth: number, videoHeight: number): Array<{
  text: string
  confidence: number
  boundingBox: TextBoundingBox
}> {
  if (words.length === 0) return []

  // Sort words by vertical position
  const sortedWords = [...words].sort((a, b) => a.bbox.y0 - b.bbox.y0)
  
  const lines: Array<{
    text: string
    confidence: number
    boundingBox: TextBoundingBox
  }> = []
  
  let currentLine: any[] = []
  let lineY = sortedWords[0].bbox.y0
  const lineThreshold = 20 // Pixels - words within this vertical distance are on same line

  for (const word of sortedWords) {
    if (Math.abs(word.bbox.y0 - lineY) > lineThreshold && currentLine.length > 0) {
      // Start new line
      lines.push(createLineFromWords(currentLine))
      currentLine = [word]
      lineY = word.bbox.y0
    } else {
      currentLine.push(word)
    }
  }
  
  if (currentLine.length > 0) {
    lines.push(createLineFromWords(currentLine))
  }

  return lines
}

/**
 * Create a line object from multiple words
 */
function createLineFromWords(words: any[]): {
  text: string
  confidence: number
  boundingBox: TextBoundingBox
} {
  // Sort words left to right
  const sorted = [...words].sort((a, b) => a.bbox.x0 - b.bbox.x0)
  
  const text = sorted.map(w => w.text).join(' ')
  const confidence = sorted.reduce((sum, w) => sum + w.confidence, 0) / sorted.length
  
  // Calculate bounding box that encompasses all words
  const x0 = Math.min(...sorted.map(w => w.bbox.x0))
  const y0 = Math.min(...sorted.map(w => w.bbox.y0))
  const x1 = Math.max(...sorted.map(w => w.bbox.x1))
  const y1 = Math.max(...sorted.map(w => w.bbox.y1))
  
  return {
    text,
    confidence,
    boundingBox: {
      x: Math.round(x0),
      y: Math.round(y0),
      width: Math.round(x1 - x0),
      height: Math.round(y1 - y0)
    }
  }
}

/**
 * Get video dimensions
 */
async function getVideoDimensions(videoPath: string): Promise<{ width: number; height: number }> {
  return new Promise(async (resolve, reject) => {
    const ffmpeg = await getInitializedFfmpeg()
    
    ffmpeg.ffprobe(videoPath, (err: any, metadata: any) => {
      if (err) {
        reject(new Error(`Failed to get video dimensions: ${err.message}`))
        return
      }

      const videoStream = metadata.streams.find((s: any) => s.codec_type === 'video')
      if (!videoStream) {
        reject(new Error('No video stream found'))
        return
      }

      resolve({
        width: videoStream.width,
        height: videoStream.height
      })
    })
  })
}

/**
 * Extract frames from video
 */
async function extractFrames(
  videoPath: string,
  numberOfFrames: number,
  outputDir: string
): Promise<Array<{ path: string; timestamp: number }>> {
  return new Promise(async (resolve, reject) => {
    const ffmpeg = await getInitializedFfmpeg()
    const frames: Array<{ path: string; timestamp: number }> = []
    
    ffmpeg.ffprobe(videoPath, async (err: any, metadata: any) => {
      if (err) {
        reject(new Error(`Failed to probe video: ${err.message}`))
        return
      }

      const duration = metadata.format.duration || 0
      const interval = duration / (numberOfFrames + 1)

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
              '-vf', 'scale=2560:-1,eq=contrast=1.5:brightness=0.1',
              '-q:v', '1'
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
