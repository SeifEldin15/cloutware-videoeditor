import { 
  SubtitleSegment, 
  GirlbossStyle, 
  GirlbossResult, 
  formatTime, 
  calculateNextPosition 
} from '../subtitleUtils';
import { convertColorToASS } from '../colorUtils';

/**
 * Girlboss Animation: Progressive word coloring with pink highlight and glow effect
 * Words are highlighted one by one in sequence with colored text and glow shadow
 * 
 * @param subtitle - The subtitle segment to animate
 * @param start - Start time in seconds
 * @param end - End time in seconds
 * @param style - Style configuration including color, shadow, and animation options
 * @param lastPosition - Previous position for shake animation continuity
 * @returns Either a string of events or an object with events and position for shake animation
 */
export const Girlboss = (
  subtitle: SubtitleSegment,
  start: number,
  end: number,
  style: GirlbossStyle & { 
    outlineWidth?: number; 
    outlineColor?: string; 
    outlineBlur?: number 
  },
  lastPosition: { x: number; y: number } | null = null
): GirlbossResult | string => {
  // Input validation
  if (!subtitle?.text?.trim()) {
    console.warn('Girlboss animation: Empty or invalid subtitle text provided');
    return '';
  }

  if (start >= end) {
    console.warn('Girlboss animation: Invalid time range - start must be before end');
    return '';
  }

  try {
    const words = subtitle.text.split(' ').filter(word => word.trim() !== '');
    if (words.length === 0) {
      console.warn('Girlboss animation: No valid words found in subtitle text');
      return '';
    }

    const totalDuration = end - start;
    const timePerWord = totalDuration / words.length;
    
    // Color processing with fallbacks
    let textColor: string;
    let lightGlowColorASS: string;
    try {
      textColor = style.color ? convertColorToASS(style.color) : convertColorToASS('#F361D8');
      lightGlowColorASS = convertColorToASS(style.color || '#F361D8');
    } catch (error) {
      console.warn('Girlboss animation: Invalid color provided, using default pink');
      textColor = convertColorToASS('#F361D8');
      lightGlowColorASS = convertColorToASS('#F361D8');
    }
    
    // Calculate shadow/glow intensity based on shadowStrength with bounds checking
    const shadowStrength = Math.max(0, Math.min(5, style.shadowStrength ?? 1.0));
    const glowEnabled = shadowStrength > 0;
    const effectiveShadowStrength = shadowStrength > 1 ? shadowStrength + 0.2 : shadowStrength;
    const shadowAlpha = Math.max(50, Math.min(255, Math.round(133 - (effectiveShadowStrength * 24))));
    const blurAlpha = Math.max(20, Math.min(255, Math.round(96 - (effectiveShadowStrength * 28))));
    
    const events: string[] = [];
    let currentPosition = lastPosition || { x: 670, y: 0 };

    // Handle outline settings with defaults
    const outlineWidth = Math.max(0, style.outlineWidth || 2);
    const outlineColorASS = (() => {
      try {
        return convertColorToASS(style.outlineColor || '#000000');
      } catch {
        return convertColorToASS('#000000');
      }
    })();
    const outlineBlur = Math.max(0, style.outlineBlur || 0);

    // Generate events for each word
    words.forEach((word, index) => {
      const wordStart = start + index * timePerWord;
      const wordEnd = start + (index + 1) * timePerWord;
      
      // Build colored words - current and previous words are colored, future words are white
      const coloredWords = words.map((w, i) => {
        if (i === index || i < index) {
          return `{\\c${textColor}\\bord${outlineWidth}\\3c${outlineColorASS}\\blur${outlineBlur}\\shad0}${w}`;
        } else {
          return `{\\c&HFFFFFF&\\bord${outlineWidth}\\3c${outlineColorASS}\\blur${outlineBlur}\\shad0}${w}`;
        }
      }).join(' ');
      
      // Handle shake animation movement
      let moveTag = '';
      if (style?.animation === 'shake') {
        try {
          const duration = wordEnd - wordStart;
          const endPosition = calculateNextPosition(
            currentPosition.x,
            currentPosition.y,
            duration
          );
          const marginV = style?.verticalPosition 
            ? Math.max(0, Math.min(720, Math.round((720 * (100 - style.verticalPosition)) / 100)))
            : 0;
          moveTag = `\\move(${Math.round(currentPosition.x)},${Math.round(currentPosition.y + marginV)},${Math.round(endPosition.x)},${Math.round(endPosition.y + marginV)})`;
          currentPosition = endPosition;
        } catch (error) {
          console.warn('Girlboss animation: Error calculating shake movement, using static position');
          moveTag = '';
        }
      }

      // Build glow effect for active words and white glow for inactive words (only if glow is enabled)
      const glowWords = glowEnabled ? words.map((w, i) => {
        if (i === index || i < index) {
          const borderWidth = Math.max(0.1, 0.1 * effectiveShadowStrength);
          const blurAmount = Math.max(1, 3 * effectiveShadowStrength);
          return `{${moveTag}\\c${lightGlowColorASS}\\bord${borderWidth}\\blur${blurAmount}\\3c${lightGlowColorASS}\\4c${lightGlowColorASS}\\4a&H${blurAlpha.toString(16)}&\\3a&H${shadowAlpha.toString(16)}&}${w}`;
        } else {
          // Add white glow for inactive (white) words
          const whiteBorderWidth = Math.max(0.1, 0.1 * effectiveShadowStrength);
          const whiteBlurAmount = Math.max(1, 3 * effectiveShadowStrength);
          const whiteGlowColorASS = convertColorToASS('#FFFFFF');
          return `{${moveTag}\\c${whiteGlowColorASS}\\bord${whiteBorderWidth}\\blur${whiteBlurAmount}\\3c${whiteGlowColorASS}\\4c${whiteGlowColorASS}\\4a&H${blurAlpha.toString(16)}&\\3a&H${shadowAlpha.toString(16)}&}${w}`;
        }
      }).join(' ') : '';

      // Apply move tag to colored words if shake animation is enabled
      const finalColoredWords = moveTag
        ? words.map((w, i) => {
            if (i === index || i < index) {
              return `{${moveTag}\\c${textColor}\\bord${outlineWidth}\\3c${outlineColorASS}\\blur${outlineBlur}\\shad0}${w}`;
            } else {
              return `{\\c&HFFFFFF&\\bord${outlineWidth}\\3c${outlineColorASS}\\blur${outlineBlur}\\shad0}${w}`;
            }
          }).join(' ')
        : coloredWords;

      // Add glow layer only if glow is enabled, always add text layer
      if (glowEnabled && glowWords) {
        events.push(`Dialogue: 1,${formatTime(wordStart)},${formatTime(wordEnd)},Default,,0,0,0,,${glowWords}`);
      }
      events.push(`Dialogue: 2,${formatTime(wordStart)},${formatTime(wordEnd)},Default,,0,0,0,,${finalColoredWords}`);
    });
    
    // Return appropriate format based on animation type
    return style?.animation === 'shake' ? {
      events: events.join('\n'),
      lastPosition: currentPosition
    } : events.join('\n');

  } catch (error) {
    console.error('Girlboss animation: Unexpected error during processing:', error);
    return '';
  }
}; 