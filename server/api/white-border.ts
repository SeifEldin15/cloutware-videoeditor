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
        // Legacy options mapping
        leftRightPercent: data.leftRightPercent || data.whiteBorderLeftRight || 0,
        topBottomPercent: data.topBottomPercent || data.whiteBorderTopBottom || 0,
        // New options
        videoScale: data.videoScale !== undefined ? data.videoScale : 1.0,
        videoX: data.videoX !== undefined ? data.videoX : 0,
        videoY: data.videoY !== undefined ? data.videoY : 0,
        borderType: data.borderType || 'color',
         // If legacy whiteBorder enabled but no specific type, assume color white?
         // Actually the legacy logic was just 'scale and pad with white'.
         // If strictly legacy params are passed, we might want to preserve that behavior, 
         // but here we are generalizing it.
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

    // Validate URL accessibility
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
    borderType: string // 'color' | 'image' | 'video'
    borderColor: string
    borderUrl?: string
    cropTop: number
    cropBottom: number
    cropLeft: number
    cropRight: number
    leftRightPercent: number // Legacy support (can be treated as specific padding/scale)
    topBottomPercent: number // Legacy support
    outputName: string
  }
): Promise<PassThrough> {
  return new Promise<PassThrough>(async (resolve, reject) => {
    try {
      const outputStream = new PassThrough({ highWaterMark: 4 * 1024 * 1024 })
      let commandOutput = ''
      const ffmpeg = await getInitializedFfmpeg()
      const ffmpegCommand = ffmpeg(inputUrl)

      // Note: Image backgrounds use raw ffmpeg spawn (below) rather than fluent-ffmpeg dual-input

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

      // Complex Filter Construction
      // 0:v is source video
      // 1:v is background (if present)

      const filters: string[] = []
      let lastStream = '0:v'

      // 1. Cropping (Source)
      // Percentage to value: iw * (val/100)
      if (options.cropTop > 0 || options.cropBottom > 0 || options.cropLeft > 0 || options.cropRight > 0) {
          const w = `iw*(1-(${options.cropLeft}/100)-(${options.cropRight}/100))`
          const h = `ih*(1-(${options.cropTop}/100)-(${options.cropBottom}/100))`
          const x = `iw*(${options.cropLeft}/100)`
          const y = `ih*(${options.cropTop}/100)`
          filters.push(`[${lastStream}]crop=w=${w}:h=${h}:x=${x}:y=${y}[cropped]`)
          lastStream = 'cropped'
      }

      // 2. Handling Legacy Options (LeftRightPercent / TopBottomPercent)
      // If these are non-zero, they essentially act as a shrink + pad
      // We can incorporate them into scale or treat them separately.
      // Current implementation: Treat them as modifying the scale factor if scale is 1?
      // Or just apply the legacy logic if options.videoScale is default 1?
      // Let's integrate into the general logic:
      // If LeftRight=10%, it means we want 10% padding on each side? Or total?
      // Old logic: visibleWidth = 100 - leftRightPercent.
      // So if leftRight=10, scale = 0.9.
      // We'll multiply videoScale by this factor.
      
      let effectiveScaleW = options.videoScale
      let effectiveScaleH = options.videoScale
      
      if (options.leftRightPercent > 0) effectiveScaleW *= ((100 - options.leftRightPercent) / 100)
      if (options.topBottomPercent > 0) effectiveScaleH *= ((100 - options.topBottomPercent) / 100)

      // 3. Scaling
      filters.push(`[${lastStream}]scale=iw*${effectiveScaleW}:ih*${effectiveScaleH}[scaled]`)
      const fgStream = 'scaled'

      // 4. Background & Overlay
      let finalFilter = ''
      
      // Calculate overlay position
      // options.videoX/Y are percentages (-100 to 100) relative to canvas size.
      // 0,0 should probably be centered.
      // x = (W-w)/2 + (W * videoX / 100)
      // y = (H-h)/2 + (H * videoY / 100)
      const overlayX = `(W-w)/2+(W*${options.videoX}/100)`
      const overlayY = `(H-h)/2+(H*${options.videoY}/100)`

      if (options.borderType === 'image' && options.borderUrl) {
          // === IMAGE BACKGROUND: Use raw ffmpeg spawn to avoid fluent-ffmpeg dual-input bugs ===
          const { spawn } = await import('child_process')
          const { join } = await import('path')
          const { tmpdir } = await import('os')

          // Build the filter chain
          // Input 0 = background image (with -loop 1)
          // Input 1 = source video
          const filterParts: string[] = []
          filterParts.push(`[1:v]split=2[fg_src][canvas_ref]`)
          filterParts.push(`[canvas_ref]drawbox=t=fill:c=black[canvas]`)
          filterParts.push(`[0:v][canvas]scale2ref=oh*mdar:oh[bg_scaled][canvas2]`)
          filterParts.push(`[canvas2][bg_scaled]overlay=(W-w)/2:(H-h)/2[bg_canvas]`)

          let fgChain = 'fg_src'
          if (options.cropTop > 0 || options.cropBottom > 0 || options.cropLeft > 0 || options.cropRight > 0) {
             const w = `iw*(1-(${options.cropLeft}/100)-(${options.cropRight}/100))`
             const h = `ih*(1-(${options.cropTop}/100)-(${options.cropBottom}/100))`
             const x = `iw*(${options.cropLeft}/100)`
             const y = `ih*(${options.cropTop}/100)`
             filterParts.push(`[${fgChain}]crop=w=${w}:h=${h}:x=${x}:y=${y}[fg_cropped]`)
             fgChain = 'fg_cropped'
          }
          filterParts.push(`[${fgChain}]scale=iw*${effectiveScaleW}:ih*${effectiveScaleH}[fg_ready]`)
          filterParts.push(`[bg_canvas][fg_ready]overlay=x=${overlayX}:y=${overlayY}:shortest=1[out]`)

          const filterComplex = filterParts.join(';')
          console.log(`🎨 Image BG filter: ${filterComplex}`)

          const tempOutputPath = join(tmpdir(), `wb-${Date.now()}-${options.outputName}.mp4`)

          const ffmpegArgs = [
            '-loop', '1',
            '-i', options.borderUrl,        // Input 0: background image
            '-i', inputUrl,                  // Input 1: source video
            '-filter_complex', filterComplex,
            '-map', '[out]',
            '-map', '1:a?',
            '-c:v', 'libx264',
            '-preset', 'veryfast',
            '-crf', '18',
            '-profile:v', 'high',
            '-level', '4.1',
            '-pix_fmt', 'yuv420p',
            '-c:a', 'aac',
            '-b:a', '160k',
            '-ar', '48000',
            '-shortest',
            '-movflags', 'frag_keyframe+empty_moov+faststart',
            '-f', 'mp4',
            '-y',
            tempOutputPath
          ]

          console.log(`🎬 ${options.outputName} Raw FFmpeg: ffmpeg ${ffmpegArgs.join(' ')}`)

          await new Promise<void>((resolveSpawn, rejectSpawn) => {
            const proc = spawn('ffmpeg', ffmpegArgs)
            let stderr = ''
            proc.stderr.on('data', (d: Buffer) => { stderr += d.toString() })
            proc.on('close', (code: number) => {
              if (code === 0) { console.log(`✅ ${options.outputName} FFmpeg completed`); resolveSpawn() }
              else rejectSpawn(new Error(`FFmpeg failed (code ${code}): ${stderr.slice(-500)}`))
            })
            proc.on('error', rejectSpawn)
          })

          // Read the output file and stream it
          const fsModule = await import('fs')
          const readStream = fsModule.createReadStream(tempOutputPath)
          readStream.pipe(outputStream, { end: true })
          readStream.on('end', () => {
            try { fsModule.unlinkSync(tempOutputPath) } catch {}
          })
          readStream.on('error', (err) => reject(err))

          resolve(outputStream)
      } else {
        // === COLOR BACKGROUND: Use fluent-ffmpeg (single input, works perfectly) ===
        filters.length = 0
        filters.push(`[0:v]split=2[v_fg][v_bg]`)
        filters.push(`[v_bg]drawbox=t=fill:c=${options.borderColor}[canvas]`)
        
        let fgChain = 'v_fg'
        if (options.cropTop > 0 || options.cropBottom > 0 || options.cropLeft > 0 || options.cropRight > 0) {
           filters.push(`[${fgChain}]crop=w=iw*(1-(${options.cropLeft}/100)-(${options.cropRight}/100)):h=ih*(1-(${options.cropTop}/100)-(${options.cropBottom}/100)):x=iw*(${options.cropLeft}/100):y=ih*(${options.cropTop}/100)[fg_cropped]`)
           fgChain = 'fg_cropped'
        }
        filters.push(`[${fgChain}]scale=iw*${effectiveScaleW}:ih*${effectiveScaleH}[fg_ready]`)
        filters.push(`[canvas][fg_ready]overlay=x=${overlayX}:y=${overlayY}[out]`)

        console.log(`🎨 Color filter: ${filters.join(';')}`)

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
      }
    } catch (error) {
      console.error(`❌ ${options.outputName} processing error:`, error)
      reject(error)
    }
  })
}
