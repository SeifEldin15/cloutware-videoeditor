// Utility functions for subtitle processing
import { join } from 'path';
import { convertColorToASS } from './colorUtils';

import { RevealEnlarge } from './animations/revealEnlarge';
import { shrinkingColorsPairAnimation } from './animations/shrinkingPairs';
import { Girlboss } from './animations/girlboss';
import { alternatingColorsAnimation } from './animations/hormozi';
import { ThinToBold } from './animations/thinToBold';
import { Wavycolors } from './animations/wavyColors';
import { tiktokStyleAnimation } from './animations/tiktokstyle';
import { whiteImpactAnimation } from './animations/whiteimpact';
import { impactFullAnimation } from './animations/impactfull';

export const formatTime = (seconds: number): string => {
  const pad = (num: number) => num.toString().padStart(2, '0');
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${pad(hours)}:${pad(minutes)}:${pad(secs)}.${pad(ms)}`;
};

export const formatTimeForSRT = (seconds: number): string => {
  const pad = (num: number) => num.toString().padStart(2, '0');
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${pad(hours)}:${pad(minutes)}:${pad(secs)},${ms.toString().padStart(3, '0')}`;
};



export const calculateNextPosition = (
  currentX: number,
  currentY: number,
  duration: number
): { x: number; y: number } => {
  // Simple shake animation calculation
  const shakeIntensity = 5;
  const randomX = (Math.random() - 0.5) * shakeIntensity;
  const randomY = (Math.random() - 0.5) * shakeIntensity;
  
  return {
    x: currentX + randomX,
    y: currentY + randomY
  };
};

export interface SubtitleSegment {
  text: string;
  start: number;
  end: number;
  wordStartIndex?: number; 
}

export interface GirlbossStyle {
  color?: string;
  shadowStrength?: number;
  animation?: string;
  verticalPosition?: number;
}

export interface GirlbossResult {
  events: string;
  lastPosition?: { x: number; y: number };
}

