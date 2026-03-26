import { createApp, eventHandler, readBody, setHeader, toNodeListener, createError, getQuery } from 'h3'
import { createServer } from 'http'
import { z } from 'zod'
import { promises as fs } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { SubtitleProcessor } from './utils/subtitle-processor'

// Job progress tracking
interface JobProgress {
  id: string
  status: 'pending' | 'processing' | 'complete' | 'error'
  progress: number
  stage: string
  startTime: number
  error?: string
}

const activeJobs = new Map<string, JobProgress>()

// Expose progress setter for SubtitleProcessor
;(global as any).setJobProgress = (jobId: string, progress: number, stage: string) => {
  const job = activeJobs.get(jobId)
  if (job) {
    job.progress = progress
    job.stage = stage
  }
}

// Request Schema
const requestSchema = z.object({
  videoUrl: z.string().url('Invalid video URL'),
  template: z.enum([
    'girlboss', 'hormozi', 'tiktokstyle', 'thinToBold', 
    'wavyColors', 'revealEnlarge', 'shrinkingPairs',
    'whiteimpact', 'impactfull'
  ]).default('girlboss'),
  transcription: z.string().optional(),
  fontFamily: z.string().default('Inter-Bold.ttf'),
  primaryColor: z.string().default('#3b82f6'),
  secondaryColor: z.string().default('#10b981'),
  fontSize: z.number().min(20).max(100).default(48),
  verticalPosition: z.enum(['top', 'center', 'bottom']).default('bottom'),
  embedSubtitles: z.boolean().default(true),
  generateSubtitles: z.boolean().default(true),
  outputFormat: z.enum(['mp4', 'webm']).default('mp4'),
  quality: z.enum(['fast', 'standard', 'high', 'premium']).default('premium'),
  wordMode: z.enum(['normal', 'single', 'multiple']).optional(),
  wordsPerGroup: z.number().min(1).max(10).optional(),
  videoOptions: z.any().optional(),
  jobId: z.string().optional() // Client can provide jobId for progress tracking
});

const templateMapping: Record<string, string> = {
  'girlboss': 'girlboss',
  'hormozi': 'hormozi', 
  'tiktokstyle': 'tiktokstyle',
  'thinToBold': 'thintobold',
  'wavyColors': 'wavycolors',
  'revealEnlarge': 'revealenlarge',
  'shrinkingPairs': 'shrinkingpairs',
  'whiteimpact': 'whiteimpact',
  'impactfull': 'impactfull'
};

