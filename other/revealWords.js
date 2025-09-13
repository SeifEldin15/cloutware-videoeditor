import { formatTime } from '../../utils/timeUtils';
import { convertColorToASS } from '../colorUtils';
import { calculateNextPosition } from '../animationUtils';

const getScaledOutlineWidth = (style, scaleFactor = 0.75) => {
  return style && style.textOutlineWidth ? style.textOutlineWidth * scaleFactor : 0;
};

export const revealWords = (subtitle, start, end, style, lastPosition = null) => {
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

  // Use style.alternateColors and alternateShadowColors if provided, otherwise use defaults
  const defaultColors = ['0BF431', '2121FF', '1DE0FE', 'FFFF00'];
  const defaultShadowColors = ['2BFF51', '1914B3', '1DE0FE', 'FFFF00'];
  
  const textColors = style?.alternateColors 
    ? style.alternateColors.map(color => convertColorToASS(color).replace('&H', '').replace('&', ''))
    : defaultColors;

  const shadowColors = style?.alternateColors 
    ? style.alternateColors.map(color => convertColorToASS(color).replace('&H', '').replace('&', ''))
    : style?.alternateColors 
      ? style.alternateColors.map(color => convertColorToASS(color).replace('&H', '').replace('&', ''))
      : defaultShadowColors;

  const whiteASS = convertColorToASS('#FFFFFF');
  const whiteGlowColor = 'FFFFFF';
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

    if (style && style.animation === 'HormoziViralSentence') {
      const colorIndex = index % textColors.length;
      const activeColor = textColors[colorIndex];
      const activeShadowColor = shadowColors[colorIndex];
      
      // Main text layer - transitions back to white
      const coloredText = words.map((w, i) => {
        if (i < index) {
          return `{\\c${whiteASS}\\bord0}${w}`;
        } else if (i === index) {
          return `{${moveTag}\\alpha&HFF&\\t(0,100,\\alpha&H00&)\\c&H${activeColor}&\\bord0}${w}`;
        } else {
          return `{\\alpha&HFF&}${w}`;
        }
      }).join(' ');
      
      // Shadow layer - also transitions back to white glow
      const shadowText = words.map((w, i) => {
        if (i < index) {
          return `{\\c&H${whiteGlowColor}&\\bord${0.05 * shadowStrength}\\blur${1.5 * shadowStrength}\\3c&H${whiteGlowColor}&\\3a&H${shadowAlpha.toString(16)}&\\4c&H${whiteGlowColor}&\\4a&H${blurAlpha.toString(16)}&\\xshad0\\yshad${-0.5}}${w}`;
        } else if (i === index) {
          return `{${moveTag}\\alpha&HFF&\\t(0,100,\\alpha&H00&)\\c&H${activeShadowColor}&\\bord${0.05 * shadowStrength}\\blur${1.5 * shadowStrength}\\3c&H${activeShadowColor}&\\3a&H${shadowAlpha.toString(16)}&\\4c&H${activeShadowColor}&\\4a&H${blurAlpha.toString(16)}&\\xshad0\\yshad${-0.5}}${w}`;
        }
        return `{\\alpha&HFF&}${w}`;
      }).join(' ');
      
      events.push(`Dialogue: 0,${formatTime(wordStart)},${formatTime(wordEnd)},Default,,0,0,0,,${shadowText}`);
      events.push(`Dialogue: 1,${formatTime(wordStart)},${formatTime(wordEnd)},Default,,0,0,0,,${coloredText}`);
    } else {
      // Reduce non-viral text effects
      const shadowAlpha = Math.round(150 - (shadowStrength * 20));
      const blurAlpha = Math.round(120 - (shadowStrength * 20));
      
      const defaultShadowColor = style?.shadowColor ? convertColorToASS(style.shadowColor) : '&H000000&';
      
      const nonViralColoredText = words.map((w, i) => {
        if (i < index) {
          return `{\\c${whiteASS}\\bord0}${w}`;
        } else if (i === index) {
          return `{${moveTag}\\alpha&HFF&\\t(0,100,\\alpha&H00&)\\c${whiteASS}\\bord0}${w}`;
        } else {
          return `{\\c${whiteASS}\\bord0\\alpha&HFF&}${w}`;
        }
      }).join(' ');

      const nonViralShadowText = words.map((w, i) => {
        if (i < index) {
          return `{\\c${defaultShadowColor}\\bord${0.05 * shadowStrength}\\blur${2 * shadowStrength}\\3c${defaultShadowColor}\\3a&H${shadowAlpha.toString(16)}&\\4c${defaultShadowColor}\\4a&H${blurAlpha.toString(16)}&\\xshad0\\yshad${-0.5}}${w}`;
        } else if (i === index) {
          return `{${moveTag}\\alpha&HFF&\\t(0,100,\\alpha&H00&)\\c${defaultShadowColor}\\bord${0.05 * shadowStrength}\\blur${2 * shadowStrength}\\3c${defaultShadowColor}\\3a&H${shadowAlpha.toString(16)}&\\4c${defaultShadowColor}\\4a&H${blurAlpha.toString(16)}&\\xshad0\\yshad${-0.5}}${w}`;
        } else {
          return `{\\alpha&HFF&}${w}`;
        }
      }).join(' ');
      
      events.push(`Dialogue: 0,${formatTime(wordStart)},${formatTime(wordEnd)},Default,,0,0,0,,${nonViralShadowText}`);
      events.push(`Dialogue: 1,${formatTime(wordStart)},${formatTime(wordEnd)},Default,,0,0,0,,${nonViralColoredText}`);
    }
  });
  
  return style?.animation2 === 'Shake' ? {
    events: events.join('\n'),
    lastPosition: currentPosition
  } : events.join('\n');
}; 