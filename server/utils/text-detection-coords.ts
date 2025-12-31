import { createWorker } from 'tesseract.js'
import { getInitializedFfmpeg } from './ffmpeg'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'
import sharp from 'sharp'
import { correctText } from './spell-checker'

/**
 * Check if text is meaningful (not gibberish or special characters only)
 */
function isMeaningfulText(text: string): boolean {
  // Remove all non-alphanumeric characters to check content
  const alphanumericOnly = text.replace(/[^a-zA-Z0-9]/g, '')
  
  // Must have at least 1 letter (not just numbers/symbols)
  const hasLetters = /[a-zA-Z]/.test(text)
  if (!hasLetters) {
    return false
  }
  
  // Must have at least 2 alphanumeric characters
  if (alphanumericOnly.length < 2) {
    return false
  }
  
  // Calculate ratio of letters to total length
  const letterCount = (text.match(/[a-zA-Z]/g) || []).length
  const letterRatio = letterCount / text.length
  
  // If more than 70% is special characters/numbers, probably gibberish
  if (letterRatio < 0.3) {
    return false
  }
  
  // Exclude lines that are only symbols, dashes, underscores
  if (/^[_\-~=+*#@$%^&()[\]{}|\\/<>.,;:!?'"` ]+$/.test(text)) {
    return false
  }
  
  // Common gibberish patterns to exclude
  const gibberishPatterns = [
    /^[=\-_~`]+$/,           // Only symbols
    /^[\d\s]+$/,              // Only numbers and spaces
    /^[^\w\s]+$/,             // Only special characters
    /^[()[\]{}]+$/,           // Only brackets
    /^[.,:;!?]+$/,            // Only punctuation
  ]
  
  for (const pattern of gibberishPatterns) {
    if (pattern.test(text)) {
      return false
    }
  }
  
  // Extract actual words (sequences of letters)
  const words = text.match(/[a-zA-Z]+/g) || []
  
  if (words.length === 0) {
    return false
  }
  
  // Check if at least one word is meaningful (common English words or longer than 2 chars)
  const commonWords = new Set([
    'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for', 'not',
    'on', 'with', 'he', 'as', 'you', 'do', 'at', 'this', 'but', 'his', 'by', 'from',
    'they', 'we', 'say', 'her', 'she', 'or', 'an', 'will', 'my', 'one', 'all', 'would',
    'there', 'their', 'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which',
    'go', 'me', 'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know',
    'take', 'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see',
    'other', 'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think',
    'also', 'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well',
    'way', 'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'us',
    // Common verbs and nouns
    'change', 'doesnt', 'doesn', 'posture', 'anything', 'nothing', 'everything', 'something'
  ])
  
  let hasMeaningfulWord = false
  
  for (const word of words) {
    const lowerWord = word.toLowerCase()
    
    // Accept if it's a common word
    if (commonWords.has(lowerWord)) {
      hasMeaningfulWord = true
      break
    }
    
    // Accept if it's longer than 3 characters (likely a real word)
    if (word.length > 3) {
      hasMeaningfulWord = true
      break
    }
  }
  
  // Reject patterns like "il Ti", "v", "A A", etc.
  // If no meaningful words found, reject it
  if (!hasMeaningfulWord) {
    return false
  }
  
  // Reject if it has more than 50% single-character "words"
  const singleCharWords = words.filter(w => w.length === 1).length
  if (singleCharWords / words.length > 0.5) {
    return false
  }
  
  return true
}

/**
 * Post-process OCR text to fix common recognition errors
 * Corrects ambiguous characters using context
 */
function correctOCRErrors(text: string): string {
  // First apply spell checking with dictionary
  let corrected = correctText(text)
  console.log(`   🔤 Spell check: "${text}" → "${corrected}"`)
  
  // Then apply OCR-specific character corrections
  const corrections: Array<[RegExp, string]> = [
    // Fix common character substitutions at word boundaries
    [/\b0(?=[a-z])/gi, 'O'],           // 0 -> O at start of word before lowercase
    [/\bl(?=\d)/gi, '1'],              // l -> 1 before digit
    [/\b1(?=[a-z]{2,})/gi, 'I'],       // 1 -> I at start of word before letters
    [/(?<=[a-z])0(?=[a-z])/gi, 'o'],   // 0 -> o in middle of word
    [/(?<=[a-z])1(?=[a-z])/gi, 'l'],   // 1 -> l in middle of word
    
    // Fix common OCR mistakes for specific patterns
    [/\bBy\s+Posture\b/gi, 'Posture'], // Remove "By" prefix artifact
    [/\bFy\b/gi, 'By'],                 // Fy -> By
    [/\bRosture\b/gi, 'Posture'],       // Rosture -> Posture
    [/\bre\b(?=\s|$)/gi, 'are'],        // "re" at end -> "are"
    [/\b3\s+/g, 'a '],                  // 3 -> a (common confusion)
    [/\bFg\b/gi, 'By'],                 // Fg -> By
    
    // Fix incomplete contractions and common word fragments
    [/\bdoesn\b(?!['']t)/gi, "doesn't"],     // doesn -> doesn't
    [/\bdon\b(?!['']t)(?=\s|$)/gi, "don't"], // don -> don't
    [/\bcan\b(?!['']t)(?=\s+not\b)/gi, "can't"], // can not -> can't
    [/\bwon\b(?!['']t)(?=\s|$)/gi, "won't"], // won -> won't
    [/\bisn\b(?!['']t)/gi, "isn't"],         // isn -> isn't
    [/\baren\b(?!['']t)/gi, "aren't"],       // aren -> aren't
    [/\bwasn\b(?!['']t)/gi, "wasn't"],       // wasn -> wasn't
    [/\bweren\b(?!['']t)/gi, "weren't"],     // weren -> weren't
    [/\bhasn\b(?!['']t)/gi, "hasn't"],       // hasn -> hasn't
    [/\bhaven\b(?!['']t)/gi, "haven't"],     // haven -> haven't
    [/\bhadn\b(?!['']t)/gi, "hadn't"],       // hadn -> hadn't
    [/\bwouldn\b(?!['']t)/gi, "wouldn't"],   // wouldn -> wouldn't
    [/\bshouldn\b(?!['']t)/gi, "shouldn't"], // shouldn -> shouldn't
    [/\bcouldnt\b/gi, "couldn't"],           // couldnt -> couldn't
    [/\bwouldnt\b/gi, "wouldn't"],           // wouldnt -> wouldn't
    [/\bdidnt\b/gi, "didn't"],               // didnt -> didn't
    
    // Fix common word fragments
    [/\bthats\b/gi, "that's"],          // thats -> that's
    [/\bits\b(?=\s)/gi, "it's"],        // its -> it's (when used as "it is")
    [/\bIm\b/gi, "I'm"],                // Im -> I'm
    [/\bId\b(?=\s)/gi, "I'd"],          // Id -> I'd
    [/\bIll\b/gi, "I'll"],              // Ill -> I'll
    [/\bweve\b/gi, "we've"],            // weve -> we've
    [/\btheyre\b/gi, "they're"],        // theyre -> they're
    [/\byoure\b/gi, "you're"],          // youre -> you're
    
    // Fix spacing issues
    [/([a-z])([A-Z])/g, '$1 $2'],      // Add space before capital in middle of text
    [/\s{2,}/g, ' '],                   // Multiple spaces -> single space
    
    // Remove common OCR artifacts
    [/[~`´]/g, ''],                     // Remove tildes and backticks
    [/\|/g, 'I'],                       // | -> I
    [/\.{2,}/g, ''],                    // Multiple dots (artifacts)
    
    // Fix punctuation
    [/\s+([.,!?;:])/g, '$1'],          // Remove space before punctuation
    [/([.,!?;:])\s*([a-zA-Z])/g, '$1 $2'], // Ensure space after punctuation
  ]
  
  for (const [pattern, replacement] of corrections) {
    corrected = corrected.replace(pattern, replacement)
  }
  
  // Trim whitespace
  corrected = corrected.trim()
  
  return corrected
}