// Full per-template defaults — these are the canonical values for each style.
// `primaryColor` from the request can override the highlight color if explicitly provided.
function getTemplateCaptionDefaults(template: string, primaryColor: string, secondaryColor: string): Record<string, any> {
  const defaults: Record<string, Record<string, any>> = {
    girlboss: {
      fontFamily: 'Luckiest Guy',
      fontSize: 32,
      girlbossColor: primaryColor !== '#3b82f6' ? primaryColor : '#FF1493',
      shadowStrength: 2.0,
      animation: 'shake',
      verticalPosition: 18,
      outlineWidth: 3,
      outlineColor: '#000000',
      outlineBlur: 1,
      wordMode: 'multiple',
      wordsPerGroup: 2,
    },
    hormozi: {
      fontFamily: 'Luckiest Guy',
      fontSize: 50,
      hormoziColors: ['#00FF00', '#FF0000', '#0080FF', '#FFFF00'],
      shadowStrength: 3.5,
      animation: 'shake',
      verticalPosition: 15,
      outlineWidth: 2,
      outlineColor: '#000000',
      outlineBlur: 0,
      wordMode: 'multiple',
      wordsPerGroup: 4,
    },
    tiktokstyle: {
      fontFamily: 'TikTok Sans Bold',
      fontSize: 32,
      tiktokstyleColor: primaryColor !== '#3b82f6' ? primaryColor : '#FFFF00',
      shadowStrength: 0,
      animation: 'shake',
      verticalPosition: 20,
      outlineWidth: 4,
      outlineColor: '#000000',
      outlineBlur: 0,
      wordMode: 'single',
      wordsPerGroup: 1,
    },
    thintobold: {
      fontFamily: 'Montserrat Thin',
      fontSize: 50,
      thinToBoldColor: primaryColor !== '#3b82f6' ? primaryColor : '#FFFFFF',
      shadowStrength: 1.8,
      animation: 'none',
      verticalPosition: 22,
      outlineWidth: 1,
      outlineColor: '#000000',
      outlineBlur: 0,
      wordMode: 'multiple',
      wordsPerGroup: 2,
    },
    wavycolors: {
      fontFamily: 'Luckiest Guy',
      fontSize: 50,
      shadowStrength: 1.5,
      animation: 'none',
      verticalPosition: 12,
      outlineWidth: 3,
      outlineColor: '#000000',
      outlineBlur: 0,
      wordMode: 'multiple',
      wordsPerGroup: 1,
    },
    shrinkingpairs: {
      fontFamily: 'Luckiest Guy',
      fontSize: 36,
      shrinkingPairsColor: primaryColor !== '#3b82f6' ? primaryColor : '#FFFFFF',
      shadowStrength: 1.2,
      animation: 'shake',
      verticalPosition: 20,
      outlineWidth: 4,
      outlineColor: '#000000',
      outlineBlur: 0,
      wordMode: 'multiple',
      wordsPerGroup: 4,
    },
    revealenlarge: {
      fontFamily: 'Luckiest Guy',
      fontSize: 50,
      revealEnlargeColors: ['#FF0000', '#00FF00', '#0080FF', '#FFFF00', '#FF1493'],
      shadowStrength: 1.5,
      animation: 'shake',
      verticalPosition: 16,
      outlineWidth: 3,
      outlineColor: '#000000',
      outlineBlur: 0,
      wordMode: 'multiple',
      wordsPerGroup: 4,
    },
    whiteimpact: {
      fontFamily: 'Impact',
      fontSize: 48,
      shadowStrength: 1.0,
      animation: 'none',
      verticalPosition: 20,
      outlineWidth: 1,
      outlineColor: '#000000',
      outlineBlur: 0,
      wordMode: 'single',
      wordsPerGroup: 1,
    },
    impactfull: {
      fontFamily: 'Impact',
      fontSize: 42,
      shadowStrength: 1.0,
      animation: 'none',
      verticalPosition: 25,
      outlineWidth: 1,
      outlineColor: '#000000',
      outlineBlur: 0,
      wordMode: 'normal',
      wordsPerGroup: 1,
    },
  };
  return defaults[template] || defaults.girlboss;
}

const app = createApp()

// Health check
app.use('/health', eventHandler(() => {
  const gpuEnabled = process.env.USE_GPU === 'true'
  return { 
    status: 'OK', 
    gpu: gpuEnabled,
    version: '2.0.1-dedupe-fix',
    message: gpuEnabled ? 'GPU acceleration enabled (NVENC)' : 'CPU mode'
  }
}))

console.log('🚀 GPU Video Processing Server V2.0.1 Starting (Deduplication Fix Active)...')

// Progress polling endpoint
app.use('/progress', eventHandler((event) => {
  const query = getQuery(event)
  const jobId = query.jobId as string
  
  if (!jobId) {
    return { error: 'jobId is required' }
  }
  
  const job = activeJobs.get(jobId)
  if (!job) {
    return { error: 'Job not found', status: 'unknown' }
  }
  
  return {
    status: job.status,
    progress: job.progress,
    stage: job.stage,
    elapsed: Date.now() - job.startTime
  }
}))

