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
      contrast: z.number().min(0.5).max(2).optional(),
      brightness: z.number().min(-0.5).max(0.5).optional(),
      rotation: z.number().min(-10).max(10).optional(),
      blur: z.number().min(0).max(10).optional(),
      sharpen: z.number().min(0).max(10).optional(),
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
      }).optional().default({}),
      trimStart: z.number().min(0).optional(),
      trimEnd: z.number().min(0).optional(),
      addHandle: z.string().optional(),
      handleX: z.number().min(0).max(100).optional(),
      handleY: z.number().min(0).max(100).optional()

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
      // Universal shadow strength option
      shadowStrength: z.number().min(0).max(5).optional().default(1.5),
      // Universal animation option
      animation: z.enum(['none', 'shake']).optional().default('none'),
      // Advanced subtitle styling options
      subtitleStyle: z.enum(['basic', 'girlboss', 'hormozi', 'tiktokstyle', 'thintobold', 'wavycolors', 'shrinkingpairs', 'revealenlarge', 'whiteimpact', 'impactfull']).optional().default('basic'),
      // Girlboss styling options
      girlbossColor: z.string().optional().default('#F361D8'),
      // HormoziViral options
      hormoziColors: z.array(z.string()).optional().default(['#0BF431', '#2121FF', '#1DE0FE', '#FFFF00']),
      // TikTokStyle options
      tiktokstyleColor: z.string().optional().default('#FFFF00'),
      // ThinToBold options  
      thinToBoldColor: z.string().optional().default('#FFFFFF'),
      // WavyColors options
      wavyColorsOutlineWidth: z.number().min(1).max(5).optional().default(2),
      // ShrinkingPairs options
      shrinkingPairsColor: z.string().optional().default('#0BF431'),
      // RevealEnlarge options
      revealEnlargeColors: z.array(z.string()).optional().default(['#0BF431', '#2121FF', '#1DE0FE', '#FFFF00']),
      // Word processing mode options
      wordMode: z.enum(['normal', 'single', 'multiple']).optional().default('normal'),
      wordsPerGroup: z.number().min(1).max(10).optional().default(1)
    }).optional()
  })
}

export const TextReplacementSchemas = {
  textReplacementSchema: z.object({
    url: z.string().url('Invalid video URL'),
    outputName: z.string().regex(/^[a-zA-Z0-9_-]+$/, 'Output name can only contain letters, numbers, underscores and hyphens').optional().default('text_replaced_video'),
    textReplacements: z.array(z.object({
      region: z.object({
        x: z.number().min(0).max(10000).optional(),
        y: z.number().min(0).max(10000),
        width: z.number().min(1).max(10000),
        height: z.number().min(1).max(10000),
        centerHorizontally: z.boolean().optional().default(false)
      }),
      background: z.object({
        color: z.enum(['black', 'white', 'transparent']).default('black'),
        opacity: z.number().min(0).max(1).default(1)
      }).optional().default({}),
      text: z.string().min(1, 'Replacement text cannot be empty'),
      textStyle: z.object({
        fontSize: z.number().min(8).max(200).default(24),
        fontColor: z.string().default('#FFFFFF'),
        fontFamily: z.string().default('Arial'),
        fontWeight: z.enum(['normal', 'bold']).default('normal'),
        fontStyle: z.enum(['normal', 'italic']).default('normal'),
        alignment: z.enum(['left', 'center', 'right']).default('center'),
        verticalAlignment: z.enum(['top', 'center', 'bottom']).default('center'),
        outlineWidth: z.number().min(0).max(10).default(0),
        outlineColor: z.string().default('#000000'),
        shadowOffsetX: z.number().min(-50).max(50).default(0),
        shadowOffsetY: z.number().min(-50).max(50).default(0),
        shadowColor: z.string().default('#000000'),
        shadowOpacity: z.number().min(0).max(1).default(0)
      }).optional().default({})
    })).min(1, 'At least one text replacement is required'),
    options: z.object({
      speedFactor: z.number().min(0.5).max(2).optional(),
      zoomFactor: z.number().min(1).max(2).optional(),
      saturationFactor: z.number().min(0.5).max(2).optional(),
      lightness: z.number().min(-0.5).max(0.5).optional()
    }).optional().default({})
  })
}

export const OCRSchemas = {
  extractTextSchema: z.object({
    url: z.string().url('Invalid video URL'),
    numberOfFrames: z.number().min(1).max(20).optional().default(5),
    language: z.string().optional().default('eng'),
    confidenceThreshold: z.number().min(0).max(100).optional().default(50)
  })
}

export const VideoTextReplacementSchemas = {
  replaceVideoTextSchema: z.object({
    url: z.string().url('Invalid video URL'),
    outputName: z.string().regex(/^[a-zA-Z0-9_-]+$/, 'Output name can only contain letters, numbers, underscores and hyphens').optional().default('replaced_text_video'),
    replacements: z.record(z.string(), z.string()).refine(
      (data) => Object.keys(data).length > 0,
      { message: 'At least one text replacement is required' }
    ),
    detectionOptions: z.object({
      numberOfFrames: z.number().min(1).max(20).optional().default(10),
      language: z.string().optional().default('eng'),
      confidenceThreshold: z.number().min(0).max(100).optional().default(70)
    }).optional().default({}),
    styleOptions: z.object({
      fontFamily: z.string().optional().default('Arial'),
      fontSize: z.number().min(12).max(72).optional().default(24),
      fontColor: z.string().optional().default('#000000'),
      backgroundColor: z.string().optional().default('#FFFFFF'),
      backgroundOpacity: z.number().min(0).max(1).optional().default(1.0)
    }).optional().default({})
  })
}

export type VideoProcessingOptions = z.infer<typeof ValidationSchemas.bodySchema>['options']
export type CaptionOptions = z.infer<typeof ValidationSchemas.bodySchema>['caption']
export type TextReplacementOptions = z.infer<typeof TextReplacementSchemas.textReplacementSchema>