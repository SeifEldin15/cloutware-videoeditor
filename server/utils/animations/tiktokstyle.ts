import { 
  SubtitleSegment, 
  GirlbossStyle, 
  GirlbossResult, 
  formatTime, 
  calculateNextPosition 
} from '../subtitleUtils';
import { convertColorToASS } from '../colorUtils';

/**
 * TikTok Style Animation: Single color highlights with global word tracking
 * Each word gets the same color with glow effects (like hormozi but single color)
 * Supports both single word and multi-word segments with consistent single color
 * 
 * @param subtitle - The subtitle segment to animate
 * @param start - Start time in seconds
 * @param end - End time in seconds
 * @param style - Style configuration including color, shadow, and animation options
 * @param lastPosition - Previous position for shake animation continuity
 * @returns Either a string of events or an object with events and position for shake animation
 */
export const tiktokStyleAnimation = (
  subtitle: SubtitleSegment,
  start: number,
  end: number,
  style: GirlbossStyle & { 
    color?: string; 
    shadowColor?: string; 
    outlineWidth?: number; 
    outlineColor?: string; 
    outlineBlur?: number 
  },
  lastPosition: { x: number; y: number } | null = null
): GirlbossResult | string => {
  // Input validation
  if (!subtitle?.text?.trim()) {
    console.warn('TikTok style animation: Empty or invalid subtitle text provided');
    return '';
  }

  if (start >= end) {
    console.warn('TikTok style animation: Invalid time range - start must be before end');
    return '';
  }

  try {
    const words = subtitle.text.split(' ').filter(word => word.trim() !== '');
    if (words.length === 0) {
      console.warn('TikTok style animation: No valid words found in subtitle text');
      return '';
    }

    const timePerWord = (end - start) / words.length;
    
    // Shadow strength with bounds checking - same calculation as girlboss
    const shadowStrength = Math.max(0, Math.min(5, style.shadowStrength ?? 4));
    const glowEnabled = shadowStrength > 0;
    const effectiveShadowStrength = shadowStrength > 1 ? shadowStrength + 0.2 : 1;
    const shadowAlpha = Math.max(50, Math.min(255, Math.round(133 - (effectiveShadowStrength * 24))));
    const blurAlpha = Math.max(20, Math.min(255, Math.round(96 - (effectiveShadowStrength * 28))));
    
    // Single color processing with fallback
    const defaultColor = 'FFFF00'; // Default yellow
    let tiktokColor: string;
    let glowColor: string;

    try {
      tiktokColor = style?.color
        ? convertColorToASS(style.color).replace('&H', '').replace('&', '')
        : defaultColor;
      glowColor = tiktokColor; // Same color for glow
    } catch (error) {
      console.warn('TikTok style animation: Error processing color, using default');
      tiktokColor = defaultColor;
      glowColor = tiktokColor;
    }

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
    
    let events: string[] = [];
    let currentPosition = lastPosition || { x: 670, y: 0 };
    
    // Handle single word case
    if (words.length === 1) {
      const borderWidth = Math.max(0.1, 0.1 * effectiveShadowStrength);
      const blurAmount = Math.max(1, 4 * effectiveShadowStrength);

      let moveTag = '';
      if (style?.animation === 'shake') {
        try {
          const duration = end - start;
          const endPosition = calculateNextPosition(currentPosition.x, currentPosition.y, duration);
          const marginV = style?.verticalPosition 
            ? Math.max(0, Math.min(720, Math.round((720 * (100 - style.verticalPosition)) / 100)))
            : 0;
          moveTag = `\\move(${Math.round(currentPosition.x)},${Math.round(currentPosition.y + marginV)},${Math.round(endPosition.x)},${Math.round(endPosition.y + marginV)})`;
          currentPosition = endPosition;
        } catch (error) {
          console.warn('TikTok style animation: Error calculating shake movement for single word');
          moveTag = '';
        }
      }

      const coloredText = `{${moveTag}\\c&H${tiktokColor}&\\bord${outlineWidth}\\3c${outlineColorASS}\\blur${outlineBlur}\\shad0}${words[0]}`;
      const glowText = glowEnabled ? `{${moveTag}\\c&H${glowColor}&\\bord${borderWidth}\\blur${blurAmount}\\3c&H${glowColor}&\\3a&H${shadowAlpha.toString(16)}&\\4c&H${glowColor}&\\4a&H${blurAlpha.toString(16)}&\\xshad0\\yshad${-1}}${words[0]}` : '';

      if (glowEnabled && glowText) {
        events.push(`Dialogue: 0,${formatTime(start)},${formatTime(end)},Default,,0,0,0,,${glowText}`);
      }
      events.push(`Dialogue: 1,${formatTime(start)},${formatTime(end)},Default,,0,0,0,,${coloredText}`);

      return style?.animation === 'shake' ? {
        events: events.join('\n'),
        lastPosition: currentPosition
      } : events.join('\n');
    }

    // Handle multi-word case
    words.forEach((word, index) => {
      const wordStart = start + index * timePerWord;
      const wordEnd = start + (index + 1) * timePerWord;
      const duration = wordEnd - wordStart;

      const borderWidth = Math.max(0.1, 0.1 * effectiveShadowStrength);
      const blurAmount = Math.max(1, 4 * effectiveShadowStrength);

      let moveTag = '';
      if (style?.animation === 'shake') {
        try {
          const endPosition = calculateNextPosition(currentPosition.x, currentPosition.y, duration);
          const marginV = style?.verticalPosition 
            ? Math.max(0, Math.min(720, Math.round((720 * (100 - style.verticalPosition)) / 100)))
            : 0;
          moveTag = `\\move(${Math.round(currentPosition.x)},${Math.round(currentPosition.y + marginV)},${Math.round(endPosition.x)},${Math.round(endPosition.y + marginV)})`;
          currentPosition = endPosition;
        } catch (error) {
          console.warn(`TikTok style animation: Error calculating shake movement for word ${index}`);
          moveTag = '';
        }
      }

      // Build colored text - current word gets the single color, others stay white
      const coloredText = words.map((w, i) => {
        if (i === index) {
          return `{${moveTag}\\c&H${tiktokColor}&\\bord${outlineWidth}\\3c${outlineColorASS}\\blur${outlineBlur}\\shad0}${w}`;
        } else {
          return `{\\c&HFFFFFF&\\bord${outlineWidth}\\3c${outlineColorASS}\\blur${outlineBlur}\\shad0}${w}`;
        }
      }).join(' ');

      // Build glow text - current word has color glow, inactive words have white glow
      const glowText = glowEnabled ? words.map((w, i) => {
        if (i === index) {
          return `{${moveTag}\\c&H${glowColor}&\\bord${borderWidth}\\blur${blurAmount}\\3c&H${glowColor}&\\3a&H${shadowAlpha.toString(16)}&\\4c&H${glowColor}&\\4a&H${blurAlpha.toString(16)}&\\xshad0\\yshad${-1}}${w}`;
        } else {
          // Add white glow for inactive (white) words
          const whiteGlowColor = 'FFFFFF';
          return `{${moveTag}\\c&H${whiteGlowColor}&\\bord${borderWidth}\\blur${blurAmount}\\3c&H${whiteGlowColor}&\\3a&H${shadowAlpha.toString(16)}&\\4c&H${whiteGlowColor}&\\4a&H${blurAlpha.toString(16)}&\\xshad0\\yshad${-1}}${w}`;
        }
      }).join(' ') : '';

      if (glowEnabled && glowText) {
        events.push(`Dialogue: 0,${formatTime(wordStart)},${formatTime(wordEnd)},Default,,0,0,0,,${glowText}`);
      }
      events.push(`Dialogue: 1,${formatTime(wordStart)},${formatTime(wordEnd)},Default,,0,0,0,,${coloredText}`);
    });

    return style?.animation === 'shake' ? {
      events: events.join('\n'),
      lastPosition: currentPosition
    } : events.join('\n');

  } catch (error) {
    console.error('TikTok style animation: Unexpected error during processing:', error);
    return '';
  }
}; 