// Main processing endpoint
app.use('/process', eventHandler(async (event) => {
  const jobId = `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  
  try {
    const body = await readBody(event);
    const validatedData = requestSchema.parse(body);
    
    // Use client-provided jobId or generate one
    const trackingId = validatedData.jobId || jobId
    
    // Initialize job progress
    activeJobs.set(trackingId, {
      id: trackingId,
      status: 'processing',
      progress: 0,
      stage: 'Initializing...',
      startTime: Date.now()
    })
    
    // Return jobId in header for progress tracking
    setHeader(event, 'X-Job-Id', trackingId)

    if (!validatedData.transcription) {
      activeJobs.delete(trackingId)
      throw createError({
        statusCode: 400,
        statusMessage: 'Transcription is required for video processing.'
      });
    }

    const getVerticalPositionValue = (position: string) => {
      switch (position) {
        case 'top': return 85
        case 'center': return 50
        case 'bottom': return 15
        default: return 15
      }
    }

    // Update progress: Starting
    const job = activeJobs.get(trackingId)!
    job.progress = 5
    job.stage = 'Preparing subtitles...'

    const resolvedTemplate = templateMapping[validatedData.template] as string;
    const templateDefaults = getTemplateCaptionDefaults(resolvedTemplate, validatedData.primaryColor, validatedData.secondaryColor);

    const captionOptions = {
      // Base fields required by all styles
      srtContent: validatedData.transcription,
      fontColor: validatedData.primaryColor,
      fontStyle: 'bold' as const,
      subtitlePosition: validatedData.verticalPosition === 'center' ? 'middle' : validatedData.verticalPosition as 'top' | 'bottom' | 'middle',
      horizontalAlignment: 'center' as const,
      verticalMargin: 30,
      showBackground: true,
      backgroundColor: 'black@0.7',
      subtitleStyle: resolvedTemplate as any,
      // Spread all template-specific defaults (font, color, wordMode, etc.)
      ...templateDefaults,
      // Allow request-level overrides for font/size/position if explicitly provided
      ...(validatedData.fontSize !== 48 ? { fontSize: validatedData.fontSize } : {}),
      ...(validatedData.fontFamily !== 'Inter-Bold.ttf' ? { fontFamily: validatedData.fontFamily } : {}),
      ...(validatedData.wordMode ? { wordMode: validatedData.wordMode } : {}),
      ...(validatedData.wordsPerGroup ? { wordsPerGroup: validatedData.wordsPerGroup } : {}),
      _jobId: trackingId // Pass jobId to processor for progress updates
    };

    job.progress = 10
    job.stage = 'Starting GPU encoding...'

    const gpuEnabled = process.env.USE_GPU === 'true'
    console.log(`🎬 Starting video processing service... (GPU: ${gpuEnabled ? 'ENABLED' : 'disabled'}) [Job: ${trackingId}]`)
    
    // SubtitleProcessor.processAdvanced returns a Promise<PassThrough>
    const videoStream = await SubtitleProcessor.processAdvanced(
      validatedData.videoUrl,
      captionOptions,
      validatedData.videoOptions,
      validatedData.quality as any
    );
    
    // Mark as complete when stream ends
    videoStream.on('end', () => {
      const job = activeJobs.get(trackingId)
      if (job) {
        job.status = 'complete'
        job.progress = 100
        job.stage = 'Complete!'
        // Clean up after 60 seconds
        setTimeout(() => activeJobs.delete(trackingId), 60000)
      }
    })
    
    videoStream.on('error', (err) => {
      const job = activeJobs.get(trackingId)
      if (job) {
        job.status = 'error'
        job.error = err.message
        setTimeout(() => activeJobs.delete(trackingId), 60000)
      }
    })

    setHeader(event, 'Content-Type', 'video/mp4')
    setHeader(event, 'Content-Disposition', 'attachment; filename="processed-video.mp4"')
    
    return videoStream;

  } catch (error: any) {
    console.error('Video processing error:', error);
    activeJobs.delete(jobId)
    throw createError({
      statusCode: 400,
      statusMessage: error.message || 'Unknown error'
    });
  }
}))

// Layout/White Border processing endpoint
const layoutSchema = z.object({
  url: z.string().url('Invalid video URL'),
  outputName: z.string().default('layout_output'),
  enableWhiteBorder: z.boolean().optional(),
  leftRightPercent: z.coerce.number().optional(),
  topBottomPercent: z.coerce.number().optional(),
  videoScale: z.coerce.number().optional(),
  videoX: z.coerce.number().optional(),
  videoY: z.coerce.number().optional(),
  borderType: z.string().optional(),
  whiteBorderColor: z.string().optional(),
  cropTop: z.coerce.number().optional(),
  cropBottom: z.coerce.number().optional(),
  cropLeft: z.coerce.number().optional(),
  cropRight: z.coerce.number().optional()
})

app.use('/layout', eventHandler(async (event) => {
  try {
    const body = await readBody(event)
    console.log(`📨 Raw layout body received:`, JSON.stringify(body, null, 2))
    
    const validatedData = layoutSchema.parse(body)
    
    const videoScale = validatedData.videoScale ?? 1
    const videoX = validatedData.videoX ?? 0
    const videoY = validatedData.videoY ?? 0
    const whiteBorderColor = validatedData.whiteBorderColor || '#FFFFFF'
    const leftRightPercent = validatedData.leftRightPercent ?? 10
    const topBottomPercent = validatedData.topBottomPercent ?? 20

    console.log(`🎨 GPU Layout processing: ${validatedData.url}`)
    console.log(`📐 Parsed values: scale=${videoScale}, LR=${leftRightPercent}%, TB=${topBottomPercent}%, color=${whiteBorderColor}, type=${validatedData.borderType}`)
    
    const { spawn } = await import('child_process')
    const { PassThrough } = await import('stream')
    
    const outputStream = new PassThrough({ highWaterMark: 4 * 1024 * 1024 })
    
    // Build FFmpeg filter for layout
    // For color bg: leftRightPercent/topBottomPercent shrink the video to reveal the color border.
    // For image bg: effectiveScaleW/H = videoScale directly (no extra border shrink).
    const effectiveScaleW = videoScale * ((100 - leftRightPercent) / 100)
    const effectiveScaleH = videoScale * ((100 - topBottomPercent) / 100)
    
    console.log(`📏 Effective scale: W=${effectiveScaleW}, H=${effectiveScaleH}`)
    
    const overlayX = `(W-w)/2+(W*${videoX}/100)`
    const overlayY = `(H-h)/2+(H*${videoY}/100)`
    
    // Format color for FFmpeg - drawbox accepts both #XXXXXX and 0xXXXXXX formats
    // white, black work as names too
    const borderColor = whiteBorderColor.startsWith('#') 
      ? whiteBorderColor.replace('#', '0x')
      : whiteBorderColor
    
    console.log(`🎨 Border color: ${borderColor}`)

    // Build filter chain
    const filters: string[] = []
    
    // Always use color background
    filters.push(`[0:v]split=2[v_fg][v_bg]`)
        filters.push(`[v_bg]drawbox=t=fill:c=${borderColor}[canvas]`)
        
        let fgChain = 'v_fg'
        if ((validatedData.cropTop || 0) > 0 || (validatedData.cropBottom || 0) > 0 || 
            (validatedData.cropLeft || 0) > 0 || (validatedData.cropRight || 0) > 0) {
          const cropL = validatedData.cropLeft || 0
          const cropR = validatedData.cropRight || 0
          const cropT = validatedData.cropTop || 0
          const cropB = validatedData.cropBottom || 0
          const w = `iw*(1-(${cropL}/100)-(${cropR}/100))`
          const h = `ih*(1-(${cropT}/100)-(${cropB}/100))`
          const x = `iw*(${cropL}/100)`
          const y = `ih*(${cropT}/100)`
          filters.push(`[${fgChain}]crop=w=${w}:h=${h}:x=${x}:y=${y}[fg_cropped]`)
          fgChain = 'fg_cropped'
        }
        
        filters.push(`[${fgChain}]scale=iw*${effectiveScaleW}:ih*${effectiveScaleH}[fg_ready]`)
        filters.push(`[canvas][fg_ready]overlay=x=${overlayX}:y=${overlayY}[out]`)
    
    const filterComplex = filters.join(';')
    console.log(`🎨 GPU Filter: ${filterComplex}`)
    
    // Use GPU encoding (h264_nvenc) - but NOT hwaccel for input since we have complex filters
    const gpuEnabled = process.env.USE_GPU === 'true'
    const videoCodec = gpuEnabled ? 'h264_nvenc' : 'libx264'
    
    console.log(`🚀 Starting FFmpeg for layout: ${videoCodec} (GPU encoding: ${gpuEnabled})`)
    
    const ffmpegArgs = [
      // Source video input (always present)
      '-protocol_whitelist', 'file,http,https,tcp,tls',
      '-analyzeduration', '10000000',
      '-probesize', '10000000',
      '-i', validatedData.url,

      // Filter
      '-filter_complex', filterComplex,
      '-map', '[out]',
      '-map', '0:a?',  // audio from source video
      '-shortest',
      // Video encoding
      '-c:v', videoCodec,
    ]
    
    // Add codec-specific options
    if (gpuEnabled) {
      // NVENC options - using valid presets for h264_nvenc
      // Note: Don't specify -level as NVENC will auto-detect based on video dimensions
      ffmpegArgs.push(
        '-preset', 'p4',      // p1 (fastest) to p7 (slowest/best quality)
        '-rc', 'vbr',         // Variable bitrate mode
        '-cq', '20',          // Constant quality value (lower = better)
        '-profile:v', 'high'
      )
    } else {
      // CPU libx264 options
      ffmpegArgs.push(
        '-preset', 'veryfast',
        '-crf', '18',
        '-profile:v', 'high',
        '-level', '4.1'
      )
    }
    
    // Common output options
    ffmpegArgs.push(
      '-pix_fmt', 'yuv420p',
      '-c:a', 'aac',
      '-b:a', '160k',
      '-ar', '48000',
      '-max_muxing_queue_size', '4096',
      '-movflags', 'frag_keyframe+empty_moov+faststart',
      '-f', 'mp4',
      'pipe:1'
    )
    
    console.log(`� FFmpeg args: ffmpeg ${ffmpegArgs.join(' ')}`)
    
    const ffmpeg = spawn('ffmpeg', ffmpegArgs)
    
    ffmpeg.stdout.pipe(outputStream)
    
    let stderrOutput = ''
    ffmpeg.stderr.on('data', (data) => {
      const line = data.toString()
      stderrOutput += line
      if (line.includes('frame=') || line.includes('error') || line.includes('Error') || line.includes('failed')) {
        console.log(`GPU Layout FFmpeg: ${line.trim()}`)
      }
    })
    
    ffmpeg.on('error', (err) => {
      console.error('GPU Layout FFmpeg spawn error:', err)
      outputStream.destroy(err)
    })
    
    ffmpeg.on('close', (code) => {
      if (code !== 0) {
        console.error(`GPU Layout FFmpeg exited with code ${code}`)
        console.error('FFmpeg stderr:', stderrOutput.slice(-2000))
        if (!outputStream.destroyed) {
          outputStream.destroy(new Error(`FFmpeg exited with code ${code}`))
        }
      } else {
        console.log(`✅ GPU Layout processing complete`)
      }
      // Cleanup temp files
    })
    
    setHeader(event, 'Content-Type', 'video/mp4')
    setHeader(event, 'Content-Disposition', `attachment; filename="${validatedData.outputName}.mp4"`)
    
    return outputStream
    
  } catch (error: any) {
    console.error('GPU Layout processing error:', error)
    throw createError({
      statusCode: 400,
      statusMessage: error.message || 'Unknown error'
    })
  }
}))

const port = process.env.PORT || 3000
const server = createServer(toNodeListener(app))
server.listen(port, () => {
    const gpuEnabled = process.env.USE_GPU === 'true'
    console.log(`🚀 GPU Video Processing Service listening on port ${port}`)
    console.log(`   GPU Acceleration: ${gpuEnabled ? '✅ ENABLED (NVENC)' : '❌ Disabled'}`)
    console.log(`   Endpoints: /health, /process, /layout, /progress`)
})
