import { 
  SubtitleSegment, 
  GirlbossStyle, 
  GirlbossResult, 
  formatTime, 
  calculateNextPosition 
} from '../subtitleUtils';
import { convertColorToASS } from '../colorUtils';

export const impactFullAnimation = (
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
  if (!subtitle?.text?.trim()) {
    console.warn('Impact Full animation: Empty or invalid subtitle text provided');
    return '';
  }

  if (start >= end) {
    console.warn('Impact Full animation: Invalid time range - start must be before end');
    return '';
  }

  try {
    const completeText = subtitle.text.trim();
    
    const shadowStrength = Math.max(0.5, Math.min(5, style.shadowStrength || 2.0));
    const shadowAlpha = Math.max(50, Math.min(255, Math.round(150 - (shadowStrength * 20))));
    const blurAlpha = Math.max(20, Math.min(255, Math.round(120 - (shadowStrength * 20))));
    
    const whiteColor = 'FFFFFF';
    const glowColor = whiteColor;

    const outlineWidth = Math.max(2, style.outlineWidth || 3);
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
    
    const borderWidth = Math.max(0.5, 0.5 * shadowStrength);
    const blurAmount = Math.max(1, 2 * shadowStrength);

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
        console.warn('Impact Full animation: Error calculating movement');
        moveTag = '';
      }
    }

    const coloredText = `{${moveTag}\\c&H${whiteColor}&\\bord${outlineWidth}\\3c${outlineColorASS}\\blur${outlineBlur}\\shad0}${completeText}`;
    const glowText = `{${moveTag}\\c&H${glowColor}&\\bord${borderWidth}\\blur${blurAmount}\\3c&H${outlineColorASS}&\\3a&H${shadowAlpha.toString(16)}&\\4c&H${glowColor}&\\4a&H${blurAlpha.toString(16)}&\\xshad0\\yshad${-1}}${completeText}`;

    events.push(`Dialogue: 0,${formatTime(start)},${formatTime(end)},Default,,0,0,0,,${glowText}`);
    events.push(`Dialogue: 1,${formatTime(start)},${formatTime(end)},Default,,0,0,0,,${coloredText}`);

    return style?.animation === 'shake' ? {
      events: events.join('\n'),
      lastPosition: currentPosition
    } : events.join('\n');

  } catch (error) {
    console.error('Impact Full animation: Unexpected error during processing:', error);
    return '';
  }
}; 