import { PassThrough } from 'stream'
import ffmpeg from './ffmpeg'
import os from 'os'
import type { TextReplacementOptions } from './validation-schemas'
import { getFontFilePath } from './subtitleUtils'

const availableCpuCores = os.cpus().length
// Keep filtergraph single-threaded for stability
const optimalThreads = '1'

export class TextReplacementProcessor {
  static async process(
    inputUrl: string,
    textReplacements: TextReplacementOptions['textReplacements'],
    options?: TextReplacementOptions['options'],
    outputName?: string
  ): Promise<PassThrough> {
    console.log(`Processing video with ${textReplacements.length} text replacement(s)...`)
    
    return this.processWithFFmpeg(inputUrl, {
      name: `${outputName || 'text_replaced_video'}.mp4`,
      textReplacements,
      options,
      contentType: 'video/mp4'
    })
  }

  private static async processWithFFmpeg(
    inputUrl: string,
    config: {
      textReplacements: TextReplacementOptions['textReplacements']
      options?: TextReplacementOptions['options']
      name: string
      contentType: string
    }
  ): Promise<PassThrough> {
    console.log(`Processing ${config.name}...`)

    return new Promise<PassThrough>((resolve, reject) => {
      try {
        const outputStream = new PassThrough({ highWaterMark: 4 * 1024 * 1024 })

        let commandOutput = ''
        let ffmpegCommand = ffmpeg(inputUrl)

        ffmpegCommand.inputOptions([
          '-protocol_whitelist', 'file,http,https,tcp,tls',
          '-reconnect', '1',
          '-reconnect_streamed', '1',
          '-analyzeduration', '10000000',
          '-probesize', '10000000',
          '-thread_queue_size', '512',
          '-hwaccel', 'none',
          '-threads', optimalThreads,
          '-filter_threads', '1'
        ])

        const videoFilters = this.buildVideoFilters(config.textReplacements, config.options)
        
        ffmpegCommand
          .outputOptions([
            '-vf', videoFilters,
            '-c:v', 'libx264',
            '-preset', 'veryfast',
            '-crf', '23',
            '-threads', optimalThreads,
            '-pix_fmt', 'yuv420p',
            '-c:a', 'aac',
            '-b:a', '128k',
            '-max_muxing_queue_size', '4096',
            '-f', 'mpegts'
          ])
          .on('start', (commandLine: string) => {
            console.log(`${config.name} FFmpeg started:`, commandLine)
          })
          .on('progress', (progress: any) => {
            if (progress.percent) {
              console.log(`${config.name} Processing: ${progress.percent.toFixed(2)}%`)
            }
          })
          .on('stderr', (stderrLine: string) => {
            commandOutput += stderrLine + '\n'
            console.log(`${config.name} FFmpeg stderr:`, stderrLine)
          })
          .on('error', (err: Error) => {
            console.error(`${config.name} FFmpeg error:`, err)
            console.error(`${config.name} Command output:`, commandOutput)
            reject(new Error(`FFmpeg error: ${err.message}\nCommand output: ${commandOutput}`))
          })
          .on('end', () => {
            console.log(`${config.name} FFmpeg process ended`)
          })

        ffmpegCommand.pipe(outputStream, { end: true })
        resolve(outputStream)
        
      } catch (error) {
        console.error(`${config.name} processing error:`, error)
        reject(error)
      }
    })
  }

  private static buildVideoFilters(
    textReplacements: TextReplacementOptions['textReplacements'],
    options?: TextReplacementOptions['options']
  ): string {
    const filters: string[] = []
    
    // Always ensure even dimensions BEFORE overlays
    filters.push("scale=trunc(iw/2)*2:trunc(ih/2)*2")

    if (options) {
      if (options.speedFactor && options.speedFactor !== 1) {
        const ptsValue = 1 / options.speedFactor
        filters.push(`setpts=${ptsValue}*PTS`)
      }
      
      if (options.zoomFactor && options.zoomFactor !== 1) {
        filters.push(`scale=iw*${options.zoomFactor}:ih*${options.zoomFactor}`)
      }
      
      if (options.saturationFactor && options.saturationFactor !== 1) {
        filters.push(`hue=s=${options.saturationFactor}`)
      }
      
      if (options.lightness && options.lightness !== 0) {
        filters.push(`eq=brightness=${options.lightness}`)
      }
    }

    textReplacements.forEach((replacement: TextReplacementOptions['textReplacements'][0], index: number) => {
      const textFilter = this.buildTextFilter(replacement)
      filters.push(textFilter)
    })

    return filters.join(',')
  }

