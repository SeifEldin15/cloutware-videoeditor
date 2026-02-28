import { PassThrough } from 'stream'
import { getInitializedFfmpeg } from './ffmpeg'
import os from 'os'
import type { VideoProcessingOptions } from './validation-schemas'
import { getAdaptiveQuality, getQualityConfig } from './quality-config'

const availableCpuCores = os.cpus().length
const optimalThreads = Math.max(2, Math.floor(availableCpuCores * 0.75)).toString()

export class VideoProcessor {
  static async process(
    inputUrl: string,
    format: string,
    options?: VideoProcessingOptions,
    outputName?: string
  ): Promise<PassThrough> {
    const outputConfig = this.getOutputOptionsForFormat(format, options)
    
    // Add trimming options if present
    const inputOptions = [...(outputConfig.inputOptions || [])]
    
    if (options?.trimStart !== undefined && options.trimStart > 0) {
      inputOptions.push('-ss', options.trimStart.toString())
    }
    
    if (options?.trimEnd !== undefined && options.trimEnd > 0) {
      // When using input seeking (-ss before -i), the timestamp resets to 0.
      // So we must use -t (duration) or -to (position). 
      // If we use -ss as input option, -to refers to the position relative to the NEW start (0).
      // So -to would be equivalent to duration.
      // However, it's safer to calculate duration explicitly.
      const duration = options.trimEnd - (options.trimStart || 0)
      if (duration > 0) {
          inputOptions.push('-t', duration.toString())
      }
    }

    return this.processWithFFmpeg(inputUrl, {
      name: `${outputName}.${outputConfig.fileExtension}`,
      outputOptions: outputConfig.outputOptions,
      inputOptions: inputOptions,
      contentType: outputConfig.contentType
    })
  }

