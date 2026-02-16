import { z } from 'zod'
import { readBody, setHeader } from 'h3'
import { SubtitleProcessor } from '../utils/subtitle-processor'

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
  // Quality settings
  quality: z.enum(['fast', 'standard', 'high', 'premium']).default('premium'),
  // Optional word processing overrides
  wordMode: z.enum(['normal', 'single', 'multiple']).optional(),
  wordsPerGroup: z.number().min(1).max(10).optional(),
  trimStart: z.number().min(0).optional(),
  trimEnd: z.number().min(0).optional()
});

// Map template names to validation schema format
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

// Get optimal word processing mode for each template
function getWordModeForTemplate(template: string): 'normal' | 'single' | 'multiple' {
  const wordModeSettings: Record<string, 'normal' | 'single' | 'multiple'> = {
    'girlboss': 'multiple',        // Works well with 2-3 words at a time for emphasis
    'hormozi': 'single',           // Best with individual word highlighting
    'tiktokstyle': 'single',       // TikTok style emphasizes individual words
    'whiteimpact': 'single',       // White impact designed for word-by-word reveals
    'impactfull': 'single',        // Maximum impact with individual words
    'thinToBold': 'single',        // Progressive weight change works per word
    'wavyColors': 'single',        // Wavy animations work best word-by-word
    'revealEnlarge': 'multiple',   // Revealing groups of words creates better flow
    'shrinkingPairs': 'multiple'   // Pairs work better with multiple words
  };
  
  return wordModeSettings[template] || 'normal';
}

// Get optimal words per group for templates using 'multiple' mode
function getWordsPerGroupForTemplate(template: string): number {
  const wordsPerGroupSettings: Record<string, number> = {
    'girlboss': 2,           // 2 words for confident emphasis
    'hormozi': 1,            // Single words for business impact
    'tiktokstyle': 1,        // Individual words for viral effect
    'whiteimpact': 1,        // Single words for clean impact
    'impactfull': 1,         // Single words for maximum impact
    'thinToBold': 1,         // Progressive effect per word
    'wavyColors': 1,         // Wavy effect per word
    'revealEnlarge': 3,      // 3 words for smooth reveals
    'shrinkingPairs': 2      // Pairs of words
  };
  
  return wordsPerGroupSettings[template] || 1;
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const validatedData = requestSchema.parse(body);

    // If no transcription provided, we need to get one first
    if (!validatedData.transcription) {
      throw new Error('Transcription is required for video processing. Please run transcription first.');
    }

    // Map vertical position to proper values for ASS positioning
    const getVerticalPositionValue = (position: string) => {
      switch (position) {
        case 'top': return 85    // Near top of video
        case 'center': return 50 // Middle of video  
        case 'bottom': return 15 // Near bottom of video (default)
        default: return 15
      }
    }

    // Create caption options for the subtitle processor
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
      // Existing template options
      girlbossColor: validatedData.primaryColor,
      hormoziColors: [validatedData.primaryColor, validatedData.secondaryColor, '#1DE0FE', '#FFFF00'],
      tiktokstyleColor: validatedData.primaryColor,
      thinToBoldColor: validatedData.primaryColor,
      wavyColorsOutlineWidth: 2,
      shrinkingPairsColor: validatedData.primaryColor,
      revealEnlargeColors: [validatedData.primaryColor, validatedData.secondaryColor, '#1DE0FE', '#FFFF00'],
      // New template options
      whiteimpactColor: validatedData.primaryColor,
      impactfullColor: validatedData.primaryColor,
      // Template-specific word processing configuration (with optional user overrides)
      wordMode: validatedData.wordMode || getWordModeForTemplate(validatedData.template),
      wordsPerGroup: validatedData.wordsPerGroup || getWordsPerGroupForTemplate(validatedData.template)
    };

    // Process video with advanced subtitles
    console.log(`🎬 Starting video processing with ${validatedData.quality} quality...`)
    console.log(`📍 Vertical position: ${validatedData.verticalPosition} -> ${getVerticalPositionValue(validatedData.verticalPosition)}`)
    const videoOptions = {
      trimStart: validatedData.trimStart,
      trimEnd: validatedData.trimEnd
    } as any;

    const videoStream = await SubtitleProcessor.processAdvanced(
      validatedData.videoUrl,
      captionOptions,
      videoOptions, // videoOptions
      validatedData.quality
    );

    console.log('✅ Video processing completed, returning stream...')
    
    // Return the video stream directly to the client
    setHeader(event, 'Content-Type', 'video/mp4')
    setHeader(event, 'Content-Disposition', 'attachment; filename="processed-video.mp4"')
    setHeader(event, 'Cache-Control', 'no-cache')
    
    return videoStream;

  } catch (error) {
    console.error('Video processing error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    throw createError({
      statusCode: 400,
      statusMessage: `Failed to process video: ${errorMessage}`
    });
  }
});