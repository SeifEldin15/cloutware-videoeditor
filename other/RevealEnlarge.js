import { formatTime } from '../../utils/timeUtils';
import { convertColorToASS } from '../colorUtils';
import { calculateNextPosition } from '../animationUtils';

const getScaledOutlineWidth = (style, scaleFactor = 0.75) => {
  return style && style.textOutlineWidth ? style.textOutlineWidth * scaleFactor : 0;
};

export const RevealEnlarge = (subtitle, start, end, style, lastPosition = null) => {
  const words = subtitle.text.split(' ');
  const totalDuration = end - start;
  const timePerWord = totalDuration / words.length;
  
  let events = [];

  // Get shadow properties from style
  const shadowStrength = style.shadowStrength > 1 
    ? style.shadowStrength * 0.8  // Reduced multiplier from +0.2 to *0.8
    : style.shadowStrength * 0.5; // Added reduction for lower values

  // Calculate alpha values based on shadowStrength
  const shadowAlpha = Math.round(150 - (shadowStrength * 20));
  const blurAlpha = Math.round(120 - (shadowStrength * 20));

  // Use style.alternateColors if provided, otherwise use defaults
  const defaultColors = ['0BF431', '2121FF', '1DE0FE', 'FFFF00'];
  const defaultShadowColors = ['2BFF51', '1914B3', '1DE0FE', 'FFFF00'];
  
  const textColors = style?.alternateColors 
    ? style.alternateColors.map(color => convertColorToASS(color).replace('&H', '').replace('&', ''))
    : defaultColors;

  const shadowColors = style?.alternateColors 
    ? style.alternateColors.map(color => convertColorToASS(color).replace('&H', '').replace('&', ''))
    : defaultShadowColors;

  const whiteASS = convertColorToASS('#FFFFFF');
  let currentPosition = lastPosition || { x: 670, y: 0 };

  words.forEach((word, index) => {
    const wordStart = start + index * timePerWord;
    const wordEnd = start + (index + 1) * timePerWord;

    let moveTag = '';
    if (style?.animation2 === 'Shake') {
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

    // Get outline properties
    const outlineWidth = style.textOutlineWidth || 2;
    const outlineColor = style.textOutlineColor ? convertColorToASS(style.textOutlineColor).replace('&H', '').replace('&', '') : '000000';

    // Main text layer with outline
    const coloredText = words.map((w, i) => {
      if (i === index) {
        return `{${moveTag}\\fscx100\\fscy100\\t(0,150,\\fscx120\\fscy120)\\c&H${textColors[index % textColors.length]}&\\bord${outlineWidth}\\3c&H${outlineColor}&}${w}`;
      } else {
        return `{\\fscx100\\fscy100\\c${whiteASS}\\bord${outlineWidth}\\3c&H${outlineColor}&}${w}`;
      }
    }).join(' ');
    
    // Shadow layer
    const shadowText = words.map((w, i) => {
      if (i === index) {
        return `{${moveTag}\\fscx100\\fscy100\\t(0,150,\\fscx120\\fscy120)\\c&H${shadowColors[index % shadowColors.length]}&\\bord${outlineWidth}\\blur${1.5 * shadowStrength}\\3c&H${outlineColor}&\\3a&H${shadowAlpha.toString(16)}&\\4c&H${outlineColor}&\\4a&H${blurAlpha.toString(16)}&\\xshad0\\yshad${-0.5}}${w}`;
      } else {
        return `{\\fscx100\\fscy100\\c&H${outlineColor}&\\bord${outlineWidth}\\blur${1.5 * shadowStrength}\\3c&H${outlineColor}&\\3a&H${shadowAlpha.toString(16)}&\\4c&H${outlineColor}&\\4a&H${blurAlpha.toString(16)}&\\xshad0\\yshad${-0.5}}${w}`;
      }
    }).join(' ');
    
    events.push(`Dialogue: 0,${formatTime(wordStart)},${formatTime(wordEnd)},Default,,0,0,0,,${shadowText}`);
    events.push(`Dialogue: 1,${formatTime(wordStart)},${formatTime(wordEnd)},Default,,0,0,0,,${coloredText}`);
  });
  
  return style?.animation2 === 'Shake' ? {
    events: events.join('\n'),
    lastPosition: currentPosition
  } : events.join('\n');
}; 