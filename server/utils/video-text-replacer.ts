import { getInitializedFfmpeg } from './ffmpeg'
import { PassThrough } from 'stream'
import type { DetectedText } from './text-detection-coords'

export interface TextReplacement {
  originalText: string
  newText: string
  boundingBox: {
    x: number
    y: number
    width: number
    height: number
  }
  timestamp: number
  startTime?: number  // Start time in seconds when text should appear
  endTime?: number    // End time in seconds when text should disappear
}

export interface ReplaceTextOptions {
  textReplacements: TextReplacement[]
  outputName?: string
  fontFamily?: string
  fontSize?: number
  fontColor?: string
  backgroundColor?: string
  backgroundOpacity?: number
  videoWidth?: number  // Video width for horizontal alignment
}

/**
 * Replace text in video by overlaying white rectangles and new text
 */
export async function replaceTextInVideo(
  videoUrl: string,
  options: ReplaceTextOptions
): Promise<PassThrough> {
  const {
    textReplacements,
    outputName = 'replaced_text_video',
    fontFamily = 'Arial',
    fontSize = 24,
    fontColor = '#000000',
    backgroundColor = '#FFFFFF',
    backgroundOpacity = 1.0,
    videoWidth
  } = options

  console.log(`🎨 Replacing ${textReplacements.length} text region(s) in video`)

  return new Promise<PassThrough>(async (resolve, reject) => {
    try {
      const outputStream = new PassThrough({ highWaterMark: 8 * 1024 * 1024 })
      
      // Use temp file for proper MP4 formatting
      const fs = await import('fs')
      const os = await import('os')
      const path = await import('path')
      const tempFile = path.join(os.tmpdir(), `video_text_replace_${Date.now()}.mp4`)
      console.log(`📁 Using temp file: ${tempFile}`)
      
      const ffmpeg = await getInitializedFfmpeg()
      let command = ffmpeg(videoUrl)

      // Input options
      command.inputOptions([
        '-protocol_whitelist', 'file,http,https,tcp,tls',
        '-reconnect', '1',
        '-reconnect_streamed', '1',
        '-reconnect_delay_max', '5'
      ])

      // Build video filters as a single complex filter string
      const filterComplex = buildTextReplacementFilterComplex(textReplacements, {
        fontFamily,
        fontSize,
        fontColor,
        backgroundColor,
        backgroundOpacity
      }, videoWidth)

      console.log('📝 Applying text replacements...')
      console.log(`📐 Filter complex:`, filterComplex)
      console.log(`📊 Replacements:`, JSON.stringify(textReplacements, null, 2))

      let hasStarted = false
      let hasError = false

      command
        .complexFilter(filterComplex)  
        .outputOptions([
          '-map', '[out]',  // Map the filtered video stream
          '-map', '0:a?',   // Map audio stream if exists (? means optional)
          '-c:v', 'libx264',
          '-preset', 'medium',           // Medium for crisp text (fast causes text artifacts)
          '-crf', '18',                  // Good quality
          '-tune', 'stillimage',         // Optimize for sharp edges like text
          '-c:a', 'aac',                 // Re-encode audio to AAC
          '-b:a', '192k',                // Audio bitrate
          '-max_muxing_queue_size', '4096',  // Increase muxing queue
          '-movflags', '+faststart'      // Enable fast start
        ])
        .on('start', (commandLine: string) => {
          hasStarted = true
          console.log(`🎬 ${outputName} FFmpeg started`)
          console.log(`📋 Command: ${commandLine}`)
        })
        .on('stderr', (stderrLine: string) => {
          console.log(`[FFmpeg stderr]: ${stderrLine}`)
        })
        .on('progress', (progress: any) => {
          if (progress.percent) {
            console.log(`${outputName} Processing: ${progress.percent.toFixed(2)}%`)
          }
          if (progress.targetSize) {
            console.log(`${outputName} Current size: ${progress.targetSize}kB`)
          }
        })
        .on('end', async () => {
          console.log(`✅ ${outputName} FFmpeg completed, reading temp file...`)
          
          try {
            // Read the complete file
            const fileBuffer = await fs.promises.readFile(tempFile)
            console.log(`📊 Read ${fileBuffer.length} bytes from temp file`)
            
            // Write to stream
            outputStream.write(fileBuffer)
            outputStream.end()
            
            // Clean up temp file
            await fs.promises.unlink(tempFile)
            console.log(`🗑️ Deleted temp file: ${tempFile}`)
          } catch (err) {
            console.error('Error reading temp file:', err)
            reject(err)
          }
        })
        .on('error', async (error: any) => {
          hasError = true
          console.error(`❌ ${outputName} FFmpeg error:`, error.message)
          console.error(`📊 Error details:`, error)
          if (!hasStarted) {
            console.error('⚠️ FFmpeg never started!')
          }
          
          // Clean up temp file on error
          try {
            await fs.promises.unlink(tempFile)
          } catch (e) {
            // Ignore cleanup errors
          }
          
          if (!outputStream.destroyed) {
            outputStream.destroy(error)
          }
          reject(new Error(`Video processing failed: ${error.message}`))
        })

      // Save to temp file to ensure proper MP4 formatting
      command.save(tempFile)
      
      console.log('🔄 FFmpeg processing to temp file...')
      resolve(outputStream)

    } catch (error) {
      console.error('Text replacement error:', error)
      reject(error)
    }
  })
}

