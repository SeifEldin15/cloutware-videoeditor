import { PassThrough } from 'stream'
import { readValidatedBody, setResponseHeader } from 'h3'
import { getInitializedFfmpeg } from '../utils/ffmpeg'
import os from 'os'

const availableCpuCores = os.cpus().length
const optimalThreads = Math.max(2, Math.floor(availableCpuCores * 0.75)).toString()

export default eventHandler(async (event) => {
  try {
    const body = await readValidatedBody(event, (data: any) => {
      if (!data.url) {
        throw new Error('Video URL is required')
      }
      return {
        url: data.url,
        outputName: data.outputName || 'processed_layout_video',
        leftRightPercent: data.leftRightPercent ?? data.whiteBorderLeftRight ?? 10,
        topBottomPercent: data.topBottomPercent ?? data.whiteBorderTopBottom ?? 20,
        videoScale: data.videoScale !== undefined ? data.videoScale : 1.0,
        videoX: data.videoX !== undefined ? data.videoX : 0,
        videoY: data.videoY !== undefined ? data.videoY : 0,
        borderType: data.borderType || 'color',
        borderColor: data.whiteBorderColor || data.borderColor || 'white', 
        borderUrl: data.borderUrl,
        cropTop: data.cropTop || 0,
        cropBottom: data.cropBottom || 0,
        cropLeft: data.cropLeft || 0,
        cropRight: data.cropRight || 0
      }
    })

    const { url, outputName, ...options } = body

    console.log(`🎨 Processing video layout: ${url}`)
    console.log(`⚙️ Options:`, JSON.stringify(options, null, 2))

    await validateUrl(url)
    if (options.borderUrl) {
        await validateUrl(options.borderUrl)
    }

    const videoStream = await processWithLayout(url, { ...options, outputName })

    setResponseHeader(event, 'Content-Type', 'video/mp4')
    setResponseHeader(event, 'Content-Disposition', `attachment; filename="${outputName}.mp4"`)

    return videoStream

  } catch (error) {
    console.error('❌ Error processing video with layout:', error)
    event.node.res.statusCode = 500

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return { error: 'Failed to process video: ' + errorMessage }
  }
})

async function validateUrl(url: string) {
    try {
      const headResponse = await fetch(url, { method: 'HEAD' })
      if (!headResponse.ok) {
        throw new Error(`URL not accessible: ${url}`)
      }
    } catch (error) {
      throw new Error(`Cannot access URL: ${url}`)
    }
}

