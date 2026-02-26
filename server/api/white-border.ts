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

      // Add background input if needed
      if ((options.borderType === 'image' || options.borderType === 'video') && options.borderUrl) {
          ffmpegCommand.input(options.borderUrl)
          if (options.borderType === 'image') {
              ffmpegCommand.inputOptions(['-loop', '1'])
          } else if (options.borderType === 'video') {
              ffmpegCommand.inputOptions(['-stream_loop', '-1'])
          }
      }

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

      if ((options.borderType === 'image' || options.borderType === 'video') && options.borderUrl) {
          // Input 1 is the background
          // Scale background to match Input 0's original dimensions (which is the canvas size)
          // We assume output canvas size == Input 0 original size.
          // [1:v]scale2ref=oh*mdar:ih[bg];[bg][0:v]scale2ref=iw:ih[bg_scaled]... slightly complex to get exact size of 0:v without probing.
          // Actually, we can use `scale2ref` to scale incoming background (1:v) to match 0:v size.
          
          filters.push(`[1:v][0:v]scale2ref=iw:ih:force_original_aspect_ratio=increase[bg_tmp][ref]`) // Scale 1:v to match 0:v
          filters.push(`[bg_tmp]crop=iw:ih[bg]`) // Crop to exact fit if aspect ratio differs
          filters.push(`[bg][${fgStream}]overlay=x=${overlayX}:y=${overlayY}:shortest=1[out]`)
          // Note: using [ref] as dummy or ignoring it? scale2ref outputs 2 streams.
          // [ref] is the resizing of 0:v? No, "Reference stream is not modified". Wait.
          // scale2ref: "Scale (resize) the input video, based on a reference video."
          // Input 0: video to scale (bg). Input 1: ref video (fg).
          // So [1:v][0:v]scale2ref ... means 1:v is scaled based on 0:v.
          // Outputs: [scaled_bg][ref_0v_unchanged].
          // BUT we already processed 0:v into [scaled] via previous filters. We need the *original* size.
          // 0:v is available at start, but we consumed it? No, if we didn't consume it fully or user split?
          // Actually, `scale2ref` is best used at start.
          // Simpler approach: Just pad the FG with color, OR if we strictly need Image BG, use scale2ref.
          
          // Let's rewrite the chain to be safer:
          // [1:v][0:v]scale2ref=iw:ih:force_original_aspect_ratio=increase[bg_scaled][orig_ref];
          // [bg_scaled]crop=iw:ih[bg_final];
          // [orig_ref]... apply crop/scale ... [fg_final];
          // [bg_final][fg_final]overlay...
          
          // Resetting filters array for this branch
          filters.length = 0 
          
          // Prepare BG
          // 1:v (background), 0:v (reference for size)
          filters.push(`[1:v][0:v]scale2ref=iw:ih:force_original_aspect_ratio=increase[bg_tm][ref]`)
          filters.push(`[bg_tm][ref]scale2ref=iw:ih[bg_sized][ref2]`) // Ensure exact match? crop is better. 
          // Actually crop: 
          filters.push(`[bg_tm][ref]scale2ref=iw:ih[bg_crop_ref][ref_ignore]`) // Getting size again for crop? 
          // Simpler: `scale2ref` sets sizes. `crop` needs explicit w/h.
          // Let's assume we can crop to `iw` of the ref.
          // `[bg_tm]crop=w=iw:h=ih` wait, crop uses its own input dimensions if not specified.
          
          // Let's use `pad` on the scaled video to create the canvas, but populating it with the image is tricky without complex filter graph.
          // Easiest reliable way without probing dimensions beforehand:
          // Pad the scaled foreground with transparent, then overlay on background?
          // Or: Overlay scaled FG on scaled BG.
          
          // Let's stick to:
          // scale2ref [1:v] to [0:v]. 
          filters.length = 0
          
          // 1. Resize BG (1:v) to match Source (0:v) dimensions
          filters.push(`[1:v][0:v]scale2ref=iw:ih:force_original_aspect_ratio=increase[bg_scaled][source_ref]`)
          filters.push(`[bg_scaled][source_ref]scale2ref=iw:ih[bg_cropped][source_ref2]`) // Trick to crop? No.
          filters.push(`[bg_scaled]crop=w=iw:h=ih[bg_ready]`) // This might fail if crop doesn't know 'iw' target from separate stream.
          // Actually, simpler:
          // Just use `0:v` for the foreground processing chain.
          // We can assume 0:v dimensions are WxH.
          
          // Refined Image BG Chain:
          // [1:v][0:v]scale2ref=iw:ih:force_original_aspect_ratio=increase[bg_tmp][v0_ref];
          // [bg_tmp]crop=iw:ih[bg] (This might interpret iw/ih from bg_tmp itself). 
          // To ensure we crop to 0:v size: `scale2ref` ensures dimensions are >= 0:v due to `increase`.
          // We theoretically need to crop to exactly 0:v size. 
          // Let's trust `scale2ref` did its job.
          
          // FG Chain (using v0_ref)
          let fgInput = 'v0_ref'
          if (options.cropTop > 0 || options.cropBottom > 0 || options.cropLeft > 0 || options.cropRight > 0) {
             const w = `iw*(1-(${options.cropLeft}/100)-(${options.cropRight}/100))`
             const h = `ih*(1-(${options.cropTop}/100)-(${options.cropBottom}/100))`
             const x = `iw*(${options.cropLeft}/100)`
             const y = `ih*(${options.cropTop}/100)`
             filters.push(`[${fgInput}]crop=w=${w}:h=${h}:x=${x}:y=${y}[fg_cropped]`)
             fgInput = 'fg_cropped'
          }
          
          filters.push(`[${fgInput}]scale=iw*${effectiveScaleW}:ih*${effectiveScaleH}[fg_scaled]`)
          
          // Final Overlay
          // We overlay [fg_scaled] onto [bg_tmp] (which we hope is close enough to size, or we use `pad` on BG?)
          // Safest fallback if crop is tricky: Just use `overlay` because overlay handles mismatched sizes.
          // But we want the canvas size to be 0:v size. 
          // scale2ref makes BG size >= target. Overlay crops if BG > Canvas? No.
          // Let's define the canvas using `pad` on a null source or color source?
          // Best approach: Use `color` filter sized to 0:v as base, overlay BG (scaled), then overlay FG.
          
          // SUPER SAFE CHAIN:
          // 1. Create canvas from 0:v (clone)
          // [0:v]split[v_main][v_ref]
          // [v_ref]drawbox=t=fill:c=${options.borderColor}[canvas]  <-- Creates a solid color canvas of original size
          
          // 2. Prepare BG Image/Video
          // [1:v][v_ref]scale2ref=iw:ih:force_original_aspect_ratio=increase[bg_scaled][v_ref_ignore]
          // [canvas][bg_scaled]overlay=(W-w)/2:(H-h)/2[canvas_with_bg]  <-- Centers BG on canvas
          
          // 3. Prepare FG
          // [v_main]...crop...scale...[fg_final]
          
          // 4. Overlay FG on Canvas
          // [canvas_with_bg][fg_final]overlay=...
          
          filters.length = 0
          filters.push(`[0:v]split=2[v_main][v_ref]`)
          
          // Step 1: Background Layer
          // Make a canvas of size 0:v. Using `drawbox` on v_ref is a cheap way to preserve exact format/meta.
          // We'll use `v_ref` to create the base canvas.
          const colorResult = options.whiteBorderColor || options.borderColor || '#ffffff'
          const colorStr = colorResult.startsWith('#') ? colorResult.replace('#', '0x') : colorResult
          filters.push(`[v_ref]drawbox=t=fill:c=${colorStr}[base_canvas]`) 
          
          // Step 2: Overlay Custom BG (1:v) onto Base Canvas
          // Scale BG to cover canvas
          filters.push(`[1:v][base_canvas]scale2ref=iw:ih:force_original_aspect_ratio=increase[bg_scaled][base_canvas_ref]`)
          filters.push(`[base_canvas_ref][bg_scaled]overlay=(W-w)/2:(H-h)/2:shortest=1[canvas_with_bg]`)
          
          // Step 3: Manipulate FG (v_main)
          let fgChain = 'v_main'
          if (options.cropTop > 0 || options.cropBottom > 0 || options.cropLeft > 0 || options.cropRight > 0) {
             const w = `iw*(1-(${options.cropLeft}/100)-(${options.cropRight}/100))`
             const h = `ih*(1-(${options.cropTop}/100)-(${options.cropBottom}/100))`
             const x = `iw*(${options.cropLeft}/100)`
             const y = `ih*(${options.cropTop}/100)`
             filters.push(`[${fgChain}]crop=w=${w}:h=${h}:x=${x}:y=${y}[fg_cropped]`)
             fgChain = 'fg_cropped'
          }
           filters.push(`[${fgChain}]scale=iw*${effectiveScaleW}:ih*${effectiveScaleH}[fg_ready]`)
           
           // Step 4: Final Overlay
           filters.push(`[canvas_with_bg][fg_ready]overlay=x=${overlayX}:y=${overlayY}:shortest=1[out]`)
      } else {
        // Color Background mode
        // Much simpler: Resize FG, then PAD to original size with color.
        // `scale=...,pad=...`
        // We know 'iw'/'ih' inside the filter chain refer to the input of that filter.
        
        // Use `scale` then `pad`.
        // To get original dimensions for padding, we need to know them.
        // `pad` can use expressions. `iw` is current width (scaled). `ow` is output width.
        // We want output width/height to be ORIGINAL input width/height.
        // But `pad` doesn't know original dimensions if we already scaled!
        // So we can express target W/H in terms of current iw/ih IF we know the scale factor.
        // targetW = scaledW / scaleFactor.
        // But expressions are messy.
        
        // Simpler: Split 0:v. Use one for canvas (drawbox color), one for FG.
        filters.length = 0
        filters.push(`[0:v]split=2[v_fg][v_bg]`)
        
        // Make Canvas
        filters.push(`[v_bg]drawbox=t=fill:c=${options.borderColor}[canvas]`)
        
        // Process FG
        let fgChain = 'v_fg'
        if (options.cropTop > 0 || options.cropBottom > 0 || options.cropLeft > 0 || options.cropRight > 0) {
           filters.push(`[${fgChain}]crop=w=iw*(1-(${options.cropLeft}/100)-(${options.cropRight}/100)):h=ih*(1-(${options.cropTop}/100)-(${options.cropBottom}/100)):x=iw*(${options.cropLeft}/100):y=ih*(${options.cropTop}/100)[fg_cropped]`)
           fgChain = 'fg_cropped'
        }
        filters.push(`[${fgChain}]scale=iw*${effectiveScaleW}:ih*${effectiveScaleH}[fg_ready]`)
        
        // Overlay
        filters.push(`[canvas][fg_ready]overlay=x=${overlayX}:y=${overlayY}[out]`)
      }

      console.log(`🎨 Filter complex: ${filters.join(';')}`)

      const outputOptions = [
        '-filter_complex', filters.join(';'),
        '-map', '[out]',                // Map the output of complex filter
        '-map', '0:a?',                 // Map audio from source (optional)
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