  private static calculateRegionPosition(region: TextReplacementOptions['textReplacements'][0]['region']) {
    return {
      x: region.x,
      y: region.y,
      width: region.width,
      height: region.height,
      centerHorizontally: region.centerHorizontally ?? false
    }
  }

    private static buildTextFilter(replacement: TextReplacementOptions['textReplacements'][0]): string {
    const { region, text, textStyle } = replacement
    const style = textStyle || {}
    
    let xPosition: string
    let yPosition: string
    
    if (region.centerHorizontally || region.x === undefined) {
      xPosition = '(w-tw)/2'
    } else {
      const regionX = region.x ?? 0
      switch (style.alignment || 'center') {
        case 'left':
          xPosition = `${regionX + 10}`
          break
        case 'right':
          xPosition = `${regionX + region.width - 10}-tw`
          break
        case 'center':
        default:
          xPosition = `${regionX + region.width/2}-tw/2`
          break
      }
    }
    
    switch (style.verticalAlignment || 'center') {
      case 'top':
        yPosition = `${region.y + 10}`
        break
      case 'bottom':
        yPosition = `${region.y + region.height - 10}-th`
        break
      case 'center':
      default:
        yPosition = `${region.y + region.height/2}-th/2`
        break
    }

    const escapedText = text
      .replace(/'/g, "\\'")
      .replace(/"/g, '\\"')
      .replace(/:/g, '\\:')
      .replace(/\n/g, ' ')

    // Prefer a concrete font file when available (Linux-safe).
    // Falls back to font family if no TTF path is known.
    let fontSpec = style.fontFamily || 'Arial'
    const fontFilePath = getFontFilePath(fontSpec)  // uses your existing map in subtitle-utils

    let drawTextFilter = `drawtext=text='${escapedText}'`
    if (fontFilePath) {
      drawTextFilter += `:fontfile='${fontFilePath.replace(/'/g, "'\\''")}'`
    } else {
      // Family fallback (less stable on Linux)
      if (style.fontWeight === 'bold') fontSpec += ' Bold'
      if (style.fontStyle === 'italic') fontSpec += ' Italic'
      drawTextFilter += `:font='${fontSpec}'`
    }
    drawTextFilter += `:fontsize=${style.fontSize || 24}`
    drawTextFilter += `:fontcolor=${style.fontColor || '#FFFFFF'}`
    drawTextFilter += `:x=${xPosition}`
    drawTextFilter += `:y=${yPosition}`

    if (replacement.background?.color !== 'transparent') {
      const bgColor = replacement.background?.color || 'black'
      const opacity = replacement.background?.opacity || 1
      drawTextFilter += `:box=1:boxcolor=${bgColor}@${opacity}`
      
      const padding = 10
      drawTextFilter += `:boxborderw=${padding}`
    }

    if (style.outlineWidth && style.outlineWidth > 0) {
      drawTextFilter += `:borderw=${style.outlineWidth}`
      drawTextFilter += `:bordercolor=${style.outlineColor || '#000000'}`
    }

    if (style.shadowOffsetX || style.shadowOffsetY) {
      drawTextFilter += `:shadowx=${style.shadowOffsetX || 0}`
      drawTextFilter += `:shadowy=${style.shadowOffsetY || 0}`
      drawTextFilter += `:shadowcolor=${style.shadowColor || '#000000'}`
    }

    return drawTextFilter
  }
} 