export const generateASSFile = (
  subtitles: SubtitleSegment[],
  style: GirlbossStyle & {
    fontSize?: number;
    fontFamily?: string;
    textAlign?: string;
    verticalPosition?: number;
  },
  styleType?: string
): string => {
  if (subtitles.length === 0) return '';

  const fontSize = style.fontSize || 50;
  const fontFamily = getStyleFont(styleType || 'basic', style.fontFamily);
  const alignment = style.textAlign === 'left' ? '1' : style.textAlign === 'right' ? '3' : '2';
  const marginV = Math.round((720 * (100 - (style.verticalPosition || 50))) / 100);

  const fontColorASS = convertColorToASS(style.color || '#FFFFFF');
  const systemFontFamily = fontFamily;
  const boldValue = fontFamily === 'Luckiest Guy' ? 1 : 0; // Bold for Luckiest Guy font
  
  const header = `[Script Info]
ScriptType: v4.00+
PlayResX: 1280
PlayResY: 720
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,${fontFamily},${fontSize},${fontColorASS},&H000000FF&,&H00000000&,&H00000000&,${boldValue},0,0,0,100,100,0,0,1,2,0,${alignment},10,10,${marginV},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  let lastPosition: { x: number; y: number } | null = null;
  
  const events = subtitles.map((sub) => {
    const result = Girlboss(sub, sub.start, sub.end, style, lastPosition);
    
    if (typeof result === 'object' && result.lastPosition) {
      lastPosition = result.lastPosition;
      return result.events;
    }
    
    return result as string;
  }).join('\n');

  return header + events;
};

export const getStyleFont = (styleType: string, defaultFont?: string): string => {
  const fontMappings: Record<string, string> = {
    'alternatingBoldThinAnimation': 'Montserrat-Thin',
    'ThinToBold': 'Montserrat-Thin',
    'thintobold': 'Montserrat-Thin',
    'HormoziViralSentence2': 'Luckiest Guy',
    'PewDiePie': 'Luckiest Guy',
    'Enlarge': 'Luckiest Guy',
    'WormEffect': 'Luckiest Guy',
    'quickfox4': 'Luckiest Guy',
    'HormoziViralSentence4': 'Luckiest Guy',
    'ShrinkingPairs': 'Luckiest Guy',
    'Wavycolors': 'Luckiest Guy',
    'wavycolors': 'Luckiest Guy',
    'quickfox': 'Luckiest Guy',
    'Girlboss': 'Luckiest Guy',
    'girlboss': 'Luckiest Guy',
    'GreenToRedPair': 'Luckiest Guy',
    'hormoziViral': 'Luckiest Guy',
    'hormozi': 'Luckiest Guy',
    'tiktokstyle': 'Luckiest Guy',
    'quickfox5': 'Luckiest Guy',
    'RevealEnlarge': 'Luckiest Guy',
    'TrendingAli': 'Luckiest Guy',
    'HormoziViralSentence': 'Luckiest Guy',
    'weakGlitch': 'Luckiest Guy',
    'HormoziViralWord': 'Luckiest Guy',
    'SimpleDisplay': 'Luckiest Guy',
    'none': 'Luckiest Guy',
    'whiteimpact': 'Impact',
    'impactfull': 'Impact',
    
    // Basic uses Arial
    'basic': 'Arial'
  };

  return defaultFont || fontMappings[styleType] || 'Arial';
};

export const getFontFilePath = (fontFamily: string): string => {
  const fontFileMap: Record<string, string> = {
    'Montserrat Thin': 'Montserrat Thin.ttf',
    'Montserrat': 'Montserrat.ttf',
    'Luckiest Guy': 'luckiestguy.ttf',  
    'Arial': 'arial.ttf',
    'Arial Black': 'Arial Black.ttf',
    'Impact': 'impact.ttf',
    'Helvetica': 'helvetica.ttf',
    'Georgia': 'georgia.ttf',
    'Times New Roman': 'TimesNewRoman.ttf',
    'Verdana': 'Verdana.ttf',
    'Trebuchet': 'Trebuchet.ttf',
    'Comic Sans MS': 'Comic Sans MS.ttf',
    'Courier New': 'Courier New.ttf',
    'Garamond': 'Garamond.ttf',
    'Palatino Linotype': 'Palatino Linotype.ttf',
    'Bookman Old Style': 'Bookman Old Style.ttf',
    'Erica One': 'Erica One.ttf',
    'Bungee': 'bungee.ttf',
    'Sigmar': 'sigmar.ttf',
    'Sora': 'sora.ttf',
    'Tahoma': 'tahoma.ttf',
    'Gotham Ultra': 'Gotham Ultra.ttf',
    'Bodoni Moda': 'Bodoni Moda.ttf',
    'Montserrat ExtraBold': 'Montserrat ExtraBold.ttf',
    'Montserrat Black': 'Montserrat Black.ttf'
  };
  
  const fontFile = fontFileMap[fontFamily];
  if (!fontFile) {
    return ''; 
  }
  
  const fontPath = join(process.cwd(), 'public', 'fonts', fontFile);
  
  // Ensure path separators are consistent for cross-platform compatibility
  return fontPath.replace(/\\/g, '/');
};

export const generateFontsSection = (fontFamily: string): string => {
  const fontFilePath = getFontFilePath(fontFamily);
  if (!fontFilePath) {
    return '';    
  }
  
  const fontKey = fontFamily.toLowerCase().replace(/\s+/g, '_');
  return `[Fonts]
${fontKey}: ${fontFilePath}`;
};

export const generateAdvancedASSFile = (
  subtitles: SubtitleSegment[],
  style: GirlbossStyle & {
    fontSize?: number;
    fontFamily?: string;
    fontFilePath?: string; // NEW: Direct font file path
    textAlign?: string;
    verticalPosition?: number;
    alternateColors?: string[];
    textOutlineWidth?: number;
    outlineWidth?: number;
    outlineColor?: string;
    outlineBlur?: number;
    wordsPerGroup?: number;
  },
  styleType: string
): string => {
  if (subtitles.length === 0) return '';

  const fontSize = style.fontSize || 50;
  const fontFamily = getStyleFont(styleType, style.fontFamily);
  const alignment = style.textAlign === 'left' ? '1' : style.textAlign === 'right' ? '3' : '2';
  
  // Proper vertical position mapping for ASS subtitles
  let marginV;
  const verticalPos = style.verticalPosition || 15;
  if (verticalPos >= 80) {
    // Top position (80-90 range)
    marginV = Math.round(720 * 0.85); // Near top
  } else if (verticalPos >= 45 && verticalPos <= 55) {
    // Center position (45-55 range)
    marginV = Math.round(720 * 0.5); // Middle
  } else {
    // Bottom position (10-25 range)
    marginV = Math.round(720 * 0.15); // Near bottom
  }

  const fontColorASS = convertColorToASS(style.color || '#FFFFFF');
  const boldValue = (fontFamily.includes('Arial Black') || fontFamily.includes('Luckiest Guy') || fontFamily.toLowerCase().includes('black')) ? 1 : 0;
  
  // Handle outline settings
  const outlineWidth = style.outlineWidth || 2;
  const outlineColorASS = convertColorToASS(style.outlineColor || '#000000');
  const shadowValue = style.outlineBlur || 0;
  
  console.log(`🎨 ASS File using font: "${fontFamily}" (Bold: ${boldValue}, Outline: ${outlineWidth}, Shadow: ${shadowValue})`);
  
  const header = `[Script Info]
ScriptType: v4.00+
PlayResX: 1280
PlayResY: 720
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,${fontFamily},${fontSize},${fontColorASS},&H000000FF&,${outlineColorASS},&H00000000&,${boldValue},0,0,0,100,100,0,0,1,${outlineWidth},${shadowValue},${alignment},10,10,${marginV},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  let lastPosition: { x: number; y: number } | null = null;
  
  const events = subtitles.map((sub) => {
    let result: GirlbossResult | string;
    
    switch (styleType) {
      case 'girlboss':
        result = Girlboss(sub, sub.start, sub.end, style, lastPosition);
        break;
      case 'hormozi':
        result = alternatingColorsAnimation(sub, sub.start, sub.end, style, lastPosition);
        break;
      case 'tiktokstyle':
        result = tiktokStyleAnimation(sub, sub.start, sub.end, style, lastPosition);
        break;
      case 'thintobold':
        result = ThinToBold(sub, sub.start, sub.end, style, lastPosition);
        break;
      case 'wavycolors':
        result = Wavycolors(sub, sub.start, sub.end, style);
        break;
      case 'shrinkingpairs':
        result = shrinkingColorsPairAnimation(sub, sub.start, sub.end, style, lastPosition);
        break;
      case 'revealenlarge':
        result = RevealEnlarge(sub, sub.start, sub.end, style, lastPosition);
        break;
      case 'whiteimpact':
        result = whiteImpactAnimation(sub, sub.start, sub.end, style, lastPosition);
        break;
      case 'impactfull':
        result = impactFullAnimation(sub, sub.start, sub.end, style, lastPosition);
        break;
      default:
        result = Girlboss(sub, sub.start, sub.end, style, lastPosition);
    }
    
    if (typeof result === 'object' && result.lastPosition) {
      lastPosition = result.lastPosition;
      return result.events;
    }
    
    return result as string;
  }).join('\n');

  return header + events;
};

