import { 
  SubtitleSegment, 
  GirlbossStyle, 
  GirlbossResult, 
  formatTime, 
  calculateNextPosition 
} from '../subtitleUtils';
import { convertColorToASS } from '../colorUtils';

export const tiktokStyleAnimation = (
  subtitle: SubtitleSegment,
  start: number,
  end: number,
  style: GirlbossStyle & { 
    color?: string;
    outlineWidth?: number; 
    outlineColor?: string; 
    outlineBlur?: number 
  },
  lastPosition: { x: number; y: number } | null = null
): GirlbossResult | string => {
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

    const totalDuration = end - start;
    const timePerWord = totalDuration / words.length;

    // Color processing — default yellow instead of pink
    let textColor: string;
    let lightGlowColorASS: string;
    try {
      textColor = style.color ? convertColorToASS(style.color) : convertColorToASS('#FFFF00');
      lightGlowColorASS = convertColorToASS(style.color || '#FFFF00');
    } catch (error) {
      console.warn('TikTok style animation: Invalid color provided, using default yellow');
      textColor = convertColorToASS('#FFFF00');
      lightGlowColorASS = convertColorToASS('#FFFF00');
    }

    const shadowStrength = Math.max(0, Math.min(5, style.shadowStrength ?? 1.0));
    const glowEnabled = shadowStrength > 0;
    const effectiveShadowStrength = shadowStrength > 1 ? shadowStrength + 0.2 : shadowStrength;
    const shadowAlpha = Math.max(50, Math.min(255, Math.round(133 - (effectiveShadowStrength * 24))));
    const blurAlpha = Math.max(20, Math.min(255, Math.round(96 - (effectiveShadowStrength * 28))));

    const events: string[] = [];
    let currentPosition = lastPosition || { x: 670, y: 0 };

    const outlineWidth = Math.max(0, style.outlineWidth || 2);
    const outlineColorASS = (() => {
      try {
        return convertColorToASS(style.outlineColor || '#000000');
      } catch {
        return convertColorToASS('#000000');
      }
    })();
    const outlineBlur = Math.max(0, style.outlineBlur || 0);

    words.forEach((word, index) => {
      const wordStart = start + index * timePerWord;
      const wordEnd = start + (index + 1) * timePerWord;

      const coloredWords = words.map((w, i) => {
        if (i === index || i < index) {
          return `{\\c${textColor}\\bord${outlineWidth}\\3c${outlineColorASS}\\blur${outlineBlur}\\shad0}${w}`;
        } else {
          return `{\\c&HFFFFFF&\\bord${outlineWidth}\\3c${outlineColorASS}\\blur${outlineBlur}\\shad0}${w}`;
        }
      }).join(' ');

      let moveTag = '';
      if (style?.animation === 'shake') {
        try {
          const duration = wordEnd - wordStart;
          const endPosition = calculateNextPosition(currentPosition.x, currentPosition.y, duration);
          const marginV = style?.verticalPosition
            ? Math.max(0, Math.min(720, Math.round((720 * (100 - style.verticalPosition)) / 100)))
            : 0;
          moveTag = `\\move(${Math.round(currentPosition.x)},${Math.round(currentPosition.y + marginV)},${Math.round(endPosition.x)},${Math.round(endPosition.y + marginV)})`;
          currentPosition = endPosition;
        } catch (error) {
          console.warn('TikTok style animation: Error calculating shake movement, using static position');
          moveTag = '';
        }
      }

      const glowWords = glowEnabled ? words.map((w, i) => {
        if (i === index || i < index) {
          const borderWidth = Math.max(0.1, 0.1 * effectiveShadowStrength);
          const blurAmount = Math.max(1, 3 * effectiveShadowStrength);
          return `{${moveTag}\\c${lightGlowColorASS}\\bord${borderWidth}\\blur${blurAmount}\\3c${lightGlowColorASS}\\4c${lightGlowColorASS}\\4a&H${blurAlpha.toString(16)}&\\3a&H${shadowAlpha.toString(16)}&}${w}`;
        } else {
          const whiteBorderWidth = Math.max(0.1, 0.1 * effectiveShadowStrength);
          const whiteBlurAmount = Math.max(1, 3 * effectiveShadowStrength);
          const whiteGlowColorASS = convertColorToASS('#FFFFFF');
          return `{${moveTag}\\c${whiteGlowColorASS}\\bord${whiteBorderWidth}\\blur${whiteBlurAmount}\\3c${whiteGlowColorASS}\\4c${whiteGlowColorASS}\\4a&H${blurAlpha.toString(16)}&\\3a&H${shadowAlpha.toString(16)}&}${w}`;
        }
      }).join(' ') : '';

      const finalColoredWords = moveTag
        ? words.map((w, i) => {
            if (i === index || i < index) {
              return `{${moveTag}\\c${textColor}\\bord${outlineWidth}\\3c${outlineColorASS}\\blur${outlineBlur}\\shad0}${w}`;
            } else {
              return `{\\c&HFFFFFF&\\bord${outlineWidth}\\3c${outlineColorASS}\\blur${outlineBlur}\\shad0}${w}`;
            }
          }).join(' ')
        : coloredWords;

      if (glowEnabled && glowWords) {
        events.push(`Dialogue: 1,${formatTime(wordStart)},${formatTime(wordEnd)},Default,,0,0,0,,${glowWords}`);
      }
      events.push(`Dialogue: 2,${formatTime(wordStart)},${formatTime(wordEnd)},Default,,0,0,0,,${finalColoredWords}`);
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