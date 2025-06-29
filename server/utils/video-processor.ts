import { PassThrough } from 'stream'
import ffmpeg from './ffmpeg'
import os from 'os'
import type { VideoProcessingOptions } from './validation-schemas'

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
    
    return this.processWithFFmpeg(inputUrl, {
      name: `${outputName}.${outputConfig.fileExtension}`,
      outputOptions: outputConfig.outputOptions,
      inputOptions: outputConfig.inputOptions,
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
          '-hwaccel', 'auto',
          '-threads', optimalThreads
        ])

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
            reject(new Error(`FFmpeg error: ${err.message}\nCommand output: ${commandOutput}`))
          })
          .on('end', () => {
            console.log(`${options.name} FFmpeg process ended`)
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
} 