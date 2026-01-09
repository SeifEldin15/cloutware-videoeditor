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

    const getVerticalPositionValue = (position: string) => {
      switch (position) {
        case 'top': return 85
        case 'center': return 50
        case 'bottom': return 15
        default: return 15
      }
    }

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
      wordsPerGroup: validatedData.wordsPerGroup || getWordsPerGroupForTemplate(validatedData.template)
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
