import { formatTime, calculateNextPosition, type SubtitleSegment, type GirlbossStyle } from '../subtitleUtils';
import { convertColorToASS } from '../colorUtils';
import { type Position, type AnimationResult } from './types';

export interface ShrinkingPairsStyle extends GirlbossStyle {
  textOutlineWidth?: number;
  color?: string;
  textOutlineColor?: string;
  wordsPerGroup?: number;
}

/**
 * Calculate scaled outline width based on style and scale factor
 */
const getScaledOutlineWidth = (style: ShrinkingPairsStyle, scaleFactor: number = 0.75): number => {
  return style?.textOutlineWidth ? style.textOutlineWidth * scaleFactor : 0;
};

/**
 * Create shrinking pairs animation where text pairs start large and shrink to normal size
 * with color transitions from main color to white
 * 
 * @param subtitle - The subtitle segment containing text
 * @param start - Start time in seconds
 * @param end - End time in seconds  
 * @param style - Style configuration
 * @param lastPosition - Previous position for shake animation continuity
 * @returns Animation result with events and last position, or just events string
 */
export const shrinkingColorsPairAnimation = (
  subtitle: SubtitleSegment,
  start: number,
  end: number,
  style: ShrinkingPairsStyle,
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
  const wordPairs: string[] = [];
  
  // Group words based on wordsPerGroup setting (default to 2 for backward compatibility)
  const groupSize = Math.max(1, style?.wordsPerGroup || 2);
  for (let i = 0; i < words.length; i += groupSize) {
    const group = words.slice(i, i + groupSize).join(' ');
    if (group.trim()) {
      wordPairs.push(group);
    }
  }

  if (wordPairs.length === 0) {
    return style?.animation === 'shake' ? { events: '', lastPosition: lastPosition || { x: 670, y: 0 } } : '';
  }

  // Animation parameters
  const timePerPair = totalDuration / wordPairs.length;
  const startScale = 120;
  const endScale = 100;
  const shrinkDuration = 450;
  const lineSpacing = 35;

  // Style calculations
  const outlineWidth = getScaledOutlineWidth(style);
  const shadowStrength = style?.shadowStrength ? style.shadowStrength * 0.7 : 1;
  const glowEnabled = (style?.shadowStrength ?? 1) > 0;
  const shadowAlpha = Math.round(Math.max(0, Math.min(255, 140 - (shadowStrength * 0.5))));
  const blurAlpha = Math.round(Math.max(0, Math.min(255, 120 - (shadowStrength * 0.5))));

  // Colors
  const mainColor = style?.color 
    ? convertColorToASS(style.color).replace(/&H|&/g, '') 
    : '0BF431';
  const outlineColor = style?.textOutlineColor 
    ? convertColorToASS(style.textOutlineColor) 
    : '&H000000&';

  // Position management
  let currentPosition: Position = lastPosition || { x: 670, y: 0 };
  const events: string[] = [];

  wordPairs.forEach((pair, index) => {
    const pairStart = start + (index * timePerPair);
    const pairEnd = index === wordPairs.length - 1 ? end : pairStart + timePerPair;
    const nextPairStart = start + ((index + 1) * timePerPair);

    // Calculate position and movement
    let moveTag = '';
    if (style?.animation === 'shake') {
      const endPosition = calculateNextPosition(
        currentPosition.x,
        currentPosition.y,
        timePerPair
      );
      const marginV = style?.verticalPosition 
        ? Math.round((720 * (100 - style.verticalPosition)) / 100) + (index * lineSpacing)
        : index * lineSpacing;
      moveTag = `\\move(${Math.round(currentPosition.x)},${Math.round(currentPosition.y + marginV)},${Math.round(endPosition.x)},${Math.round(endPosition.y + marginV)})`;
      currentPosition = endPosition;
    } else {
      const marginV = style?.verticalPosition 
        ? Math.round((720 * (100 - style.verticalPosition)) / 100) + (index * lineSpacing)
        : index * lineSpacing;
      moveTag = `\\pos(${Math.round(currentPosition.x)},${marginV})`;
    }

    // Main colored text with shrinking animation
    const coloredText = `{${moveTag}\\c&H${mainColor}&\\3c${outlineColor}\\bord${outlineWidth}\\fscx${startScale}\\fscy${startScale}\\t(0,${shrinkDuration},\\fscx${endScale}\\fscy${endScale})}${pair}`;
    
    if (index < wordPairs.length - 1) {
      // Colored phase - shows until next pair starts
      events.push(`Dialogue: 1,${formatTime(pairStart)},${formatTime(nextPairStart)},Default,,0,0,0,,${coloredText}`);
      
      // Primary glow effect for colored phase
      if (glowEnabled) {
        const primaryGlow = `{${moveTag}\\alpha&HE0&\\c&H${mainColor}&\\bord3\\blur${10 * shadowStrength}\\3c&H${mainColor}&\\3a&H${shadowAlpha.toString(16)}&\\4c&H${mainColor}&\\4a&H${blurAlpha.toString(16)}&\\fscx${startScale}\\fscy${startScale}\\t(0,${shrinkDuration},\\fscx${endScale}\\fscy${endScale})}${pair}`;
        events.push(`Dialogue: 0,${formatTime(pairStart)},${formatTime(nextPairStart)},Default,,0,0,0,,${primaryGlow}`);
      }

      // White phase - shows from next pair start to end
      events.push(`Dialogue: 1,${formatTime(nextPairStart)},${formatTime(pairEnd)},Default,,0,0,0,,{${moveTag}\\c&HFFFFFF&\\3c${outlineColor}\\bord${outlineWidth}\\fscx${endScale}\\fscy${endScale}}${pair}`);
      
      // White glow effect for white phase
      if (glowEnabled) {
        const whiteGlow = `{${moveTag}\\alpha&HE0&\\c&HFFFFFF&\\bord3\\blur${10 * shadowStrength}\\3c&HFFFFFF&\\3a&H${shadowAlpha.toString(16)}&\\4c&HFFFFFF&\\4a&H${blurAlpha.toString(16)}&\\fscx${endScale}\\fscy${endScale}}${pair}`;
        events.push(`Dialogue: 0,${formatTime(nextPairStart)},${formatTime(pairEnd)},Default,,0,0,0,,${whiteGlow}`);
      }
    } else {
      // Last pair - only colored phase until end
      events.push(`Dialogue: 1,${formatTime(pairStart)},${formatTime(pairEnd)},Default,,0,0,0,,${coloredText}`);
      
      // Primary glow for last pair
      if (glowEnabled) {
        const primaryGlow = `{${moveTag}\\alpha&HE0&\\c&H${mainColor}&\\bord3\\blur${10 * shadowStrength}\\3c&H${mainColor}&\\3a&H${shadowAlpha.toString(16)}&\\4c&H${mainColor}&\\4a&H${blurAlpha.toString(16)}&\\fscx${startScale}\\fscy${startScale}\\t(0,${shrinkDuration},\\fscx${endScale}\\fscy${endScale})}${pair}`;
        events.push(`Dialogue: 0,${formatTime(pairStart)},${formatTime(pairEnd)},Default,,0,0,0,,${primaryGlow}`);
      }
    }
  });

  return style?.animation === 'shake' ? {
    events: events.join('\n'),
    lastPosition: currentPosition
  } : events.join('\n');
}; 