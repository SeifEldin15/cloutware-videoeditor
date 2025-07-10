import { CaptionOptions } from './validation-schemas'

export interface StyleTemplate {
  name: string
  description: string
  fontFamily: string
  wordMode: string
  wordsPerGroup: number
  configuration: Partial<CaptionOptions>
}

export const styleTemplates: Record<string, StyleTemplate> = {
  girlboss: {
    name: 'Girlboss',
    description: 'Bold, energetic style with shake animation and pink colors (single word emphasis)',
    fontFamily: 'Luckiest Guy',
    wordMode: 'multiple',
    wordsPerGroup: 2,
    configuration: {
      subtitleStyle: 'girlboss',
      fontFamily: 'Luckiest Guy',
      fontSize: 32,
      girlbossColor: '#FF1493',
      shadowStrength: 2.0,
      animation: 'shake',
      verticalPosition: 18,
      outlineWidth: 3,
      outlineColor: '#000000',
      outlineBlur: 1,
      wordMode: 'multiple',
      wordsPerGroup: 2
    }
  },
  
  hormozi: {
    name: 'Hormozi',
    description: 'High-energy multi-color style for attention-grabbing content (single word impact)',
    fontFamily: 'Luckiest Guy',
    wordMode: 'multiple',
    wordsPerGroup: 4,
    configuration: {
      subtitleStyle: 'hormozi',
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
      wordsPerGroup: 4
    }
  },
  
  tiktokstyle: {
    name: 'TikTok Style',
    description: 'Single vibrant color style perfect for social media content',
    fontFamily: 'Luckiest Guy',
    configuration: {
      subtitleStyle: 'tiktokstyle',
      fontFamily: 'Luckiest Guy',
      fontSize: 50,
      tiktokstyleColor: '#FFFF00',
      shadowStrength: 0.5,
      animation: 'shake',
      verticalPosition: 15,
      outlineWidth: 2,
      outlineColor: '#000000',
      outlineBlur: 0,
      wordMode: 'multiple',
      wordsPerGroup: 2
    }
  },
  
  thintobold: {
    name: 'Thin to Bold',
    description: 'Elegant style with smooth transitions from thin to bold font',
    fontFamily: 'Montserrat Thin',
    configuration: {
      subtitleStyle: 'thintobold',
      fontFamily: 'Montserrat Thin',
      fontSize: 50,
      thinToBoldColor: '#FFFFFF',
      shadowStrength: 1.8,
      animation: 'none',
      verticalPosition: 22,
      outlineWidth: 0.5,
      outlineColor: '#000000',
      outlineBlur: 1,
      wordMode: 'normal',
      wordsPerGroup: 4
    }
  },
  
  wavycolors: {
    name: 'Wavy Colors',
    description: 'Rainbow-colored text with wavy animations',
    fontFamily: 'Luckiest Guy',
    configuration: {
      subtitleStyle: 'wavycolors',
      fontFamily: 'Luckiest Guy',
      fontSize: 50,
      wavyColorsOutlineWidth: 3,
      verticalPosition: 12,
      outlineWidth: 2,
      outlineColor: '#000000',
      outlineBlur: 1,
      wordMode: 'multiple',
      wordsPerGroup: 1
    }
  },
  
  shrinkingpairs: {
    name: 'Shrinking Pairs',
    description: 'Dynamic shrinking effect perfect for multiple word groups',
    fontFamily: 'Luckiest Guy',
    configuration: {
      subtitleStyle: 'shrinkingpairs',
      fontFamily: 'Luckiest Guy',
      fontSize: 36,
      shrinkingPairsColor: '#FFFFFF',
      shadowStrength: 2.5,
      animation: 'shake',
      verticalPosition: 20,
      outlineWidth: 3,
      outlineColor: '#000000',
      outlineBlur: 1,
      wordMode: 'multiple',
      wordsPerGroup: 4
    }
  },
  
  revealenlarge: {
    name: 'Reveal & Enlarge',
    description: 'Color-cycling text with reveal and enlarge effects',
    fontFamily: 'Luckiest Guy',
    configuration: {
      subtitleStyle: 'revealenlarge',
      fontFamily: 'Luckiest Guy',
      fontSize: 50,
      revealEnlargeColors: ['#FF0000', '#00FF00', '#0080FF', '#FFFF00', '#FF1493'],
      shadowStrength: 3.0,
      animation: 'shake',
      verticalPosition: 16,
      outlineWidth: 2,
      outlineColor: '#000000',
      outlineBlur: 1,
      wordMode: 'multiple',
      wordsPerGroup: 4
    }
  },
  
  basic: {
    name: 'Basic',
    description: 'Clean and professional style for business content',
    fontFamily: 'Arial',
    configuration: {
      subtitleStyle: 'basic',
      fontSize: 32,
      fontColor: 'white',
      fontStyle: 'bold',
      subtitlePosition: 'bottom',
      horizontalAlignment: 'center',
      verticalPosition: 35,
      showBackground: true,
      backgroundColor: 'black@0.8',
      outlineWidth: 3,
      outlineColor: '#000000',
      outlineBlur: 0,
      wordMode: 'normal',
      wordsPerGroup: 1
    }
  }
}

export function getStyleTemplate(templateName: string): StyleTemplate | null {
  return styleTemplates[templateName.toLowerCase()] || null
}

export function listAvailableTemplates(): StyleTemplate[] {
  return Object.values(styleTemplates)
}

export function applyTemplate(templateName: string, userOptions: Partial<CaptionOptions> = {}): CaptionOptions {
  const template = getStyleTemplate(templateName)
  if (!template) {
    throw new Error(`Template '${templateName}' not found. Available templates: ${Object.keys(styleTemplates).join(', ')}`)
  }
  
  // Merge template configuration with user options (user options take precedence)
  return {
    ...template.configuration,
    ...userOptions
  } as CaptionOptions
} 