export interface TextDetectionOptions {
  numberOfFrames?: number
  language?: string
  confidenceThreshold?: number
  minTextLength?: number  // Minimum length of text to detect
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
  startTime?: number  // Start time in seconds when text appears
  endTime?: number    // End time in seconds when text disappears
}

export interface TextDetectionResult {
  detectedTexts: DetectedText[]
  videoWidth: number
  videoHeight: number
  totalFrames: number
}

/**
 * Detect if text in image is predominantly light or dark
 */
async function detectTextBrightness(inputPath: string): Promise<'light' | 'dark'> {
  const buffer = await fs.readFile(inputPath)
  const img = sharp(buffer)
  
  // Get image statistics
  const stats = await img.stats()
  
  // Calculate average brightness across all channels
  const avgBrightness = stats.channels.reduce((sum, ch) => sum + ch.mean, 0) / stats.channels.length
  
  // If average brightness > 127, image is generally light (might have dark text on light bg)
  // If < 127, might be light text on dark background
  // But we want to detect the TEXT color, so look at edges/high-contrast areas
  
  // Get edge-detected version to focus on text regions
  const edgeBuffer = await img
    .greyscale()
    .convolve({
      width: 3,
      height: 3,
      kernel: [-1, -1, -1, -1, 8, -1, -1, -1, -1] // Edge detection kernel
    })
    .toBuffer()
  
  const edgeStats = await sharp(edgeBuffer).stats()
  const edgeBrightness = edgeStats.channels[0].mean
  
  // High edge brightness suggests light text on dark bg
  // Low edge brightness with high overall brightness suggests dark text on light bg
  if (avgBrightness < 127 || edgeBrightness > 100) {
    console.log(`   💡 Detected LIGHT text (avg: ${avgBrightness.toFixed(1)}, edges: ${edgeBrightness.toFixed(1)})`)
    return 'light'
  } else {
    console.log(`   💡 Detected DARK text (avg: ${avgBrightness.toFixed(1)}, edges: ${edgeBrightness.toFixed(1)})`)
    return 'dark'
  }
}