/**
 * Build FFmpeg filter complex string for text replacements
 * Uses a single filter chain with symmetric overlays and text
 * Supports time-based filtering so each overlay only appears when the text is visible
 */
function buildTextReplacementFilterComplex(
  replacements: TextReplacement[],
  style: {
    fontFamily: string
    fontSize: number
    fontColor: string
    backgroundColor: string
    backgroundOpacity: number
  },
  videoWidth?: number  // Add video width parameter for centering
): string {
  console.log(`🎨 Building filter complex for ${replacements.length} replacement(s)`)

  // Calculate the maximum width for all overlays (make them symmetric)
  const padding = 10
  let maxWidth = 0
  
  for (const replacement of replacements) {
    const width = replacement.boundingBox.width + (padding * 2)
    if (width > maxWidth) {
      maxWidth = width
    }
  }
  
  console.log(`📏 Maximum overlay width: ${maxWidth}px`)
  
  // Calculate horizontal center position for ALL overlays
  // If videoWidth is not provided, use detected position of first text
  const centerX = videoWidth ? Math.floor((videoWidth - maxWidth) / 2) : null
  
  // Start with scale filter
  let filterChain = '[0:v]scale=trunc(iw/2)*2:trunc(ih/2)*2'
  
  const bgColor = hexToRgb(style.backgroundColor)
  
  // Add each replacement with horizontally aligned overlays AND time-based filtering
  for (let i = 0; i < replacements.length; i++) {
    const replacement = replacements[i]
    const { boundingBox, newText, startTime, endTime } = replacement
    
    console.log(`📝 Processing replacement ${i + 1}: "${replacement.originalText}" -> "${newText}"`)
    
    // Use centered X position for ALL overlays (horizontally aligned)
    // Keep original Y position for each text
    const x = centerX !== null ? centerX : Math.max(0, boundingBox.x - padding)
    const y = Math.max(0, boundingBox.y - padding)
    const width = maxWidth
    const height = boundingBox.height + (padding * 2)

    // Build time-based enable expression
    // Format: enable='between(t,START,END)'
    let enableExpression = ''
    if (startTime !== undefined && endTime !== undefined) {
      // Use exact times without buffer to prevent overlap
      enableExpression = `:enable='between(t,${startTime.toFixed(3)},${endTime.toFixed(3)})'`
      console.log(`   ⏱️  Time range: ${startTime.toFixed(2)}s - ${endTime.toFixed(2)}s`)
    } else {
      console.log(`   ⏱️  No time range - overlay will be visible for entire video`)
    }

    // Draw white rectangle overlay with time-based enable (filled)
    filterChain += `,drawbox=x=${x}:y=${y}:w=${width}:h=${height}:color=${bgColor}@${style.backgroundOpacity}:t=fill${enableExpression}`
    
    // Clean text: Remove special characters, keep letters, numbers, spaces
    // Note: Apostrophes cause FFmpeg escaping issues, so we remove them
    const safeText = newText
      .replace(/[^a-zA-Z0-9\s]/g, ' ')  // Keep only alphanumeric and spaces
      .replace(/\s+/g, ' ')              // Normalize multiple spaces to single space
      .trim()                             // Remove leading/trailing spaces
    
    // Skip if text is empty after cleaning
    if (!safeText || safeText.length === 0) {
      console.log(`   ⚠️ Skipping empty text after cleaning: "${newText}"`)
      continue
    }
    
    // Calculate text position (centered horizontally in overlay)
    // For vertical centering, we use (y + h/2 - th/2) which in FFmpeg is: y + (h-text_h)/2
    const textX = `(${x}+${width}/2-tw/2)`  // Center horizontally: x + (width - text_width) / 2
    const textY = `(${y}+${height}/2-th/2)` // Center vertically: y + (height - text_height) / 2
    
    // Convert font color from hex to FFmpeg format (remove # prefix)
    const fontColorFFmpeg = style.fontColor.startsWith('#') ? style.fontColor.substring(1) : style.fontColor
    
    // Draw text using system font name with same time-based enable (avoid Windows path issues)
    filterChain += `,drawtext=text='${safeText}':font=${style.fontFamily}:fontsize=${style.fontSize}:fontcolor=0x${fontColorFFmpeg}:x=${textX}:y=${textY}${enableExpression}`
    
    console.log(`   📦 Overlay at (${x},${y}) size ${width}x${height} - HORIZONTALLY CENTERED`)
    console.log(`   ✍️  Text "${safeText}" centered in overlay`)
  }

  // Close the filter chain
  filterChain += '[out]'
  
  console.log(`🎬 Built filter complex with ${replacements.length} time-based horizontally aligned overlays + text`)
  console.log(`Filter: ${filterChain}`)
  
  return filterChain
}

