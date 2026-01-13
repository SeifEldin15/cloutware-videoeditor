import { createApp, eventHandler, readBody, setHeader, toNodeListener, createError, getQuery } from 'h3'
import { createServer } from 'http'
import { z } from 'zod'
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

function getWordModeForTemplate(template: string): 'normal' | 'single' | 'multiple' {
  const wordModeSettings: Record<string, 'normal' | 'single' | 'multiple'> = {
    'girlboss': 'multiple',
    'hormozi': 'single',
    'tiktokstyle': 'single',
    'whiteimpact': 'single',
    'impactfull': 'single',
    'thinToBold': 'single',
    'wavyColors': 'single',
    'revealEnlarge': 'multiple',
    'shrinkingPairs': 'multiple'
  };
  return wordModeSettings[template] || 'normal';
}

function getWordsPerGroupForTemplate(template: string): number {
  const wordsPerGroupSettings: Record<string, number> = {
    'girlboss': 2,
    'hormozi': 1,
    'tiktokstyle': 1,
    'whiteimpact': 1,
    'impactfull': 1,
    'thinToBold': 1,
    'wavyColors': 1,
    'revealEnlarge': 3,
    'shrinkingPairs': 2
  };
  return wordsPerGroupSettings[template] || 1;
}

const app = createApp()

// Health check
app.use('/health', eventHandler(() => {
  const gpuEnabled = process.env.USE_GPU === 'true'
  return { 
    status: 'OK', 
    gpu: gpuEnabled,
    message: gpuEnabled ? 'GPU acceleration enabled (NVENC)' : 'CPU mode'
  }
}))

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

    const captionOptions = {
      srtContent: validatedData.transcription,
      fontSize: validatedData.fontSize,
      fontColor: validatedData.primaryColor,
      fontFamily: validatedData.fontFamily,
      fontStyle: 'bold' as const,
      subtitlePosition: validatedData.verticalPosition === 'center' ? 'middle' : validatedData.verticalPosition as 'top' | 'bottom' | 'middle',
      horizontalAlignment: 'center' as const,
      verticalMargin: 30,
      showBackground: true,
      backgroundColor: 'black@0.7',
      outlineWidth: 2,
      outlineColor: '#000000',
      outlineBlur: 0,
      verticalPosition: getVerticalPositionValue(validatedData.verticalPosition),
      shadowStrength: 1.5,
      animation: 'none' as const,
      subtitleStyle: templateMapping[validatedData.template] as any,
      girlbossColor: validatedData.primaryColor,
      hormoziColors: [validatedData.primaryColor, validatedData.secondaryColor, '#1DE0FE', '#FFFF00'],
      tiktokstyleColor: validatedData.primaryColor,
      thinToBoldColor: validatedData.primaryColor,
      wavyColorsOutlineWidth: 2,
      shrinkingPairsColor: validatedData.primaryColor,
      revealEnlargeColors: [validatedData.primaryColor, validatedData.secondaryColor, '#1DE0FE', '#FFFF00'],
      whiteimpactColor: validatedData.primaryColor,
      impactfullColor: validatedData.primaryColor,
      wordMode: validatedData.wordMode || getWordModeForTemplate(validatedData.template),
      wordsPerGroup: validatedData.wordsPerGroup || getWordsPerGroupForTemplate(validatedData.template),
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

const port = process.env.PORT || 3000
const server = createServer(toNodeListener(app))
server.listen(port, () => {
    const gpuEnabled = process.env.USE_GPU === 'true'
    console.log(`🚀 GPU Video Processing Service listening on port ${port}`)
    console.log(`   GPU Acceleration: ${gpuEnabled ? '✅ ENABLED (NVENC)' : '❌ Disabled'}`)
})