export const parseSRT = (srtContent: string): SubtitleSegment[] => {
  const segments: SubtitleSegment[] = [];
  const blocks = srtContent.trim().split('\n\n');
  
  for (const block of blocks) {
    const lines = block.trim().split('\n');
    if (lines.length < 3) continue;
    
    const timeLine = lines[1];
    const timeMatch = timeLine.match(/(\d{2}):(\d{2}):(\d{2}),(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2}),(\d{3})/);
    
    if (!timeMatch) continue;
    
    const start = parseInt(timeMatch[1]) * 3600 + 
                  parseInt(timeMatch[2]) * 60 + 
                  parseInt(timeMatch[3]) + 
                  parseInt(timeMatch[4]) / 1000;
    
    const end = parseInt(timeMatch[5]) * 3600 + 
                parseInt(timeMatch[6]) * 60 + 
                parseInt(timeMatch[7]) + 
                parseInt(timeMatch[8]) / 1000;
    
    const text = lines.slice(2).join(' ');
    
    segments.push({ text, start, end });
  }
  
  return segments;
};

export const generateSRT = (segments: SubtitleSegment[]): string => {
  return segments.map((segment, index) => {
    const startTime = formatTimeForSRT(segment.start);
    const endTime = formatTimeForSRT(segment.end);
    return `${index + 1}\n${startTime} --> ${endTime}\n${segment.text}`;
  }).join('\n\n');
};

/**
 * Splits subtitle segments into word-level segments based on the specified word mode
 * @param segments - Original subtitle segments
 * @param wordMode - 'normal' (no splitting), 'single' (one word per segment), 'multiple' (multiple words per segment)
 * @param wordsPerGroup - Number of words per group when using 'multiple' mode
 * @returns Array of word-level subtitle segments
 */
export const processWordModeSegments = (
  segments: SubtitleSegment[],
  wordMode: 'normal' | 'single' | 'multiple',
  wordsPerGroup: number = 1
): SubtitleSegment[] => {
  if (wordMode === 'normal') {
    return segments;
  }

  const wordSegments: SubtitleSegment[] = [];
  let globalWordIndex = 0; // Track global word position for color alternation

  for (const segment of segments) {
    const words = segment.text.split(' ').filter(word => word.trim() !== '');
    const duration = segment.end - segment.start;
    
    if (wordMode === 'single') {
      // Split into individual words
      const timePerWord = duration / words.length;
      
      words.forEach((word, index) => {
        const wordStart = segment.start + (index * timePerWord);
        const wordEnd = segment.start + ((index + 1) * timePerWord);
        
        wordSegments.push({
          text: word,
          start: wordStart,
          end: wordEnd,
          wordStartIndex: globalWordIndex 
        });
        
        globalWordIndex++; 
      });
    } else if (wordMode === 'multiple') {
      const wordGroups: string[] = [];
      
      for (let i = 0; i < words.length; i += wordsPerGroup) {
        const group = words.slice(i, i + wordsPerGroup).join(' ');
        wordGroups.push(group);
      }
      
      const timePerGroup = duration / wordGroups.length;
      
      wordGroups.forEach((group, groupIndex) => {
        const groupStart = segment.start + (groupIndex * timePerGroup);
        const groupEnd = segment.start + ((groupIndex + 1) * timePerGroup);
        
        wordSegments.push({
          text: group,
          start: groupStart,
          end: groupEnd,
          wordStartIndex: globalWordIndex
        });
        
        const wordsInGroup = group.split(' ').length;
        globalWordIndex += wordsInGroup;
      });
    }
  }

  return wordSegments;
}; 