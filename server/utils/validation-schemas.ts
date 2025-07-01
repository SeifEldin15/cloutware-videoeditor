import { z } from 'zod'

export const ValidationSchemas = {
  querySchema: z.object({
    format: z.enum(['mp4', 'gif', 'png']).optional()
  }),

  bodySchema: z.object({
    url: z.string().url('Invalid video URL'),
    outputName: z.string().regex(/^[a-zA-Z0-9_-]+$/, 'Output name can only contain letters, numbers, underscores and hyphens').optional().default('encoded_video'),
    format: z.enum(['mp4', 'gif', 'png']).optional().default('mp4'),
    options: z.object({
      speedFactor: z.number().min(0.5).max(2).optional(),
      zoomFactor: z.number().min(1).max(2).optional(),
      saturationFactor: z.number().min(0.5).max(2).optional(),
      framerate: z.number().optional(),
      lightness: z.number().min(-0.5).max(0.5).optional(),
      subtitleText: z.string().optional(),
      resolution: z.string().optional(),
      audioPitch: z.number().min(0.5).max(1.5).optional(),
      backgroundAudio: z.boolean().optional().default(false),
      backgroundAudioVolume: z.number().min(0.05).max(0.5).optional().default(0.2),
      smartCrop: z.object({
        percentage: z.number().min(0.1).max(2).optional(),
        direction: z.enum(['center', 'top', 'bottom', 'left', 'right', 'random']).optional()
      }).optional(),
      temporalModification: z.object({
        dropFrames: z.number().min(0).max(10).optional(),
        duplicateFrames: z.number().min(0).max(10).optional(),
        reverseSegments: z.boolean().optional()
      }).optional(),
      audioTempoMod: z.object({
        tempoFactor: z.number().min(0.8).max(1.2).optional(),
        preservePitch: z.boolean().optional()
      }).optional(),
      syncShift: z.number().min(-500).max(500).optional(),
      eqAdjustments: z.object({
        low: z.number().min(-5).max(5).optional(),
        mid: z.number().min(-5).max(5).optional(),
        high: z.number().min(-5).max(5).optional()
      }).optional(),
      reverbEffect: z.object({
        level: z.number().min(0.05).max(0.2).optional(),
        delay: z.number().min(20).max(100).optional()
      }).optional(),
      backgroundAddition: z.object({
        type: z.enum(['room', 'crowd', 'nature', 'white_noise']).optional(),
        level: z.number().min(0.01).max(0.1).optional()
      }).optional(),
      metadata: z.record(z.string()).optional(),
      visibleChanges: z.object({
        horizontalFlip: z.boolean().optional().default(false),
        border: z.boolean().optional().default(false),
        timestamp: z.boolean().optional().default(false)
      }).optional().default({}),
      antiDetection: z.object({
        pixelShift: z.boolean().optional().default(true),
        microCrop: z.boolean().optional().default(true),
        subtleRotation: z.boolean().optional().default(true),
        noiseAddition: z.boolean().optional().default(true),
        metadataPoisoning: z.boolean().optional().default(true),
        frameInterpolation: z.boolean().optional().default(true)
      }).optional().default({})
    }).optional().default({}),
    caption: z.object({
      srtContent: z.string().optional(),
      fontSize: z.number().min(10).max(72).optional().default(24),
      fontColor: z.string().optional().default('white'),
      fontFamily: z.string().optional().default('Sans'),
      fontStyle: z.enum(['regular', 'bold', 'italic']).optional().default('regular'),
      subtitlePosition: z.enum(['top', 'middle', 'bottom']).optional().default('bottom'),
      horizontalAlignment: z.enum(['left', 'center', 'right']).optional().default('center'),
      verticalMargin: z.number().min(10).max(100).optional().default(30),
      showBackground: z.boolean().optional().default(true),
      backgroundColor: z.string().optional().default('black@0.5'),
      // Universal outline options
      outlineWidth: z.number().min(0).max(8).optional().default(2),
      outlineColor: z.string().optional().default('#000000'),
      outlineBlur: z.number().min(0).max(10).optional().default(0),
      // Universal vertical position option
      verticalPosition: z.number().min(0).max(100).optional().default(15),
      // Advanced subtitle styling options
      subtitleStyle: z.enum(['basic', 'girlboss', 'hormozi', 'thintobold', 'wavycolors']).optional().default('basic'),
      // Girlboss styling options
      girlbossColor: z.string().optional().default('#F361D8'),
      girlbossShadowStrength: z.number().min(0.5).max(3).optional().default(1),
      girlbossAnimation: z.enum(['none', 'shake']).optional().default('none'),
      // HormoziViral options
      hormoziColors: z.array(z.string()).optional().default(['#0BF431', '#2121FF', '#1DE0FE', '#FFFF00']),
      hormoziShadowStrength: z.number().min(1).max(5).optional().default(3),
      hormoziAnimation: z.enum(['none', 'shake']).optional().default('none'),
      // ThinToBold options  
      thinToBoldColor: z.string().optional().default('#FFFFFF'),
      thinToBoldShadowStrength: z.number().min(0.5).max(3).optional().default(1),
      thinToBoldAnimation: z.enum(['none', 'shake']).optional().default('none'),
      // WavyColors options
      wavyColorsOutlineWidth: z.number().min(1).max(5).optional().default(2),
      // Word processing mode options
      wordMode: z.enum(['normal', 'single', 'multiple']).optional().default('normal'),
      wordsPerGroup: z.number().min(1).max(10).optional().default(1)
    }).optional()
  })
}

export type VideoProcessingOptions = z.infer<typeof ValidationSchemas.bodySchema>['options']
export type CaptionOptions = z.infer<typeof ValidationSchemas.bodySchema>['caption'] 