/**
 * Preprocess image for better OCR results
 * Based on Tesseract best practices: https://tesseract-ocr.github.io/tessdoc/ImproveQuality.html
 * Adaptive preprocessing based on text brightness
 * Returns both the processed image path and the scaling information
 */
async function preprocessImage(inputPath: string): Promise<{
  outputPath: string
  preprocessScaleFactor: number
  borderSize: number
}> {
  const outputPath = inputPath.replace('.png', '_processed.png')
  
  // Check if input file exists
  try {
    await fs.access(inputPath)
  } catch (error) {
    throw new Error(`Input file does not exist: ${inputPath}`)
  }
  
  // Detect text color
  const textBrightness = await detectTextBrightness(inputPath)
  const isLightText = textBrightness === 'light'
  
  const img = sharp(inputPath)
  const metadata = await img.metadata()
  const { width = 0, height = 0 } = metadata
  
  // Tesseract works best with DPI >= 300, aim for 1080p height minimum
  const targetHeight = 1080
  const preprocessScaleFactor = height < targetHeight ? targetHeight / height : 1
  const borderSize = 10
  
  // Create base preprocessed image
  let preprocessed = img
    .resize(Math.round(width * preprocessScaleFactor), Math.round(height * preprocessScaleFactor))
  
  if (isLightText) {
    // Light text on dark background - invert for Tesseract (needs dark text on light bg)
    console.log('   🔄 Inverting image for light text detection')
    preprocessed = preprocessed
      .negate() // Invert colors
      .linear(1.5, -(128 * 0.5)) // Increase contrast: output = 1.5 * input - 64
      .normalize() // Auto-adjust to full range
  } else {
    // Dark text on light background - standard processing
    preprocessed = preprocessed
      .linear(1.3, -(128 * 0.3)) // Moderate contrast boost
      .normalize()
  }
  
  // Common processing for both cases
  await preprocessed
    .greyscale()
    // Add small border (10px) - helps Tesseract with edge text
    .extend({
      top: borderSize,
      bottom: borderSize,
      left: borderSize,
      right: borderSize,
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    })
    // Median filter for noise reduction while preserving edges
    .median(3)
    .sharpen({ sigma: 2.0 }) // Stronger sharpening
    // Adaptive threshold for better binarization
    .threshold(isLightText ? 140 : 128, { greyscale: true })
    .toFile(outputPath)
  
  return { outputPath, preprocessScaleFactor, borderSize }
}