  private static async processWithFFmpeg(
    inputUrl: string,
    options: {
      outputOptions: string[]
      name: string
      contentType: string
      inputOptions?: string[]
    }
  ): Promise<PassThrough> {
    console.log(`Processing ${options.name}...`)

    return new Promise<PassThrough>(async (resolve, reject) => {
      try {
        const outputStream = new PassThrough({ highWaterMark: 4 * 1024 * 1024 })

        // Download video to temp file if it's a URL (FFmpeg may not support HTTPS properly)
        let inputPath = inputUrl
        let tempFilePath: string | null = null
        
        if (inputUrl.startsWith('http://') || inputUrl.startsWith('https://')) {
          const { writeFileSync, unlinkSync } = await import('fs')
          const { tmpdir } = await import('os')
          const { join } = await import('path')
          
          tempFilePath = join(tmpdir(), `video-proc-${Date.now()}.mp4`)
          console.log(`📥 Downloading video from URL to temp file...`)
          
          try {
            const response = await fetch(inputUrl)
            if (!response.ok) {
              throw new Error(`Failed to download video: ${response.status}`)
            }
            const buffer = Buffer.from(await response.arrayBuffer())
            writeFileSync(tempFilePath, buffer)
            inputPath = tempFilePath
            console.log(`✅ Video downloaded: ${buffer.length} bytes`)
          } catch (downloadError) {
            console.error('❌ Failed to download video:', downloadError)
            throw downloadError
          }
        }

        let commandOutput = ''
        const ffmpeg = await getInitializedFfmpeg()
        let ffmpegCommand = ffmpeg(inputPath)

        // Build input options - only use reconnect for network streams, not local files
        const inputOpts = [
          '-analyzeduration', '10000000',
          '-probesize', '10000000',
          '-thread_queue_size', '512',
          '-hwaccel', 'auto',
          '-threads', optimalThreads
        ]
        
        // Only add protocol whitelist and reconnect for URLs (not for local temp files)
        if (!tempFilePath) {
          inputOpts.unshift(
            '-protocol_whitelist', 'file,http,https,tcp,tls',
            '-reconnect', '1',
            '-reconnect_streamed', '1'
          )
        }

        ffmpegCommand.inputOptions(inputOpts)

        if (options.inputOptions?.length) {
          ffmpegCommand.inputOptions(options.inputOptions)
        }

        const inputs: string[] = []
        const cleanedOutputOptions: string[] = []

        let hasFormatOption = false
        for (let i = 0; i < options.outputOptions.length; i++) {
          if (options.outputOptions[i] === '-f' && i + 1 < options.outputOptions.length) {
            hasFormatOption = true
            if (options.outputOptions[i + 1] === 'mp4') {
              cleanedOutputOptions.push('-f')
              cleanedOutputOptions.push('mpegts')
              i++
            } else {
              cleanedOutputOptions.push(options.outputOptions[i])
              cleanedOutputOptions.push(options.outputOptions[i + 1])
              i++
            }
          } else if (options.outputOptions[i] === '-movflags') {
            i++
          } else if (options.outputOptions[i] === '-i' && i + 1 < options.outputOptions.length) {
            inputs.push(options.outputOptions[i + 1])
            i++
          } else if (options.outputOptions[i] === '-hwaccel') {
            i++
          } else {
            cleanedOutputOptions.push(options.outputOptions[i])
          }
        }

        if (!hasFormatOption) {
          cleanedOutputOptions.push('-f')
          cleanedOutputOptions.push('mpegts')
        }

        inputs.forEach(input => {
          ffmpegCommand = ffmpegCommand.input(input)
        })

        // Cleanup temp file function
        const cleanupTempFile = () => {
          if (tempFilePath) {
            import('fs').then(fs => {
              try { fs.unlinkSync(tempFilePath!) } catch {}
            })
          }
        }

        ffmpegCommand
          .outputOptions(cleanedOutputOptions)
          .on('start', (commandLine: string) => {
            console.log(`${options.name} FFmpeg started:`, commandLine)
          })
          .on('progress', (progress: any) => {
            if (progress.percent) {
              console.log(`${options.name} Processing: ${progress.percent.toFixed(2)}%`)
            }
          })
          .on('stderr', (stderrLine: string) => {
            commandOutput += stderrLine + '\n'
            console.log(`${options.name} FFmpeg stderr:`, stderrLine)
          })
          .on('error', (err: Error) => {
            console.error(`${options.name} FFmpeg error:`, err)
            console.error(`${options.name} Command output:`, commandOutput)
            cleanupTempFile()
            reject(new Error(`FFmpeg error: ${err.message}\nCommand output: ${commandOutput}`))
          })
          .on('end', () => {
            console.log(`${options.name} FFmpeg process ended`)
            cleanupTempFile()
          })

        ffmpegCommand.outputOptions(['-preset', 'veryfast', '-threads', optimalThreads])
        ffmpegCommand.pipe(outputStream, { end: true })

        resolve(outputStream)
      } catch (error) {
        console.error(`${options.name} processing error:`, error)
        reject(error)
      }
    })
  }

  private static getOutputOptionsForFormat(
    format: string,
    options?: VideoProcessingOptions
  ): {
    outputOptions: string[]
    inputOptions?: string[]
    contentType: string
    fileExtension: string
  } {
    switch (format) {
      case 'gif':
        return {
          inputOptions: ['-t', '3', '-threads', optimalThreads],
          outputOptions: ['-vf', 'fps=10,scale=320:-1:flags=lanczos', '-f', 'gif'],
          contentType: 'image/gif',
          fileExtension: 'gif'
        }
      case 'png':
        return {
          inputOptions: ['-ss', '1'],
          outputOptions: ['-vframes', '1', '-f', 'image2', '-vcodec', 'png'],
          contentType: 'image/png',
          fileExtension: 'png'
        }
      case 'mp4':
      default:
        return {
          outputOptions: this.buildAdvancedProcessingOptions(options),
          contentType: 'video/mp4',
          fileExtension: 'mp4'
        }
    }
  }

