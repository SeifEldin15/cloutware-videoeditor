import { createApp, eventHandler, readBody, setHeader, toNodeListener, createError } from 'h3'
import { createServer } from 'http'
import { z } from 'zod'
import { SubtitleProcessor } from './utils/subtitle-processor'

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
  videoOptions: z.any().optional()
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

// Full per-template defaults — single source of truth for each style's correct settings.
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
      wordMode: 'multiple',
      wordsPerGroup: 2,
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
    message: gpuEnabled ? 'GPU acceleration enabled (NVENC)' : 'CPU mode'
  }
}))

// Main processing endpoint
app.use('/process', eventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const validatedData = requestSchema.parse(body);

    if (!validatedData.transcription) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Transcription is required for video processing.'
      });
    }

    const resolvedTemplate = templateMapping[validatedData.template] as string;
    const templateDefaults = getTemplateCaptionDefaults(resolvedTemplate, validatedData.primaryColor, validatedData.secondaryColor);

    const captionOptions = {
      // Base fields
      srtContent: validatedData.transcription,
      fontColor: validatedData.primaryColor,
      fontStyle: 'bold' as const,
      subtitlePosition: validatedData.verticalPosition === 'center' ? 'middle' : validatedData.verticalPosition as 'top' | 'bottom' | 'middle',
      horizontalAlignment: 'center' as const,
      verticalMargin: 30,
      showBackground: true,
      backgroundColor: 'black@0.7',
      subtitleStyle: resolvedTemplate as any,
      // Per-template canonical defaults
      ...templateDefaults,
      // Request-level overrides (only when explicitly provided, not schema defaults)
      ...(validatedData.fontSize !== 48 ? { fontSize: validatedData.fontSize } : {}),
      ...(validatedData.fontFamily !== 'Inter-Bold.ttf' ? { fontFamily: validatedData.fontFamily } : {}),
      ...(validatedData.wordMode ? { wordMode: validatedData.wordMode } : {}),
      ...(validatedData.wordsPerGroup ? { wordsPerGroup: validatedData.wordsPerGroup } : {}),
    };

    const gpuEnabled = process.env.USE_GPU === 'true'
    console.log(`🎬 Starting video processing service... (GPU: ${gpuEnabled ? 'ENABLED' : 'disabled'})`)
    
    // Download video to temp file first (FFmpeg may not support HTTPS URLs directly)
    const tempDir = '/tmp'
    const tempInputPath = `${tempDir}/input-${Date.now()}.mp4`
    
    console.log(`📥 Downloading video from: ${validatedData.videoUrl}`)
    const videoResponse = await fetch(validatedData.videoUrl)
    if (!videoResponse.ok) {
      throw new Error(`Failed to download video: ${videoResponse.status}`)
    }
    
    const videoBuffer = Buffer.from(await videoResponse.arrayBuffer())
    const { writeFileSync, unlinkSync } = await import('fs')
    writeFileSync(tempInputPath, videoBuffer)
    console.log(`✅ Video downloaded to: ${tempInputPath} (${videoBuffer.length} bytes)`)
    
    try {
      // SubtitleProcessor.processAdvanced returns a Promise<PassThrough>
      const videoStream = await SubtitleProcessor.processAdvanced(
        tempInputPath, // Use local file instead of URL
        captionOptions,
        validatedData.videoOptions,
        validatedData.quality as any
      );

      // Clean up temp file after stream starts
      videoStream.on('end', () => {
        try { unlinkSync(tempInputPath) } catch {}
      });
      videoStream.on('error', () => {
        try { unlinkSync(tempInputPath) } catch {}
      });

      setHeader(event, 'Content-Type', 'video/mp4')
      setHeader(event, 'Content-Disposition', 'attachment; filename="processed-video.mp4"')
      
      return videoStream;
    } catch (err) {
      // Clean up on error
      try { unlinkSync(tempInputPath) } catch {}
      throw err;
    }

  } catch (error: any) {
    console.error('Video processing error:', error);
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
