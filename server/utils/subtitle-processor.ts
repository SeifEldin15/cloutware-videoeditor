import { PassThrough } from 'stream'
import ffmpeg from './ffmpeg'
import os from 'os'
import { writeFileSync, unlinkSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { processVideoWithSubtitlesFile } from './captioning'
import { generateAdvancedASSFile, parseSRT, type SubtitleSegment, type GirlbossStyle } from './subtitleUtils'
import type { CaptionOptions, VideoProcessingOptions } from './validation-schemas'

const availableCpuCores = os.cpus().length
const optimalThreads = Math.max(2, Math.floor(availableCpuCores * 0.75)).toString()

export class SubtitleProcessor {
  static async processBasic(url: string, caption: CaptionOptions): Promise<PassThrough> {
    if (!caption?.srtContent) {
      throw new Error('SRT content is required for basic subtitle processing')
    }

    return processVideoWithSubtitlesFile(url, caption.srtContent, {
      fontSize: caption.fontSize,
      fontColor: caption.fontColor,
      fontFamily: caption.fontFamily,
      fontStyle: caption.fontStyle,
      subtitlePosition: caption.subtitlePosition,
      horizontalAlignment: caption.horizontalAlignment,
      verticalMargin: caption.verticalMargin,
      showBackground: caption.showBackground,
      backgroundColor: caption.backgroundColor
    })
  }

  static async processAdvanced(
    url: string,
    caption: CaptionOptions,
    videoOptions?: VideoProcessingOptions
  ): Promise<PassThrough> {
    if (!caption?.srtContent) {
      throw new Error('SRT content is required for advanced subtitle processing')
    }

    const styleOptions = this.buildStyleOptions(caption)
    
    return this.processVideoWithAdvancedSubtitles(
      url,
      caption.srtContent,
      styleOptions,
      videoOptions
    )
  }

  private static buildStyleOptions(caption: CaptionOptions) {
    return {
      fontSize: caption?.fontSize,
      fontFamily: caption?.fontFamily,
      textAlign: caption?.horizontalAlignment,
      subtitleStyle: caption?.subtitleStyle,
      // Girlboss options
      girlbossColor: caption?.girlbossColor,
      girlbossShadowStrength: caption?.girlbossShadowStrength,
      girlbossAnimation: caption?.girlbossAnimation,
      girlbossVerticalPosition: caption?.girlbossVerticalPosition,
      // Hormozi options
      hormoziColors: caption?.hormoziColors,
      hormoziShadowStrength: caption?.hormoziShadowStrength,
      hormoziAnimation: caption?.hormoziAnimation,
      hormoziVerticalPosition: caption?.hormoziVerticalPosition,
      // ThinToBold options
      thinToBoldColor: caption?.thinToBoldColor,
      thinToBoldShadowStrength: caption?.thinToBoldShadowStrength,
      thinToBoldAnimation: caption?.thinToBoldAnimation,
      thinToBoldVerticalPosition: caption?.thinToBoldVerticalPosition,
      // WavyColors options
      wavyColorsOutlineWidth: caption?.wavyColorsOutlineWidth,
      wavyColorsVerticalPosition: caption?.wavyColorsVerticalPosition
    }
  }

  private static async processVideoWithAdvancedSubtitles(
    inputUrl: string,
    srtContent: string,
    styleOptions: ReturnType<SubtitleProcessor['buildStyleOptions']>,
    videoOptions?: VideoProcessingOptions
  ): Promise<PassThrough> {
    console.log(`Processing video with ${styleOptions.subtitleStyle} style subtitles...`)

    return new Promise<PassThrough>((resolve, reject) => {
      let tempAssFile: string | null = null

      try {
        const subtitleSegments = parseSRT(srtContent)

        if (subtitleSegments.length === 0) {
          throw new Error('No valid subtitle segments found in SRT content')
        }

        let assContent = ''

        if (styleOptions.subtitleStyle === 'girlboss') {
          const girlbossStyle: GirlbossStyle & {
            fontSize?: number
            fontFamily?: string
            textAlign?: string
          } = {
            color: styleOptions.girlbossColor || '#F361D8',
            shadowStrength: styleOptions.girlbossShadowStrength || 1,
            animation2: styleOptions.girlbossAnimation === 'shake' ? 'Shake' : 'none',
            verticalPosition: styleOptions.girlbossVerticalPosition || 15,
            fontSize: styleOptions.fontSize || 50,
            fontFamily: styleOptions.fontFamily || 'Arial',
            textAlign: styleOptions.textAlign || 'center'
          }
          assContent = generateAdvancedASSFile(subtitleSegments, girlbossStyle, 'girlboss')

        } else if (styleOptions.subtitleStyle === 'hormozi') {
          const hormoziStyle: GirlbossStyle & {
            fontSize?: number
            fontFamily?: string
            textAlign?: string
            alternateColors?: string[]
          } = {
            shadowStrength: styleOptions.hormoziShadowStrength || 3,
            animation2: styleOptions.hormoziAnimation === 'shake' ? 'Shake' : 'none',
            verticalPosition: styleOptions.hormoziVerticalPosition || 15,
            fontSize: styleOptions.fontSize || 50,
            fontFamily: styleOptions.fontFamily || 'Arial',
            textAlign: styleOptions.textAlign || 'center',
            alternateColors: styleOptions.hormoziColors || ['#0BF431', '#2121FF', '#1DE0FE', '#FFFF00']
          }
          assContent = generateAdvancedASSFile(subtitleSegments, hormoziStyle, 'hormozi')

        } else if (styleOptions.subtitleStyle === 'thintobold') {
          const thinToBoldStyle: GirlbossStyle & {
            fontSize?: number
            fontFamily?: string
            textAlign?: string
          } = {
            color: styleOptions.thinToBoldColor || '#FFFFFF',
            shadowStrength: styleOptions.thinToBoldShadowStrength || 1,
            animation2: styleOptions.thinToBoldAnimation === 'shake' ? 'Shake' : 'none',
            verticalPosition: styleOptions.thinToBoldVerticalPosition || 15,
            fontSize: styleOptions.fontSize || 50,
            fontFamily: styleOptions.fontFamily || 'Montserrat',
            textAlign: styleOptions.textAlign || 'center'
          }
          assContent = generateAdvancedASSFile(subtitleSegments, thinToBoldStyle, 'thintobold')

        } else if (styleOptions.subtitleStyle === 'wavycolors') {
          const wavyStyle: GirlbossStyle & {
            fontSize?: number
            fontFamily?: string
            textAlign?: string
            textOutlineWidth?: number
          } = {
            verticalPosition: styleOptions.wavyColorsVerticalPosition || 15,
            fontSize: styleOptions.fontSize || 50,
            fontFamily: styleOptions.fontFamily || 'Arial',
            textAlign: styleOptions.textAlign || 'center',
            textOutlineWidth: styleOptions.wavyColorsOutlineWidth || 2
          }
          assContent = generateAdvancedASSFile(subtitleSegments, wavyStyle, 'wavycolors')
        }

        tempAssFile = join(tmpdir(), `subtitle_${Date.now()}.ass`)
        writeFileSync(tempAssFile, assContent)

        const outputStream = new PassThrough({ highWaterMark: 4 * 1024 * 1024 })

        let commandOutput = ''
        const ffmpegCommand = ffmpeg(inputUrl)

        ffmpegCommand.inputOptions([
          '-protocol_whitelist', 'file,http,https,tcp,tls',
          '-reconnect', '1',
          '-reconnect_streamed', '1',
          '-analyzeduration', '10000000',
          '-probesize', '10000000',
          '-thread_queue_size', '512',
          '-hwaccel', 'auto',
          '-threads', optimalThreads
        ])

        const advancedOptions = videoOptions ? this.buildAdvancedProcessingOptions(videoOptions) : []

        let baseVideoFilter = ''
        const vfIndex = advancedOptions.findIndex(opt => opt === '-vf')
        if (vfIndex !== -1 && vfIndex + 1 < advancedOptions.length) {
          baseVideoFilter = advancedOptions[vfIndex + 1]
        }

        const escapedPath = tempAssFile.replace(/\\/g, '/').replace(/:/g, '\\:')
        const subtitleFilter = `subtitles=filename='${escapedPath}'`

        const videoFilter = baseVideoFilter
          ? `${baseVideoFilter},${subtitleFilter}`
          : subtitleFilter

        const outputOptions = ['-vf', videoFilter]

        const afIndex = advancedOptions.findIndex(opt => opt === '-af')
        const filterComplexIndex = advancedOptions.findIndex(opt => opt === '-filter_complex')
        const mapOptions = advancedOptions.filter((opt, idx) =>
          advancedOptions[idx - 1] === '-map' || opt === '-map'
        )

        if (afIndex !== -1 && afIndex + 1 < advancedOptions.length) {
          outputOptions.push('-af', advancedOptions[afIndex + 1])
        } else if (filterComplexIndex !== -1 && filterComplexIndex + 1 < advancedOptions.length) {
          outputOptions.push('-filter_complex', advancedOptions[filterComplexIndex + 1])
          for (let i = 0; i < mapOptions.length; i += 2) {
            if (mapOptions[i] === '-map' && mapOptions[i + 1]) {
              outputOptions.push('-map', mapOptions[i + 1])
            }
          }
        }

        const codecOptions = advancedOptions.filter((opt, idx) =>
          opt === '-c:v' || opt === '-c:a' || opt === '-crf' || opt === '-b:a' ||
          (advancedOptions[idx - 1] === '-c:v') || (advancedOptions[idx - 1] === '-c:a') ||
          (advancedOptions[idx - 1] === '-crf') || (advancedOptions[idx - 1] === '-b:a')
        )

        if (codecOptions.length > 0) {
          outputOptions.push(...codecOptions)
        } else {
          outputOptions.push('-c:v', 'libx264', '-preset', 'veryfast', '-crf', '23', '-c:a', 'aac', '-b:a', '128k')
        }

        outputOptions.push('-threads', optimalThreads, '-pix_fmt', 'yuv420p', '-f', 'mpegts')

        ffmpegCommand.outputOptions(outputOptions)
          .on('start', (commandLine: string) => {
            console.log('Advanced subtitle FFmpeg started:', commandLine)
          })
          .on('progress', (progress: any) => {
            if (progress.percent) {
              console.log(`Advanced subtitle processing: ${progress.percent.toFixed(2)}%`)
            }
          })
          .on('stderr', (stderrLine: string) => {
            commandOutput += stderrLine + '\n'
            console.log('Advanced subtitle FFmpeg stderr:', stderrLine)
          })
          .on('error', (err: Error) => {
            console.error('Advanced subtitle FFmpeg error:', err)
            console.error('Command output:', commandOutput)
            this.cleanupTempFile(tempAssFile)
            reject(new Error(`FFmpeg error: ${err.message}\nCommand output: ${commandOutput}`))
          })
          .on('end', () => {
            console.log('Advanced subtitle FFmpeg process ended')
            this.cleanupTempFile(tempAssFile)
          })

        ffmpegCommand.pipe(outputStream, { end: true })

        resolve(outputStream)

      } catch (error) {
        console.error('Advanced subtitle processing error:', error)
        this.cleanupTempFile(tempAssFile)
        reject(error)
      }
    })
  }

  private static buildAdvancedProcessingOptions(options: VideoProcessingOptions): string[] {
    const outputOptions = []
    const timestamp = new Date().getTime().toString()

    outputOptions.push('-map_metadata', '-1')
    outputOptions.push('-fflags', '+bitexact')

    const randomTime = new Date(Math.floor(Math.random() * 1000000000000)).toISOString()
    outputOptions.push('-metadata', `title=processed_${timestamp}`)
    outputOptions.push('-metadata', `comment=modified_${timestamp.slice(-6)}`)
    outputOptions.push('-metadata', `creation_time=${randomTime}`)
    outputOptions.push('-metadata', `encoder=custom_${timestamp.slice(-4)}`)

    if (options?.backgroundAudio) {
      outputOptions.push('-i', 'audio.mp3')
    }

    const videoFilter = [
      'crop=in_w-10:in_h-10:5:5,scale=708:1260:flags=fast_bilinear',
      'hue=s=1.05,eq=gamma=1.05:contrast=1.05:brightness=0.05:saturation=1.05',
      'setpts=0.92*PTS',
      'rotate=0.25*PI/180:bilinear=0',
      'pad=iw+2:ih+2:1:1:black@0.8',
      'noise=alls=1:allf=t'
    ].join(',')

    outputOptions.push('-vf', videoFilter)

    let audioFilter = [
      'volume=0.8,atempo=1.09',
      'equalizer=f=1000:width=200:g=-1'
    ].join(',')

    if (options?.backgroundAudio) {
      const afIndex = outputOptions.indexOf('-af')
      if (afIndex !== -1) {
        outputOptions.splice(afIndex, 2)
      }

      const bgVolume = options.backgroundAudioVolume || 0.2

      outputOptions.push('-filter_complex',
        `[0:a]${audioFilter}[a0]; [1:a]volume=${bgVolume}[a1]; [a0][a1]amix=inputs=2:duration=first[aout]`)

      outputOptions.push('-map', '0:v', '-map', '[aout]')
    } else {
      outputOptions.push('-af', audioFilter)
    }

    outputOptions.push('-c:v', 'libx264')
    outputOptions.push('-preset', 'veryfast')
    outputOptions.push('-crf', '28')
    outputOptions.push('-threads', optimalThreads)
    outputOptions.push('-pix_fmt', 'yuv420p')
    outputOptions.push('-r', '29.97')
    outputOptions.push('-c:a', 'aac')
    outputOptions.push('-b:a', '128k')
    outputOptions.push('-max_muxing_queue_size', '4096')
    outputOptions.push('-movflags', '+faststart')
    outputOptions.push('-tune', 'zerolatency')
    outputOptions.push('-f', 'mp4')

    return outputOptions
  }

  private static cleanupTempFile(tempFile: string | null): void {
    if (tempFile) {
      try {
        unlinkSync(tempFile)
      } catch (error) {
        console.warn('Failed to cleanup temp file:', tempFile, error)
      }
    }
  }
} 