  private static buildAdvancedProcessingOptions(options?: VideoProcessingOptions): string[] {
    const outputOptions = []
    const timestamp = new Date().getTime().toString()

    console.log(`🎬 VideoProcessor building options with:`, JSON.stringify(options, null, 2))

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

    // Build dynamic video filter based on actual options
    const videoFilters: string[] = []

    // Speed adjustment (setpts must come first)
    if (options?.speedFactor && options.speedFactor !== 1) {
      const ptsValue = 1 / options.speedFactor
      videoFilters.push(`setpts=${ptsValue}*PTS`)
    }
    
    // Horizontal flip
    if (options?.visibleChanges?.horizontalFlip) {
      videoFilters.push('hflip')
    }
    
    // Source Cropping
    // @ts-ignore
    if ((options?.cropVertical || 0) > 0 || (options?.cropHorizontal || 0) > 0) {
      // @ts-ignore
      const cropH = options.cropHorizontal || 0
      // @ts-ignore
      const cropV = options.cropVertical || 0
      
      const w = `iw*(1-(${cropH}/100)*2)`
      const h = `ih*(1-(${cropV}/100)*2)`
      const x = `iw*(${cropH}/100)`
      const y = `ih*(${cropV}/100)`
      videoFilters.push(`crop=w=${w}:h=${h}:x=${x}:y=${y}`)
    }
    
    // Zoom/Scale Logic
    const Z = options?.zoomFactor ?? 1
    // @ts-ignore
    const cH = (options?.cropHorizontal || 0) / 100
    // @ts-ignore
    const cV = (options?.cropVertical || 0) / 100
    
    // Scale widths
    const scaleW = (1 - 2 * cH) * Z
    const scaleH = (1 - 2 * cV) * Z

    // 1. Scale layer
    if (Z !== 1) {
      videoFilters.push(`scale=iw*${Z}:ih*${Z}`)
    }

    // 2. Crop bounds if larger than original size
    if (scaleW > 1 || scaleH > 1) {
      const mathS1 = Math.max(1, scaleW)
      const mathS2 = Math.max(1, scaleH)
      videoFilters.push(`crop=iw/${mathS1}:ih/${mathS2}`)
    }

    // 3. Pad bounds if smaller than original size
    if (scaleW < 1 || scaleH < 1) {
      const mathP1 = Math.min(1, scaleW)
      const mathP2 = Math.min(1, scaleH)
      // @ts-ignore
      const bg = options?.backgroundColor ? options.backgroundColor.replace('#', '0x') : '0x000000'
      videoFilters.push(`pad=${mathP1 < 1 ? `iw/${mathP1}` : 'iw'}:${mathP2 < 1 ? `ih/${mathP2}` : 'ih'}:(ow-iw)/2:(oh-ih)/2:${bg}`)
    }
    
    // Rotation
    if (options?.rotation && options.rotation !== 0) {
      const radians = options.rotation * Math.PI / 180
      videoFilters.push(`rotate=${radians}:fillcolor=black:bilinear=1`)
    }
    
    // Saturation using hue filter
    if (options?.saturationFactor && options.saturationFactor !== 1) {
      videoFilters.push(`hue=s=${options.saturationFactor}`)
    }
    
    // Combine eq filters (brightness, contrast, lightness)
    const eqParts: string[] = []
    if (options?.brightness && options.brightness !== 0) {
      eqParts.push(`brightness=${options.brightness}`)
    }
    if (options?.contrast && options.contrast !== 1) {
      eqParts.push(`contrast=${options.contrast}`)
    }
    if (options?.lightness && options.lightness !== 0) {
      const gamma = 1 - options.lightness
      eqParts.push(`gamma=${gamma}`)
    }
    if (eqParts.length > 0) {
      videoFilters.push(`eq=${eqParts.join(':')}`)
    }
    
    // Blur
    if (options?.blur && options.blur > 0) {
      const blurRadius = Math.min(options.blur, 10)
      videoFilters.push(`boxblur=${blurRadius}:1`)
    }
    
    // Sharpen
    if (options?.sharpen && options.sharpen > 0) {
      const sharpenAmount = options.sharpen / 5
      videoFilters.push(`unsharp=5:5:${sharpenAmount}:5:5:0`)
    }

    // Anti-detection effects
    if (options?.antiDetection?.pixelShift) {
      videoFilters.push('crop=in_w-2:in_h-2:1:1')
    }
    
    if (options?.antiDetection?.microCrop) {
      videoFilters.push('crop=in_w-4:in_h-4:2:2')
    }
    
    if (options?.antiDetection?.noiseAddition) {
      videoFilters.push('noise=alls=1:allf=t')
    }
    
    if (options?.antiDetection?.subtleRotation) {
      videoFilters.push('rotate=0.1*PI/180:fillcolor=black')
    }

    // Handle / Watermark drawtext
    // @ts-ignore - addHandle may not be in the type yet
    if (options?.addHandle) {
      // @ts-ignore
      const handleText = options.addHandle.replace(/:/g, '\\\\:').replace(/'/g, "\\\\'")
      // @ts-ignore
      const hx = options.handleX !== undefined ? options.handleX : 50
      // @ts-ignore
      const hy = options.handleY !== undefined ? options.handleY : 25
      videoFilters.push(`drawtext=text='${handleText}':fontcolor=white:fontsize=(h/25):x=(w-tw)*${hx}/100:y=(h-th)*${hy}/100:shadowcolor=black@0.8:shadowx=2:shadowy=2:box=1:boxcolor=black@0.4:boxborderw=5`)
    }

    // Scale to even dimensions for codec compatibility
    videoFilters.push('scale=trunc(iw/2)*2:trunc(ih/2)*2')

    const videoFilter = videoFilters.length > 0 ? videoFilters.join(',') : 'null'
    console.log(`🎬 VideoProcessor video filter: ${videoFilter}`)

    outputOptions.push('-vf', videoFilter)

    // Build audio filter
    const audioFilters: string[] = []
    
    // Speed adjustment for audio
    if (options?.speedFactor && options.speedFactor !== 1) {
      audioFilters.push(`atempo=${options.speedFactor}`)
    }

    const audioFilter = audioFilters.length > 0 ? audioFilters.join(',') : 'anull'

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

    // Use ADAPTIVE quality based on transformation complexity
    const adaptiveQuality = getAdaptiveQuality(options)
    const qualityConfig = getQualityConfig(adaptiveQuality)
    
    console.log(`🎥 VideoProcessor using ${adaptiveQuality} quality: CRF ${qualityConfig.crf}, preset ${qualityConfig.preset}`)

    outputOptions.push('-c:v', qualityConfig.videoCodec)
    outputOptions.push('-preset', qualityConfig.preset)
    outputOptions.push('-crf', qualityConfig.crf.toString())
    outputOptions.push('-profile:v', qualityConfig.profile)
    if (qualityConfig.level) {
      outputOptions.push('-level', qualityConfig.level)
    }
    outputOptions.push('-threads', optimalThreads)
    outputOptions.push('-pix_fmt', qualityConfig.pixelFormat)
    outputOptions.push('-r', '29.97')
    outputOptions.push('-c:a', qualityConfig.audioCodec)
    outputOptions.push('-b:a', qualityConfig.audioBitrate)
    outputOptions.push('-ar', qualityConfig.sampleRate.toString())
    outputOptions.push('-max_muxing_queue_size', qualityConfig.maxMuxingQueueSize.toString())
    outputOptions.push('-movflags', qualityConfig.movflags)
    outputOptions.push('-f', 'mp4')

    return outputOptions
  }
}