/**
 * Build FFmpeg filter array for text replacements (simple string format)
 */
function buildTextReplacementFiltersSimple(
  replacements: TextReplacement[],
  style: {
    fontFamily: string
    fontSize: number
    fontColor: string
    backgroundColor: string
    backgroundOpacity: number
  }
): string[] {
  const filters: string[] = []

  // Ensure even dimensions
  filters.push('scale=trunc(iw/2)*2:trunc(ih/2)*2')

  console.log(`🎨 Building filters for ${replacements.length} replacement(s)`)

  const fontFilePath = getFontFilePath(style.fontFamily)
  // For Windows paths: convert backslashes AND escape colons for FFmpeg filter syntax
  const cleanFontPath = fontFilePath ? fontFilePath.replace(/\\/g, '/').replace(/:/g, '\\:') : null

  // For each replacement, draw white rectangle then text
  for (const replacement of replacements) {
    const { boundingBox, newText } = replacement
    
    console.log(`📝 Processing replacement: "${replacement.originalText}" -> "${newText}"`)
    
    // Add padding to bounding box
    const padding = 10
    const x = Math.max(0, boundingBox.x - padding)
    const y = Math.max(0, boundingBox.y - padding)
    const width = boundingBox.width + (padding * 2)
    const height = boundingBox.height + (padding * 2)

    // Draw white rectangle
    const bgColor = hexToRgb(style.backgroundColor)
    filters.push(`drawbox=x=${x}:y=${y}:w=${width}:h=${height}:color=${bgColor}@${style.backgroundOpacity}:t=fill`)

    // Draw text - minimal escaping for array format (fluent-ffmpeg handles most of it)
    const escapedText = newText.replace(/'/g, "'\\''")  // Only escape single quotes
    
    if (cleanFontPath) {
      // Quote the fontfile path to protect the escaped colon
      filters.push(`drawtext=text='${escapedText}':fontfile='${cleanFontPath}':fontsize=${style.fontSize}:fontcolor=${style.fontColor}:x=${x + padding}:y=${y + (height / 2)}`)
    } else {
      filters.push(`drawtext=text='${escapedText}':font=${style.fontFamily}:fontsize=${style.fontSize}:fontcolor=${style.fontColor}:x=${x + padding}:y=${y + (height / 2)}`)
    }
  }

  console.log(`🎬 Built ${filters.length} filters`)
  
  return filters
}

/**
 * Build FFmpeg filter array for text replacements
 * Returns array of filter objects for videoFilters() method
 */
function buildTextReplacementFilters(
  replacements: TextReplacement[],
  style: {
    fontFamily: string
    fontSize: number
    fontColor: string
    backgroundColor: string
    backgroundOpacity: number
  }
): any[] {
  const filters: any[] = []

  // Ensure even dimensions
  filters.push({
    filter: 'scale',
    options: 'trunc(iw/2)*2:trunc(ih/2)*2'
  })

  console.log(`🎨 Building filters for ${replacements.length} replacement(s)`)

  // For each replacement, draw white rectangle then text
  for (const replacement of replacements) {
    const { boundingBox, newText, timestamp } = replacement
    
    console.log(`📝 Processing replacement: "${replacement.originalText}" -> "${newText}"`)
    console.log(`📐 Bounding box:`, boundingBox)
    
    // Add padding to bounding box
    const padding = 10
    const x = Math.max(0, boundingBox.x - padding)
    const y = Math.max(0, boundingBox.y - padding)
    const width = boundingBox.width + (padding * 2)
    const height = boundingBox.height + (padding * 2)

    console.log(`📏 After padding: x=${x}, y=${y}, w=${width}, h=${height}`)

    // Convert hex color to RGB for drawbox
    const bgColor = hexToRgb(style.backgroundColor)
    const opacity = style.backgroundOpacity

    // Draw white/colored rectangle (background)
    filters.push({
      filter: 'drawbox',
      options: {
        x,
        y,
        w: width,
        h: height,
        color: `${bgColor}@${opacity}`,
        t: 'fill'
      }
    })

    // Draw text on top
    const fontFilePath = getFontFilePath(style.fontFamily)
    const escapedFontPath = fontFilePath ? fontFilePath.replace(/\\/g, '/') : null
    
    const textOptions: any = {
      text: newText,
      fontsize: style.fontSize,
      fontcolor: style.fontColor,
      x: x + padding,
      y: y + (height / 2)
    }
    
    if (escapedFontPath) {
      textOptions.fontfile = escapedFontPath
    } else {
      textOptions.font = style.fontFamily
    }
    
    filters.push({
      filter: 'drawtext',
      options: textOptions
    })
  }

  console.log(`🎬 Built ${filters.length} filter objects`)
  
  return filters
}

/**
 * Build text overlay filter
 */
function buildTextOverlay(
  text: string,
  options: {
    x: number
    y: number
    fontFamily: string
    fontSize: number
    fontColor: string
  }
): string {
  // Escape text properly for FFmpeg drawtext filter
  const escapedText = text
    .replace(/\\/g, '\\\\')  // Escape backslashes first
    .replace(/'/g, "'\\\\\\''")  // Escape single quotes for shell
    .replace(/:/g, '\\:')     // Escape colons
    .replace(/\n/g, ' ')      // Replace newlines with spaces

  const fontFilePath = getFontFilePath(options.fontFamily)
  
  // Use different quoting strategy - escape the fontfile path properly
  const escapedFontPath = fontFilePath ? fontFilePath.replace(/\\/g, '/').replace(/:/g, '\\:') : ''
  
  let filter = `drawtext=text='${escapedText}'`
  
  if (escapedFontPath) {
    filter += `:fontfile='${escapedFontPath}'`
  } else {
    filter += `:font='${options.fontFamily}'`
  }

  filter += `:fontsize=${options.fontSize}`
  filter += `:fontcolor=${options.fontColor}`
  filter += `:x=${options.x}`
  filter += `:y=${options.y}`

  return filter
}

/**
 * Convert hex color to RGB format for FFmpeg
 */
function hexToRgb(hex: string): string {
  // Remove # if present
  hex = hex.replace('#', '')
  
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  
  return `0x${hex}`
}

/**
 * Helper to create text replacements from detected texts
 */
export function createReplacementsFromDetections(
  detectedTexts: DetectedText[],
  replacementMap: Map<string, string>
): TextReplacement[] {
  const replacements: TextReplacement[] = []

  for (const detected of detectedTexts) {
    const newText = replacementMap.get(detected.text)
    if (newText !== undefined) {
      replacements.push({
        originalText: detected.text,
        newText,
        boundingBox: detected.boundingBox,
        timestamp: detected.timestamp,
        startTime: detected.startTime,  // Include time range
        endTime: detected.endTime        // Include time range
      })
    }
  }

  return replacements
}
