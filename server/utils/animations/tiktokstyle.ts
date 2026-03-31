import { 
  SubtitleSegment,
  GirlbossStyle,
  GirlbossResult,
  formatTime,
  calculateNextPosition
} from '../subtitleUtils';
import { convertColorToASS } from '../colorUtils';

/**
 * TikTok Style: Shows each word group fully highlighted (all yellow) for its full duration.
 * One ASS event per segment — no per-word sub-splitting.
 * Shake animation uses \\move() within the single segment event to avoid duplication.
 */
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
  if (!subtitle?.text?.trim()) return '';
  if (start >= end) return '';

  try {
    const words = subtitle.text.split(' ').filter(w => w.trim() !== '');
    if (words.length === 0) return '';

    let textColor: string;
    let lightGlowColorASS: string;
    try {
      textColor = style.color ? convertColorToASS(style.color) : convertColorToASS('#FFFF00');
      lightGlowColorASS = convertColorToASS(style.color || '#FFFF00');
    } catch {
      textColor = convertColorToASS('#FFFF00');
      lightGlowColorASS = convertColorToASS('#FFFF00');
    }

    const shadowStrength = Math.max(0, Math.min(5, style.shadowStrength ?? 1.0));
    const glowEnabled = shadowStrength > 0;
    const effectiveShadowStrength = shadowStrength > 1 ? shadowStrength + 0.2 : shadowStrength;
    const shadowAlpha = Math.max(50, Math.min(255, Math.round(133 - effectiveShadowStrength * 24)));
    const blurAlpha   = Math.max(20, Math.min(255, Math.round(96  - effectiveShadowStrength * 28)));

    const outlineWidth = Math.max(0, style.outlineWidth || 6);
    const outlineColorASS = (() => {
      try { return convertColorToASS(style.outlineColor || '#000000'); }
      catch { return convertColorToASS('#000000'); }
    })();
    const outlineBlur = Math.max(0, style.outlineBlur || 0);

    // Build shake \\move() tag if animation === 'shake'
    let moveTag = '';
    let endPosition = lastPosition || { x: 640, y: 0 };

    if (style?.animation === 'shake') {
      try {
        const startPos = lastPosition || { x: 640, y: 0 };
        endPosition = calculateNextPosition(startPos.x, startPos.y, end - start);
        const marginV = style?.verticalPosition
          ? Math.max(0, Math.min(720, Math.round((720 * (100 - style.verticalPosition)) / 100)))
          : 0;
        moveTag = `\\move(${Math.round(startPos.x)},${Math.round(startPos.y + marginV)},${Math.round(endPosition.x)},${Math.round(endPosition.y + marginV)})`;
      } catch {
        moveTag = '';
      }
    }

    const textLine = words
      .map(w => `{${moveTag}\\c${textColor}\\bord${outlineWidth}\\3c${outlineColorASS}\\blur${outlineBlur}\\shad0}${w}`)
      .join(' ');

    const events: string[] = [];

    if (glowEnabled) {
      const borderWidth = Math.max(0.1, 0.1 * effectiveShadowStrength);
      const blurAmount  = Math.max(1,   3   * effectiveShadowStrength);
      const glowLine = words
        .map(w => `{${moveTag}\\c${lightGlowColorASS}\\bord${borderWidth}\\blur${blurAmount}\\3c${lightGlowColorASS}\\4c${lightGlowColorASS}\\4a&H${blurAlpha.toString(16)}&\\3a&H${shadowAlpha.toString(16)}&}${w}`)
        .join(' ');
      events.push(`Dialogue: 1,${formatTime(start)},${formatTime(end)},Default,,0,0,0,,${glowLine}`);
    }
    events.push(`Dialogue: 2,${formatTime(start)},${formatTime(end)},Default,,0,0,0,,${textLine}`);

    return style?.animation === 'shake'
      ? { events: events.join('\n'), lastPosition: endPosition }
      : events.join('\n');

  } catch (error) {
    console.error('TikTok style animation: Unexpected error:', error);
    return '';
  }
};