async function processWithLayout(
  inputUrl: string,
  options: {
    videoScale: number
    videoX: number
    videoY: number
    borderType: string
    borderColor: string
    borderUrl?: string
    cropTop: number
    cropBottom: number
    cropLeft: number
    cropRight: number
    leftRightPercent: number
    topBottomPercent: number
    outputName: string
  }
): Promise<PassThrough> {
  return new Promise<PassThrough>(async (resolve, reject) => {
    try {
      const outputStream = new PassThrough({ highWaterMark: 4 * 1024 * 1024 })
      let commandOutput = ''
      const ffmpeg = await getInitializedFfmpeg()

      // Calculate scale factors.
      // The padding shrinks the video to reveal the colored border.
      let effectiveScaleW = options.videoScale
      let effectiveScaleH = options.videoScale
      if (options.leftRightPercent > 0) effectiveScaleW *= ((100 - options.leftRightPercent) / 100)
      if (options.topBottomPercent > 0) effectiveScaleH *= ((100 - options.topBottomPercent) / 100)

      // Overlay position
      const overlayX = `(W-w)/2+(W*${options.videoX}/100)`
      const overlayY = `(H-h)/2+(H*${options.videoY}/100)`

      const filters: string[] = []
      // Check if we requested image background
      const hasImageBg = options.borderType === 'image' && options.borderUrl;
      
      let ffmpegCommand = ffmpeg();
      ffmpegCommand.input(inputUrl);
      ffmpegCommand.inputOptions([
        '-protocol_whitelist', 'file,http,https,tcp,tls',
        '-reconnect', '1',
        '-reconnect_streamed', '1',
        '-analyzeduration', '10000000',
        '-probesize', '10000000',
        '-thread_queue_size', '512',
        '-hwaccel', 'auto',
        '-threads', optimalThreads
      ]);

      if (hasImageBg) {
        ffmpegCommand.input(options.borderUrl!);
        ffmpegCommand.inputOptions([
          '-loop', '1'
        ]);
      }

      if (hasImageBg) {
        filters.push(`[0:v]split=2[v_fg_base][v_bg]`)
        filters.push(`[v_bg]drawbox=t=fill:c=black[canvas_black]`)
        filters.push(`[1:v][canvas_black]scale2ref=w=iw:h=ih:force_original_aspect_ratio=increase[img_scaled][canvas_base]`)
        filters.push(`[canvas_base][img_scaled]overlay=x='(main_w-overlay_w)/2':y='(main_h-overlay_h)/2':shortest=0[canvas]`)
      } else {
        filters.push(`[0:v]split=2[v_fg_base][v_bg]`)
        filters.push(`[v_bg]drawbox=t=fill:c=${options.borderColor}[canvas]`)
      }

      let fgChain = 'v_fg_base'
      if (options.cropTop > 0 || options.cropBottom > 0 || options.cropLeft > 0 || options.cropRight > 0) {
        filters.push(`[${fgChain}]crop=w=iw*(1-(${options.cropLeft}/100)-(${options.cropRight}/100)):h=ih*(1-(${options.cropTop}/100)-(${options.cropBottom}/100)):x=iw*(${options.cropLeft}/100):y=ih*(${options.cropTop}/100)[fg_cropped]`)
        fgChain = 'fg_cropped'
      }
      filters.push(`[${fgChain}]scale=iw*${effectiveScaleW}:ih*${effectiveScaleH}[fg_ready]`)
      filters.push(`[canvas][fg_ready]overlay=x=${overlayX}:y=${overlayY}:shortest=1[out]`)
      console.log(`🎨 Filter (color/image): ${filters.join(';')}`)

      const outputOptions = [
        '-filter_complex', filters.join(';'),
        '-map', '[out]',
        '-map', '0:a?',
        '-c:v', 'libx264',
        '-preset', 'veryfast',
        '-crf', '18',
        '-profile:v', 'high',
        '-level', '4.1',
        '-threads', optimalThreads,
        '-pix_fmt', 'yuv420p',
        '-c:a', 'aac',
        '-b:a', '160k',
        '-ar', '48000',
        '-max_muxing_queue_size', '4096',
        '-movflags', 'frag_keyframe+empty_moov+faststart',
        '-f', 'mp4'
      ]

      ffmpegCommand
        .outputOptions(outputOptions)
        .on('start', (commandLine: string) => {
          console.log(`🎬 ${options.outputName} FFmpeg started`)
          console.log(`📋 Command: ${commandLine}`)
        })
        .on('progress', (progress: any) => {
          if (progress.percent) {
            console.log(`⏳ ${options.outputName} Processing: ${progress.percent.toFixed(2)}%`)
          }
        })
        .on('stderr', (stderrLine: string) => {
          commandOutput += stderrLine + '\n'
          if (stderrLine.includes('error') || stderrLine.includes('Error')) {
            console.error(`⚠️ ${options.outputName} FFmpeg stderr:`, stderrLine)
          }
        })
        .on('error', (err: Error) => {
          console.error(`❌ ${options.outputName} FFmpeg error:`, err)
          console.error(`📋 Command output:`, commandOutput)
          reject(new Error(`FFmpeg error: ${err.message}\nCommand output: ${commandOutput}`))
        })
        .on('end', () => {
          console.log(`✅ ${options.outputName} FFmpeg process completed`)
        })

      ffmpegCommand.pipe(outputStream, { end: true })
      resolve(outputStream)
    } catch (error) {
      console.error(`❌ ${options.outputName} processing error:`, error)
      reject(error)
    }
  })
}
