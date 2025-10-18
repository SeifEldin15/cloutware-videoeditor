import { getInitializedFfmpeg } from './ffmpeg'
import { PassThrough } from 'stream'
import type { DetectedText } from './text-detection-coords'
import { getFontFilePath } from './subtitleUtils'

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
}

export interface ReplaceTextOptions {
  textReplacements: TextReplacement[]
  outputName?: string
  fontFamily?: string
  fontSize?: number
  fontColor?: string
  backgroundColor?: string
  backgroundOpacity?: number
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
    backgroundOpacity = 1.0
  } = options

  console.log(`🎨 Replacing ${textReplacements.length} text region(s) in video`)

  return new Promise<PassThrough>(async (resolve, reject) => {
    try {
      const outputStream = new PassThrough({ highWaterMark: 4 * 1024 * 1024 })
      
      const ffmpeg = await getInitializedFfmpeg()
      let command = ffmpeg(videoUrl)

      // Input options
      command.inputOptions([
        '-protocol_whitelist', 'file,http,https,tcp,tls',
        '-reconnect', '1',
        '-reconnect_streamed', '1',
        '-reconnect_delay_max', '5'
      ])

      // Build video filter for all replacements
      const videoFilter = buildTextReplacementFilter(textReplacements, {
        fontFamily,
        fontSize,
        fontColor,
        backgroundColor,
        backgroundOpacity
      })

      console.log('📝 Applying text replacements...')
      console.log(`📐 Video filter: ${videoFilter}`)
      console.log(`📊 Replacements:`, textReplacements)

      command
        .outputOptions([
          '-vf', videoFilter,
          '-c:v', 'libx264',
          '-preset', 'medium',
          '-crf', '23',
          '-c:a', 'copy',
          '-movflags', 'frag_keyframe+empty_moov+faststart',
          '-f', 'mp4'
        ])
        .on('start', (commandLine: string) => {
          console.log(`${outputName} FFmpeg started`)
        })
        .on('progress', (progress: any) => {
          if (progress.percent) {
            console.log(`${outputName} Processing: ${progress.percent.toFixed(2)}%`)
          }
        })
        .on('end', () => {
          console.log(`✅ ${outputName} completed successfully`)
          outputStream.end()
        })
        .on('error', (error: any) => {
          console.error(`❌ ${outputName} error:`, error)
          reject(new Error(`Video processing failed: ${error.message}`))
        })

      command.pipe(outputStream, { end: true })
      resolve(outputStream)

    } catch (error) {
      console.error('Text replacement error:', error)
      reject(error)
    }
  })
}

/**
 * Build FFmpeg filter string for text replacements
 */
function buildTextReplacementFilter(
  replacements: TextReplacement[],
  style: {
    fontFamily: string
    fontSize: number
    fontColor: string
    backgroundColor: string
    backgroundOpacity: number
  }
): string {
  const filters: string[] = []

  // Ensure even dimensions
  filters.push('scale=trunc(iw/2)*2:trunc(ih/2)*2')

  // For each replacement, draw white rectangle then text
  for (const replacement of replacements) {
    const { boundingBox, newText, timestamp } = replacement
    
    // Add padding to bounding box
    const padding = 10
    const x = Math.max(0, boundingBox.x - padding)
    const y = Math.max(0, boundingBox.y - padding)
    const width = boundingBox.width + (padding * 2)
    const height = boundingBox.height + (padding * 2)

    // Convert hex color to RGB for drawbox
    const bgColor = hexToRgb(style.backgroundColor)
    const opacity = style.backgroundOpacity

    // Draw white/colored rectangle (background)
    const boxFilter = `drawbox=x=${x}:y=${y}:w=${width}:h=${height}:color=${bgColor}@${opacity}:t=fill`
    filters.push(boxFilter)

    // Draw text on top
    const textFilter = buildTextOverlay(newText, {
      x: x + padding,
      y: y + (height / 2),
      fontFamily: style.fontFamily,
      fontSize: style.fontSize,
      fontColor: style.fontColor
    })
    filters.push(textFilter)
  }

  return filters.join(',')
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
  const escapedText = text
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/:/g, '\\:')
    .replace(/\n/g, ' ')

  const fontFilePath = getFontFilePath(options.fontFamily)
  
  let filter = `drawtext=text='${escapedText}'`
  
  if (fontFilePath) {
    filter += `:fontfile='${fontFilePath}'`
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
        timestamp: detected.timestamp
      })
    }
  }

  return replacements
}