/**
 * Detect text in video with bounding box coordinates
 */
export async function detectTextWithCoordinates(
  videoUrl: string,
  options: TextDetectionOptions = {}
): Promise<TextDetectionResult> {
  const {
    numberOfFrames = 100,  // Scan entire video with more frames
    language = 'eng',
    confidenceThreshold = 70,
    minTextLength = 2  // Minimum 2 characters
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

    // Extract frames at 1 FPS
    console.log(`🎬 Extracting frames at 1 FPS...`)
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
      tessedit_pageseg_mode: 3 as any,  // Fully automatic page segmentation (better for videos)
      preserve_interword_spaces: '1',
      tessedit_char_blacklist: '|[]{}\\<>',
      tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .,!?\'-',
      // Disable dictionaries for better detection of non-standard text
      load_system_dawg: '0',
      load_freq_dawg: '0',
    })
    console.log('✅ Tesseract ready')


    const detectedTexts: DetectedText[] = []

    for (let i = 0; i < frames.length; i++) {
      console.log(`📝 Processing frame ${i + 1}/${frames.length}...`)
      
      const { outputPath: processedPath, preprocessScaleFactor, borderSize } = await preprocessImage(frames[i].path)
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
            // OCR coordinates are from the preprocessed image
            // 1. Remove border offset (10px on each side)
            // 2. Scale back from preprocessed size to frame size (2560px)
            // 3. Scale from frame size to video size
            const leftInFrame = (left - borderSize) / preprocessScaleFactor
            const topInFrame = (top - borderSize) / preprocessScaleFactor
            const widthInFrame = wordWidth / preprocessScaleFactor
            const heightInFrame = wordHeight / preprocessScaleFactor
            
            // Now scale from frame coordinates (2560px) to video coordinates
            allWords.push({
              text,
              confidence: conf,
              bbox: {
                x0: Math.round(leftInFrame * scaleFactorX),
                y0: Math.round(topInFrame * scaleFactorY),
                x1: Math.round((leftInFrame + widthInFrame) * scaleFactorX),
                y1: Math.round((topInFrame + heightInFrame) * scaleFactorY)
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
      
      if (allWords.length > 0) {
        console.log(`   ✓ Frame has ${allWords.length} words, grouping into lines...`)
        // Group words into lines
        const lines = groupWordsIntoLines(allWords, width, height)
        console.log(`   ✓ Grouped into ${lines.length} lines`)
        
        // Filter lines by confidence threshold and meaningful text
        for (const line of lines) {
          const cleanedText = line.text.trim()
          console.log(`   Line: "${cleanedText}" (confidence: ${line.confidence.toFixed(2)}%)`)
          
          // Check if line passes confidence threshold and minimum length
          if (cleanedText.length >= minTextLength && line.confidence >= confidenceThreshold) {
            // Check if text is meaningful (not gibberish)
            if (isMeaningfulText(cleanedText)) {
              // Apply OCR error correction
              const correctedText = correctOCRErrors(cleanedText)
              console.log(`   📝 Original: "${cleanedText}" → Corrected: "${correctedText}"`)
              
              detectedTexts.push({
                text: correctedText,
                confidence: line.confidence,
                boundingBox: line.boundingBox,
                frameNumber: i + 1,
                timestamp: frames[i].timestamp
              })
              console.log(`   ✓ Added text: "${correctedText}" (${line.confidence.toFixed(2)}%)`)
            } else {
              console.log(`   ✗ Skipped: gibberish or special characters only`)
            }
          } else if (cleanedText.length > 0 && cleanedText.length < minTextLength) {
            console.log(`   ✗ Skipped: too short (${cleanedText.length} chars < ${minTextLength})`)
          } else if (cleanedText.length > 0) {
            console.log(`   ✗ Skipped: confidence ${line.confidence.toFixed(2)}% < ${confidenceThreshold}%`)
          } else {
            console.log(`   ✗ Skipped: empty`)
          }
        }
      } else {
        console.log(`   ✗ No words extracted from frame`)
      }
    }

    await worker.terminate()

    console.log(`✅ Detection complete. Found ${detectedTexts.length} text regions`)

    // Group detected texts by time ranges
    const consolidatedTexts = consolidateTextsByTimeRanges(detectedTexts)
    console.log(`📊 Consolidated into ${consolidatedTexts.length} unique text regions with time ranges`)

    return {
      detectedTexts: consolidatedTexts,
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

  // Sort words by vertical position first, then horizontal
  const sortedWords = [...words].sort((a, b) => {
    const verticalDiff = a.bbox.y0 - b.bbox.y0
    if (Math.abs(verticalDiff) > 35) return verticalDiff // Different lines (tighter threshold)
    return a.bbox.x0 - b.bbox.x0 // Same line, sort by horizontal
  })
  
  const lines: Array<{
    text: string
    confidence: number
    boundingBox: TextBoundingBox
  }> = []
  
  let currentLine: any[] = []
  let lineY = sortedWords[0].bbox.y0
  const lineThreshold = 50 // Increased from 40px - words within 50px vertically are on same line

  for (const word of sortedWords) {
    if (Math.abs(word.bbox.y0 - lineY) > lineThreshold && currentLine.length > 0) {
      // Start new line
      lines.push(createLineFromWords(currentLine))
      currentLine = [word]
      lineY = word.bbox.y0
    } else {
      currentLine.push(word)
      // Update average line Y position
      lineY = currentLine.reduce((sum, w) => sum + w.bbox.y0, 0) / currentLine.length
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
 * Consolidate detected texts by grouping similar texts that appear in consecutive frames
 * SMART SAMPLING: If we detect text at a sampled timestamp, assume it exists for the
 * entire sampling interval around that timestamp
 * INTERPOLATION: Sample fewer frames but assume 2x density for time coverage
 * Also merges text fragments that are clearly part of the same sentence
 */
function consolidateTextsByTimeRanges(detectedTexts: DetectedText[]): DetectedText[] {
  if (detectedTexts.length === 0) return []

  // Sort by timestamp
  const sorted = [...detectedTexts].sort((a, b) => a.timestamp - b.timestamp)
  
  // Calculate the sampling interval based on how far apart the detections are
  let samplingInterval = 1.0 // Default to 1 second
  if (sorted.length > 1) {
    const totalDuration = sorted[sorted.length - 1].timestamp - sorted[0].timestamp
    samplingInterval = totalDuration / (sorted.length - 1)
    console.log(`📊 Detected sampling interval: ${samplingInterval.toFixed(2)}s`)
    
    // INTERPOLATION: Treat as if we sampled 2x more frames
    // This means each detection covers 2x the normal interval
    // Add 10% extra overlap to ensure no gaps between frames
    const interpolatedInterval = samplingInterval * 2 * 1.1
    console.log(`🔄 Using 2x interpolation + 10% overlap - each detection covers ${interpolatedInterval.toFixed(2)}s`)
    samplingInterval = interpolatedInterval
  }
  
  const consolidated: DetectedText[] = []
  const TEXT_SIMILARITY_THRESHOLD = 0.6 // Lower threshold to catch more partial matches
  const POSITION_THRESHOLD = 200 // Increased pixels - text in similar position
  const VERTICAL_THRESHOLD = 80 // Vertical distance for same text block
  
  for (const detection of sorted) {
    // Normalize text for comparison
    const normalizedText = detection.text.toLowerCase().replace(/\s+/g, ' ').trim()
    
    // Calculate the time range this sample represents
    // No extra padding needed - the 10% overlap handles gaps
    const halfInterval = samplingInterval / 2
    const rangeStart = Math.max(0, detection.timestamp - halfInterval)
    const rangeEnd = detection.timestamp + halfInterval
    
    // Find if this text overlaps or should be merged with an existing entry
    let found = false
    for (const existing of consolidated) {
      const existingNormalized = existing.text.toLowerCase().replace(/\s+/g, ' ').trim()
      
      // Check if texts are similar or if one is a fragment of the other
      const similarity = calculateSimilarity(normalizedText, existingNormalized)
      const isFragment = normalizedText.includes(existingNormalized) || 
                        existingNormalized.includes(normalizedText)
      
      // Check word overlap - if they share common words, they might be fragments
      const words1 = normalizedText.split(/\s+/)
      const words2 = existingNormalized.split(/\s+/)
      const commonWords = words1.filter(w => words2.includes(w) && w.length > 2)
      const hasCommonWords = commonWords.length > 0
      
      // Check if positions are similar
      const horizontalDistance = Math.abs(detection.boundingBox.x - existing.boundingBox.x)
      const verticalDistance = Math.abs(detection.boundingBox.y - existing.boundingBox.y)
      const positionDistance = Math.sqrt(
        Math.pow(horizontalDistance, 2) +
        Math.pow(verticalDistance, 2)
      )
      
      // More aggressive merging: same position OR similar text OR common words
      const shouldMerge = (
        (similarity >= TEXT_SIMILARITY_THRESHOLD && positionDistance <= POSITION_THRESHOLD) ||
        (isFragment && verticalDistance <= VERTICAL_THRESHOLD) ||
        (hasCommonWords && verticalDistance <= VERTICAL_THRESHOLD && horizontalDistance <= 150)
      )
      
      if (shouldMerge) {
        const existingEnd = existing.endTime || existing.timestamp
        const gap = rangeStart - existingEnd
        
        // If ranges overlap or are adjacent, merge them (increased gap tolerance)
        if (gap <= 1.5) {
          // Extend time range
          existing.endTime = rangeEnd
          
          // Use the longer text (more complete)
          if (detection.text.length > existing.text.length) {
            existing.text = detection.text
            console.log(`   🔄 Updated to longer text: "${detection.text}"`)
          }
          
          // Update bounding box to average position
          existing.boundingBox.x = Math.round((existing.boundingBox.x + detection.boundingBox.x) / 2)
          existing.boundingBox.y = Math.round((existing.boundingBox.y + detection.boundingBox.y) / 2)
          existing.boundingBox.width = Math.max(existing.boundingBox.width, detection.boundingBox.width)
          existing.boundingBox.height = Math.max(existing.boundingBox.height, detection.boundingBox.height)
          
          console.log(`   🔗 Extended: "${existing.text}" now ${existing.startTime?.toFixed(2)}s - ${rangeEnd.toFixed(2)}s`)
          found = true
          break
        }
      }
    }
    
    if (!found) {
      console.log(`   ✨ New: "${detection.text}" at ${rangeStart.toFixed(2)}s - ${rangeEnd.toFixed(2)}s`)
      consolidated.push({
        ...detection,
        startTime: rangeStart,
        endTime: rangeEnd
      })
    }
  }
  
  // Log final time ranges
  console.log(`\n📊 Consolidated ${detectedTexts.length} samples into ${consolidated.length} text occurrences:`)
  
  // Sort consolidated texts by start time
  consolidated.sort((a, b) => (a.startTime || a.timestamp) - (b.startTime || b.timestamp))
  
  // Group texts by time blocks - texts that overlap in time are in the same block
  const timeBlocks: DetectedText[][] = []
  const TIME_OVERLAP_THRESHOLD = 1.0 // Texts within 1.0s are considered same block
  
  for (const text of consolidated) {
    const textStart = text.startTime || text.timestamp
    const textEnd = text.endTime || text.timestamp
    
    // Find if this text belongs to an existing time block (overlaps with any text in the block)
    let foundBlock = false
    for (const block of timeBlocks) {
      const blockStart = Math.min(...block.map(t => t.startTime || t.timestamp))
      const blockEnd = Math.max(...block.map(t => t.endTime || t.timestamp))
      
      // Check if this text overlaps with the block
      if (textStart <= blockEnd + TIME_OVERLAP_THRESHOLD && textEnd >= blockStart - TIME_OVERLAP_THRESHOLD) {
        block.push(text)
        foundBlock = true
        break
      }
    }
    
    if (!foundBlock) {
      // Create new time block
      timeBlocks.push([text])
    }
  }
  
  console.log(`\n🕐 Grouped into ${timeBlocks.length} time blocks:`)
  
  // Now extend each time block to end 0.5s before the next block starts to prevent overlap
  for (let i = 0; i < timeBlocks.length; i++) {
    const currentBlock = timeBlocks[i]
    const nextBlock = timeBlocks[i + 1]
    
    const blockStart = Math.min(...currentBlock.map(t => t.startTime || t.timestamp))
    let blockEnd = Math.max(...currentBlock.map(t => t.endTime || t.timestamp))
    
    if (nextBlock) {
      // End this block 0.5s BEFORE next block starts to ensure clean transition
      const nextBlockStart = Math.min(...nextBlock.map(t => t.startTime || t.timestamp))
      blockEnd = nextBlockStart - 0.1
      
      for (const text of currentBlock) {
        text.endTime = blockEnd
      }
      
      console.log(`   Block ${i + 1}: ${currentBlock.length} text(s) from ${blockStart.toFixed(2)}s to ${blockEnd.toFixed(2)}s (ends 0.5s before next)`)
      for (const text of currentBlock) {
        console.log(`      - "${text.text}"`)
      }
    } else {
      // Last block - keep original end times
      console.log(`   Block ${i + 1}: ${currentBlock.length} text(s) from ${blockStart.toFixed(2)}s to ${blockEnd.toFixed(2)}s (last block)`)
      for (const text of currentBlock) {
        console.log(`      - "${text.text}"`)
      }
    }
  }
  
  return consolidated
}

/**
 * Calculate similarity between two strings (simple Levenshtein-based)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2
  const shorter = str1.length > str2.length ? str2 : str1
  
  if (longer.length === 0) return 1.0
  
  const editDistance = levenshteinDistance(longer, shorter)
  return (longer.length - editDistance) / longer.length
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = []
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i]
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        )
      }
    }
  }
  
  return matrix[str2.length][str1.length]
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
      
      // Extract 1 frame per second
      console.log(`📹 Extracting 1 frame per second from ${duration.toFixed(2)}s video...`)
      
      const targetFps = 1 // Fixed at 1 FPS
      const expectedFrames = Math.ceil(duration)
      console.log(`📊 Expecting approximately ${expectedFrames} frames`)
      
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error(`Frame extraction timeout after ${expectedFrames * 2} seconds`))
        }, expectedFrames * 2000) // 2 seconds per frame timeout
        
        ffmpeg(videoPath)
          .inputOptions([
            '-protocol_whitelist', 'file,http,https,tcp,tls'
          ])
          .outputOptions([
            '-vf', `fps=1,scale=2560:-1`, // Extract 1 frame per second
            '-q:v', '1' // Highest quality
          ])
          .output(path.join(outputDir, 'frame_%d.png')) // %d will be replaced with frame numbers 0, 1, 2, ...
          .on('end', async () => {
            clearTimeout(timeout)
            
            // Read all extracted frames from the directory
            try {
              const files = await fs.readdir(outputDir)
              const frameFiles = files
                .filter(f => f.startsWith('frame_') && f.endsWith('.png'))
                .sort((a, b) => {
                  const numA = parseInt(a.match(/frame_(\d+)\.png/)?.[1] || '0')
                  const numB = parseInt(b.match(/frame_(\d+)\.png/)?.[1] || '0')
                  return numA - numB
                })
              
              console.log(`✅ Extracted ${frameFiles.length} frames`)
              
              // Calculate timestamp for each frame
              for (let i = 0; i < frameFiles.length; i++) {
                const framePath = path.join(outputDir, frameFiles[i])
                const timestamp = (duration / frameFiles.length) * i
                frames.push({ path: framePath, timestamp })
              }
              
              resolve()
            } catch (err) {
              reject(new Error(`Failed to read extracted frames: ${err}`))
            }
          })
          .on('error', (error: any) => {
            clearTimeout(timeout)
            reject(new Error(`Failed to extract frames: ${error.message}`))
          })
          .run()
      })

      resolve(frames)
    })
  })
}
