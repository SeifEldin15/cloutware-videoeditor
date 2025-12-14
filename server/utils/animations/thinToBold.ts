import { 
  SubtitleSegment, 
  GirlbossStyle, 
  GirlbossResult, 
  formatTime, 
  calculateNextPosition 
} from '../subtitleUtils';
import { convertColorToASS } from '../colorUtils';

/**
 * ThinToBold Animation: Word pairs with thin-to-bold font transformation
 * Groups words into pairs, displays them vertically with thin font initially
 * Current pair becomes bold and enlarged while others remain thin
 * 
 * @param subtitle - The subtitle segment to animate
 * @param start - Start time in seconds
 * @param end - End time in seconds
 * @param style - Style configuration including color, shadow, and animation options
 * @param lastPosition - Previous position for shake animation continuity
 * @returns Either a string of events or an object with events and position for shake animation
 */
export const ThinToBold = (
  subtitle: SubtitleSegment,
  start: number,
  end: number,
  style: GirlbossStyle & { 
    outlineWidth?: number; 
    outlineColor?: string; 
    outlineBlur?: number;
    wordsPerGroup?: number;
  },
  lastPosition: { x: number; y: number } | null = null
): GirlbossResult | string => {
  // Input validation
  if (!subtitle?.text?.trim()) {
    console.warn('ThinToBold animation: Empty or invalid subtitle text provided');
    return '';
  }

  if (start >= end) {
    console.warn('ThinToBold animation: Invalid time range - start must be before end');
    return '';
  }

  try {
    const words = subtitle.text.split(' ').filter(word => word.trim() !== '');
    if (words.length === 0) {
      console.warn('ThinToBold animation: No valid words found in subtitle text');
      return '';
    }

    const totalDuration = end - start;
    
    // Group words based on wordsPerGroup setting (default to 2 for backward compatibility)
    const groupSize = Math.max(1, style.wordsPerGroup || 2);
    const wordPairs: string[] = [];
    for (let i = 0; i < words.length; i += groupSize) {
      const group = words.slice(i, i + groupSize).join(' ');
      wordPairs.push(group);
    }

    if (wordPairs.length === 0) {
      console.warn('ThinToBold animation: No word pairs created');
      return '';
    }

    const timePerPair = totalDuration / wordPairs.length;
    
    // Color processing with fallbacks
    let textColor: string;
    let textShadowColor: string;
    try {
      textColor = convertColorToASS(style.color || '#FFFFFF');
      textShadowColor = convertColorToASS(style.color || '#FFFFFF');
    } catch (error) {
      console.warn('ThinToBold animation: Invalid color provided, using white');
      textColor = convertColorToASS('#FFFFFF');
      textShadowColor = convertColorToASS('#FFFFFF');
    }
    
    // Shadow strength with bounds checking
    const shadowStrength = Math.max(0, Math.min(5, style.shadowStrength ?? 1.5));
    const glowEnabled = shadowStrength > 0;
    const effectiveShadowStrength = shadowStrength > 1 ? shadowStrength + 0.2 : shadowStrength;
    
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
    
    let currentPosition = lastPosition || { x: 670, y: 0 };
    let events: string[] = []; 

    // Generate events for each word pair
    wordPairs.forEach((pair, index) => {
      const pairStart = start + index * timePerPair; 
      const pairEnd = start + (index + 1) * timePerPair; 

      let moveTag = '';
      if (style?.animation === 'shake') {
        try {
          const duration = pairEnd - pairStart;
          const endPosition = calculateNextPosition(currentPosition.x, currentPosition.y, duration);
          const marginV = style?.verticalPosition 
            ? Math.max(0, Math.min(720, Math.round((720 * (100 - style.verticalPosition)) / 100)))
            : 0;
          moveTag = `\\move(${Math.round(currentPosition.x)},${Math.round(currentPosition.y + marginV)},${Math.round(endPosition.x)},${Math.round(endPosition.y + marginV)})`;
          currentPosition = endPosition;
        } catch (error) {
          console.warn(`ThinToBold animation: Error calculating shake movement for pair ${index}`);
          moveTag = '';
        }
      }

      // Build colored text - current pair is bold and enlarged, others are thin
      const coloredText = wordPairs.map((w, i) => {
        if (i === index) {
          return `{${moveTag}\\c${textColor}\\bord${outlineWidth}\\3c${outlineColorASS}\\blur${outlineBlur}\\fn@Montserrat\\fscx120\\fscy120}${w}`;
        }
        return `{\\c${textColor}\\bord${outlineWidth}\\3c${outlineColorASS}\\blur${outlineBlur}\\fn@Montserrat Thin}${w}`;
      }).join('\\N'); // \\N creates line breaks for vertical display
      
      // Build glow text with shadow effects for current pair
      const glowText = glowEnabled ? wordPairs.map((w, i) => {
        if (i === index) {
          const shadowAlpha = Math.max(50, Math.min(255, Math.round(133 - (effectiveShadowStrength * 24))));
          const blurAlpha = Math.max(20, Math.min(255, Math.round(96 - (effectiveShadowStrength * 28))));
          const borderWidth = Math.max(0.1, 0.1 * effectiveShadowStrength);
          const blurAmount = Math.max(1, 4 * effectiveShadowStrength);
          
          return `{${moveTag}\\c${textShadowColor}\\bord${borderWidth}\\blur${blurAmount}\\3c${textShadowColor}\\3a&H${shadowAlpha.toString(16)}&\\4c${textShadowColor}\\4a&H${blurAlpha.toString(16)}&\\xshad0\\yshad${-1}\\fn@Montserrat\\fscx120\\fscy120}${w}`;
        }
        return `{\\c${textShadowColor}\\bord${outlineWidth}\\3c${outlineColorASS}\\blur${outlineBlur}\\shad0\\fn@Montserrat Thin}${w}`;
      }).join('\\N') : '';
      
      // Add glow and text events
      if (glowEnabled && glowText) {
        events.push(`Dialogue: 0,${formatTime(pairStart)},${formatTime(pairEnd)},Default,,0,0,0,,${glowText}`);
      }
      events.push(`Dialogue: 1,${formatTime(pairStart)},${formatTime(pairEnd)},Default,,0,0,0,,${coloredText}`);
    });
    
    // Return appropriate format based on animation type
    return style?.animation === 'shake' ? {
      events: events.join('\n'),
      lastPosition: currentPosition
    } : events.join('\n');

  } catch (error) {
    console.error('ThinToBold animation: Unexpected error during processing:', error);
    return '';
  }
}; 