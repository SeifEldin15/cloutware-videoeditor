import { formatTime } from '../../utils/timeUtils';
import { convertColorToASS } from '../colorUtils';
import { calculateNextPosition } from '../animationUtils';

const getScaledOutlineWidth = (style, scaleFactor = 0.75) => {
  return style && style.textOutlineWidth ? style.textOutlineWidth * scaleFactor : 0;
};

export const HormoziAlternatingColors = () => {
  const colors = [
    '0BF431', 
    'FFFFFF',  // Green
    '2BFF51',  // Blue
    '1914B3'   // Yellow
  ];

  const color = colors[colorIndex];
  colorIndex = (colorIndex + 1) % colors.length;
  
  return color;
};

export const alternatingColorsAnimation = (subtitle, start, end, style, lastPosition = null) => {
  const words = subtitle.text.split(' ');
  const timePerWord = (end - start) / words.length;
  
  // Get shadow properties from style
  const shadowStrength = style.shadowStrength
    ? style.shadowStrength   // Reduced multiplier for higher values
    : 3; // Reduced multiplier for lower values

  // Calculate alpha values based on shadowStrength
  const shadowAlpha = Math.round(150 - (shadowStrength * 20));
  const blurAlpha = Math.round(120 - (shadowStrength * 20));
  
  // Use style.alternateColors if provided, otherwise use default colors
  const defaultColors = ['0BF431', '2121FF', '1DE0FE', 'FFFF00'];
  
  const HormoziViralColors = style?.alternateColors 
    ? style.alternateColors.map(color => convertColorToASS(color).replace('&H', '').replace('&', ''))
    : defaultColors;

  // Use alternateShadowColors if provided, otherwise use the same colors for glow
  const glowColors = style?.alternateColors
    ? Object.fromEntries(
        style.alternateColors.map((color, index) => [
          convertColorToASS(color).replace('&H', '').replace('&', ''),
          convertColorToASS(style.alternateColors[index]).replace('&H', '').replace('&', '')
        ])
      )
    : Object.fromEntries(
        HormoziViralColors.map(color => [color, color])
      );

  const whiteASS = convertColorToASS('#FFFFFF');
  const whiteGlowColor = style?.shadowColor 
    ? convertColorToASS(style.shadowColor).replace('&H', '').replace('&', '')
    : 'FFFFFF';
  
  let events = [];
  let currentPosition = lastPosition || { x: 670, y: 0 };

  words.forEach((word, index) => {
    const wordStart = start + index * timePerWord;
    const wordEnd = start + (index + 1) * timePerWord;
    const duration = wordEnd - wordStart;

    const colorIndex = index % HormoziViralColors.length;
    const color = HormoziViralColors[colorIndex];
    const glowColor = glowColors[color];
    const borderWidth = 0.1 * shadowStrength;
    const blurAmount = 2 * shadowStrength;

    let moveTag = '';
    if (style?.animation2 === 'Shake') {
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

    // Main text layer
    const coloredText = words.map((w, i) => {
      if (i === index) {
        // Active word: colored text
        return `{${moveTag}\\c&H${color}&\\bord0\\shad0}${w}`;
      } else if (i < index) {
        // Words that were previously active: white with no effects
        return `{\\c${whiteASS}\\bord0\\shad0}${w}`;
      } else {
        // Words not yet active: white with no effects
        return `{\\c${whiteASS}\\bord0\\shad0}${w}`;
      }
    }).join(' ');

    // Additional glow layer for active word only
    const glowText = words.map((w, i) => {
      if (i === index) {
        return `{${moveTag}\\c&H${glowColor}&\\bord${borderWidth}\\blur${blurAmount}\\3c&H${glowColor}&\\3a&H${shadowAlpha.toString(16)}&\\4c&H${glowColor}&\\4a&H${blurAlpha.toString(16)}&\\xshad0\\yshad${-1}}${w}`;
      }
      return `{\\alpha&HFF&}${w}`; // Hide non-active words in glow layer
    }).join(' ');

    events.push(`Dialogue: 0,${formatTime(wordStart)},${formatTime(wordEnd)},Default,,0,0,0,,${glowText}`);
    events.push(`Dialogue: 1,${formatTime(wordStart)},${formatTime(wordEnd)},Default,,0,0,0,,${coloredText}`);
  });

  return style?.animation2 === 'Shake' ? {
    events: events.join('\n'),
    lastPosition: currentPosition
  } : events.join('\n');
};

export const alternatingColorsAnimation2 = (subtitle, start, end, style, lastPosition = null) => {
  const words = subtitle.text.split(' ');
  const totalDuration = end - start; 
  const timePerWord = totalDuration / words.length; 
  
  const yellowColor = style?.color ? convertColorToASS(style.color) : convertColorToASS('#FFFF00');
  const whiteASS = convertColorToASS('#FFFFFF');
  
  let events = []; 
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

    const coloredText = words.map((w, i) => {
      if (i === index) {
        return `{${moveTag}\\c&H${yellowColor}&}${w}`;
      } else {
        return `{\\c${whiteASS}}${w}`;
      }
    }).join(' '); 
    
    events.push(`Dialogue: 0,${formatTime(wordStart)},${formatTime(wordEnd)},Default,,0,0,0,,${coloredText}`);
  });
  
  return style?.animation2 === 'Shake' ? {
    events: events.join('\n'),
    lastPosition: currentPosition
  } : events.join('\n'); 
};

// Export a colorIndex variable to maintain state between calls
let colorIndex = 0;

export const generateColorSequence = (wordCount) => {
  const colors = ['FF0000', '00FF00', '0000FF', 'FFFF00']; 
  return Array(wordCount).fill().map((_, i) => colors[i % colors.length]);
};

export const generateYellowColorSequence = (wordCount) => {
  const colors = ['FFFF00', 'FFFF00', 'FFFF00', 'FFFF00']; 
  return Array(wordCount).fill().map((_, i) => colors[i % colors.length]);
}; 