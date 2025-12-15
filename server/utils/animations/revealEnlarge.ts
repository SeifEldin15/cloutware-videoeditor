import { formatTime, calculateNextPosition, type SubtitleSegment, type GirlbossStyle } from '../subtitleUtils';
import { convertColorToASS } from '../colorUtils';
import { type Position, type AnimationResult } from './types';

export interface RevealEnlargeStyle extends GirlbossStyle {
  textOutlineWidth?: number;
  alternateColors?: string[];
  textOutlineColor?: string;
}

/**
 * Calculate scaled outline width based on style and scale factor
 */
const getScaledOutlineWidth = (style: RevealEnlargeStyle, scaleFactor: number = 0.75): number => {
  return style?.textOutlineWidth ? style.textOutlineWidth * scaleFactor : 0;
};

/**
 * Create reveal enlarge animation where words are revealed one by one with enlarging effect
 * and cycling through alternate colors
 * 
 * @param subtitle - The subtitle segment containing text
 * @param start - Start time in seconds
 * @param end - End time in seconds
 * @param style - Style configuration with optional alternate colors
 * @param lastPosition - Previous position for shake animation continuity
 * @returns Animation result with events and last position, or just events string
 */
export const RevealEnlarge = (
  subtitle: SubtitleSegment,
  start: number,
  end: number,
  style: RevealEnlargeStyle,
  lastPosition: Position | null = null
): AnimationResult | string => {
  if (!subtitle?.text) {
    return style?.animation === 'shake' ? { events: '', lastPosition: lastPosition || { x: 670, y: 0 } } : '';
  }

  const words = subtitle.text.split(' ').filter(word => word.trim() !== '');
  if (words.length === 0) {
    return style?.animation === 'shake' ? { events: '', lastPosition: lastPosition || { x: 670, y: 0 } } : '';
  }

  const totalDuration = end - start;
  const timePerWord = totalDuration / words.length;
  const events: string[] = [];

  // Shadow calculations
  const shadowStrength = style.shadowStrength && style.shadowStrength > 1 
    ? style.shadowStrength * 0.8
    : (style.shadowStrength ?? 1) * 0.5;
  
  const glowEnabled = (style?.shadowStrength ?? 1) > 0;
  const shadowAlpha = Math.round(Math.max(0, Math.min(255, 150 - (shadowStrength * 20))));
  const blurAlpha = Math.round(Math.max(0, Math.min(255, 120 - (shadowStrength * 20))));

  // Color configuration
  const defaultColors = ['0BF431', '2121FF', '1DE0FE', 'FFFF00'];
  const defaultShadowColors = ['2BFF51', '1914B3', '1DE0FE', 'FFFF00'];
  
  const textColors = style?.alternateColors && style.alternateColors.length > 0
    ? style.alternateColors.map(color => {
        try {
          return convertColorToASS(color).replace(/&H|&/g, '');
        } catch (error) {
          console.warn(`Invalid color "${color}", using default`);
          return defaultColors[0];
        }
      })
    : defaultColors;

  const shadowColors = style?.alternateColors && style.alternateColors.length > 0
    ? style.alternateColors.map(color => {
        try {
          return convertColorToASS(color).replace(/&H|&/g, '');
        } catch (error) {
          console.warn(`Invalid shadow color "${color}", using default`);
          return defaultShadowColors[0];
        }
      })
    : defaultShadowColors;

  // Outline configuration
  const outlineWidth = style.textOutlineWidth || 2;
  const outlineColor = style.textOutlineColor 
    ? convertColorToASS(style.textOutlineColor).replace(/&H|&/g, '') 
    : '000000';

  const whiteASS = convertColorToASS('#FFFFFF');
  let currentPosition: Position = lastPosition || { x: 670, y: 0 };

  words.forEach((word, index) => {
    const wordStart = start + index * timePerWord;
    const wordEnd = start + (index + 1) * timePerWord;

    // Calculate position and movement
    let moveTag = '';
    if (style?.animation === 'shake') {
      const duration = wordEnd - wordStart;
      const endPosition = calculateNextPosition(
        currentPosition.x,
        currentPosition.y,
        duration
      );
      const marginV = style?.verticalPosition 
        ? Math.round((720 * (100 - style.verticalPosition)) / 100)
        : 0;
      moveTag = `\\move(${Math.round(currentPosition.x)},${Math.round(currentPosition.y + marginV)},${Math.round(endPosition.x)},${Math.round(endPosition.y + marginV)})`;
      currentPosition = endPosition;
    }

    // Create main text layer - all words with current word highlighted and enlarged
    const coloredText = words.map((w, i) => {
      if (i === index) {
        // Current word - colored and enlarged
        return `{${moveTag}\\fscx100\\fscy100\\t(0,150,\\fscx120\\fscy120)\\c&H${textColors[index % textColors.length]}&\\bord${outlineWidth}\\3c&H${outlineColor}&}${w}`;
      } else {
        // Other words - white and normal size
        return `{\\fscx100\\fscy100\\c${whiteASS}\\bord${outlineWidth}\\3c&H${outlineColor}&}${w}`;
      }
    }).join(' ');
    
    // Create shadow layer - matches main text but with blur and alpha
    const shadowText = glowEnabled ? words.map((w, i) => {
      if (i === index) {
        // Current word shadow - colored with blur
        return `{${moveTag}\\fscx100\\fscy100\\t(0,150,\\fscx120\\fscy120)\\c&H${shadowColors[index % shadowColors.length]}&\\bord${outlineWidth}\\blur${1.5 * shadowStrength}\\3c&H${outlineColor}&\\3a&H${shadowAlpha.toString(16)}&\\4c&H${outlineColor}&\\4a&H${blurAlpha.toString(16)}&\\xshad0\\yshad${-0.5}}${w}`;
      } else {
        // Other words shadow - outline colored with blur
        return `{\\fscx100\\fscy100\\c&H${outlineColor}&\\bord${outlineWidth}\\blur${1.5 * shadowStrength}\\3c&H${outlineColor}&\\3a&H${shadowAlpha.toString(16)}&\\4c&H${outlineColor}&\\4a&H${blurAlpha.toString(16)}&\\xshad0\\yshad${-0.5}}${w}`;
      }
    }).join(' ') : '';
    
    // Add shadow layer first (layer 0, behind)
    if (glowEnabled && shadowText) {
      events.push(`Dialogue: 0,${formatTime(wordStart)},${formatTime(wordEnd)},Default,,0,0,0,,${shadowText}`);
    }
    // Add main text layer second (layer 1, in front)
    events.push(`Dialogue: 1,${formatTime(wordStart)},${formatTime(wordEnd)},Default,,0,0,0,,${coloredText}`);
  });
  
  return style?.animation === 'shake' ? {
    events: events.join('\n'),
    lastPosition: currentPosition
  } : events.join('\n');
}; 