import { formatTime } from '../../utils/timeUtils';
import { convertColorToASS } from '../colorUtils';
import { calculateNextPosition } from '../animationUtils';

const getScaledOutlineWidth = (style, scaleFactor = 0.75) => {
  return style && style.textOutlineWidth ? style.textOutlineWidth * scaleFactor : 0;
};

export const shrinkingColorsPairAnimation = (subtitle, start, end, style, lastPosition = null) => {
  const words = subtitle.text.split(' ');
  const totalDuration = end - start;
  const wordPairs = [];
  const outlineWidth = getScaledOutlineWidth(style) * 1;
  
  const shadowStrength = style?.shadowStrength ? style.shadowStrength * 0.7 : 1; 
  const shadowAlpha = Math.round(140 - (shadowStrength * 0.5)); 
  const blurAlpha = Math.round(120 - (shadowStrength * 0.5));   

  // Group words into pairs
  for (let i = 0; i < words.length; i += 2) {
    const pair = words[i] + (words[i + 1] ? ' ' + words[i + 1] : '');
    if (pair) {
      wordPairs.push(pair);
    }
  }

  const timePerPair = totalDuration / wordPairs.length;
  const startScale = 120;
  const endScale = 100;
  const shrinkDuration = 450;
  const lineSpacing = 35;

  const mainColor = style?.color ? convertColorToASS(style.color).replace('&H', '').replace('&', '') : '0BF431';
  const shadowColor = mainColor;

  const outlineColor = style?.textOutlineColor ? convertColorToASS(style.textOutlineColor) : '&H000000&';
  let currentPosition = lastPosition || { x: 670, y: 0 };
  let events = [];

  wordPairs.forEach((pair, index) => {
    const pairStart = start + (index * timePerPair);
    const pairEnd = index === 0 ? end : pairStart + timePerPair;
    const nextPairStart = start + ((index + 1) * timePerPair);

    let moveTag = '';
    if (style?.animation2 === 'Shake') {
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

    const coloredText = `{${moveTag}\\c&H${mainColor}&\\3c${outlineColor}\\bord${outlineWidth}\\fscx${startScale}\\fscy${startScale}\\t(0,${shrinkDuration},\\fscx${endScale}\\fscy${endScale})}${pair}`;
    
    if (index < wordPairs.length - 1) {
        events.push(`Dialogue: 1,${formatTime(pairStart)},${formatTime(nextPairStart)},Default,,0,0,0,,${coloredText}`);
        const primaryGlow = `{${moveTag}\\alpha&HE0&\\c&H${mainColor}&\\bord3\\blur${10 * shadowStrength}\\3c&H${mainColor}&\\3a&H${shadowAlpha.toString(16)}&\\4c&H${mainColor}&\\4a&H${blurAlpha.toString(16)}\\fscx${startScale}\\fscy${startScale}\\t(0,${shrinkDuration},\\fscx${endScale}\\fscy${endScale})}${pair}`;
        events.push(`Dialogue: 0,${formatTime(pairStart)},${formatTime(nextPairStart)},Default,,0,0,0,,${primaryGlow}`);

        events.push(`Dialogue: 1,${formatTime(nextPairStart)},${formatTime(pairEnd)},Default,,0,0,0,,{${moveTag}\\c&HFFFFFF&\\3c${outlineColor}\\bord${outlineWidth}\\fscx${endScale}\\fscy${endScale}}${pair}`);
        const whiteGlow = `{${moveTag}\\alpha&HE0&\\c&HFFFFFF&\\bord3\\blur${10 * shadowStrength}\\3c&HFFFFFF&\\3a&H${shadowAlpha.toString(16)}&\\4c&HFFFFFF&\\4a&H${blurAlpha.toString(16)}\\fscx${endScale}\\fscy${endScale}}${pair}`;
        events.push(`Dialogue: 0,${formatTime(nextPairStart)},${formatTime(pairEnd)},Default,,0,0,0,,${whiteGlow}`);
    } else {
        events.push(`Dialogue: 1,${formatTime(pairStart)},${formatTime(pairEnd)},Default,,0,0,0,,${coloredText}`);
        const primaryGlow = `{${moveTag}\\alpha&HE0&\\c&H${mainColor}&\\bord3\\blur${10 * shadowStrength}\\3c&H${mainColor}&\\3a&H${shadowAlpha.toString(16)}&\\4c&H${mainColor}&\\4a&H${blurAlpha.toString(16)}\\fscx${startScale}\\fscy${startScale}\\t(0,${shrinkDuration},\\fscx${endScale}\\fscy${endScale})}${pair}`;
        events.push(`Dialogue: 0,${formatTime(pairStart)},${formatTime(pairEnd)},Default,,0,0,0,,${primaryGlow}`);
    }
  });

  return style?.animation2 === 'Shake' ? {
    events: events.join('\n'),
    lastPosition: currentPosition
  } : events.join('\n');
};