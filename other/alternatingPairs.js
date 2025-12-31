import { formatTime } from '../../utils/timeUtils';
import { convertColorToASS } from '../colorUtils';
import { calculateNextPosition } from '../animationUtils';

const getScaledOutlineWidth = (style, scaleFactor = 0.75) => {
  return style && style.textOutlineWidth ? style.textOutlineWidth * scaleFactor : 0;
};

export const alternatingColorsPairAnimation = (subtitle, start, end, style, lastPosition = null) => {
  const words = subtitle.text.split(' ');
  const totalDuration = end - start;
  const wordGroups = [];
  const outlineWidth = getScaledOutlineWidth(style) * 1;
  
  // Calculate shadow intensity based on shadowStrength
  const shadowStrength = style?.shadowStrength  
    ? style.shadowStrength * 1   
    : 1; 
  
  // Increased transparency by adjusting base values
  const shadowAlpha = Math.round(140 - (shadowStrength * 0.5)); 
  const blurAlpha = Math.round(120 - (shadowStrength * 0.5));   

  // Group words into pairs
  for (let i = 0; i < words.length; i += 4) {
    const group = [];
    if (i < words.length) {
      group.push(words[i] + (words[i + 1] ? ' ' + words[i + 1] : ''));
    }
    if (i + 2 < words.length) {
      group.push(words[i + 2] + (words[i + 3] ? ' ' + words[i + 3] : ''));
    }
    if (group.length > 0) {
      wordGroups.push(group);
    }
  }

  const timePerGroup = totalDuration / wordGroups.length;
  const timePerPair = timePerGroup / 2;

  // Use style.alternateColors if provided, otherwise use default color sets
  const defaultColorSets = [
    ['0BF431', '2121FF'],  // First set: Green & Blue
    ['1DE0FE', 'FFFF00']   // Second set: Cyan & Yellow
  ];
  
  const colorSets = style?.alternateColors ? [
    [convertColorToASS(style.alternateColors[0]), convertColorToASS(style.alternateColors[1])],
    [convertColorToASS(style.alternateColors[0]), convertColorToASS(style.alternateColors[1])]
  ].map(set => set.map(color => color.replace('&H', '').replace('&', ''))) : defaultColorSets;

  // Get shadow colors from style
  const shadowColorSets = style?.alternateShadowColors ? [
    [convertColorToASS(style.alternateColors[0]), convertColorToASS(style.alternateColors[1])],
    [convertColorToASS(style.alternateColors[0]), convertColorToASS(style.alternateColors[1])]
  ].map(set => set.map(color => color.replace('&H', '').replace('&', ''))) : colorSets;

  const glowColors = {
    // Default glow colors
    '0BF431': '2BFF51',
    '2121FF': '1914B3',
    '1DE0FE': '1DE0FE',
    'FFFF00': 'FFFF00',
    // Add dynamic glow colors based on style.alternateColors
    ...(style?.alternateColors && {
      [convertColorToASS(style.alternateColors[0]).replace('&H', '').replace('&', '')]: convertColorToASS(style.alternateColors[0]).replace('&H', '').replace('&', ''),
      [convertColorToASS(style.alternateColors[1]).replace('&H', '').replace('&', '')]: convertColorToASS(style.alternateColors[0]).replace('&H', '').replace('&', ''),
      [convertColorToASS(style.alternateColors[0]).replace('&H', '').replace('&', '')]: convertColorToASS(style.alternateColors[1]).replace('&H', '').replace('&', ''),
      [convertColorToASS(style.alternateColors[1]).replace('&H', '').replace('&', '')]: convertColorToASS(style.alternateColors[1]).replace('&H', '').replace('&', '')
    })
  };

  // Configuration objects
  const glowAlphas = {
    '0BF431': '&HA5&',
    '2121FF': '&H60&',
    '1DE0FE': '&HA3&',
    'FFFF00': '&HA5&',
    ...(style?.alternateColors && {
      [convertColorToASS(style.alternateColors[0]).replace('&H', '').replace('&', '')]: '&HA5&',
      [convertColorToASS(style.alternateColors[1]).replace('&H', '').replace('&', '')]: '&H60&',
      [convertColorToASS(style.alternateColors[0]).replace('&H', '').replace('&', '')]: '&HA3&',
      [convertColorToASS(style.alternateColors[1]).replace('&H', '').replace('&', '')]: '&HA5&'
    })
  };

  const glowBlur = {
    '0BF431': 20,
    '2121FF': 18,
    '1DE0FE': 19,
    'FFFF00': 20,
    ...(style?.alternateColors && {
      [convertColorToASS(style.alternateColors[0]).replace('&H', '').replace('&', '')]: 20,
      [convertColorToASS(style.alternateColors[1]).replace('&H', '').replace('&', '')]: 18,
      [convertColorToASS(style.alternateColors[0]).replace('&H', '').replace('&', '')]: 19,
      [convertColorToASS(style.alternateColors[1]).replace('&H', '').replace('&', '')]: 20
    })
  };

  const glowShadow = {
    '0BF431': 10,   
    '2121FF': 10,    
    '1DE0FE': 10,     
    'FFFF00': 10      
  };
  
  const outlineColor = style?.textOutlineColor * 2 || '&H000000&';

  // Initialize position from last known position or default starting position
  let currentPosition = lastPosition || { x: 670, y: 0 };
  let events = []; 

  wordGroups.forEach((group, groupIndex) => {
    const groupStart = start + groupIndex * timePerGroup;
    const currentColorSet = colorSets[groupIndex % 2];
    const currentShadowSet = shadowColorSets[groupIndex % 2];
    
    group.forEach((pair, pairIndex) => {
      const pairStart = groupStart + (pairIndex * timePerPair);
      const pairEnd = groupStart + ((pairIndex + 1) * timePerPair);
      const activeColor = currentColorSet[pairIndex];
      const duration = pairEnd - pairStart;

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

      const coloredText = group.map((w, i) => {
        const baseStyle = i === pairIndex 
          ? `\\c&H${currentColorSet[pairIndex]}&\\3c${outlineColor}\\bord${outlineWidth}\\fscx150\\fscy150`
          : `\\c${convertColorToASS('#FFFFFF')}\\3c${outlineColor}\\bord${outlineWidth}\\fscx100\\fscy100`;
        return `{${moveTag}${baseStyle}}${w}`;
      }).join('\\N');
      
      const glowText = group.map((w, i) => {
        if (i === pairIndex) {
          const activeShadowColor = currentShadowSet[pairIndex];
          return `{${moveTag}\\alpha&HE0&\\c&H${activeShadowColor}&\\bord3\\blur${10 * shadowStrength}\\3c&H${activeShadowColor}&\\3a&H${shadowAlpha.toString(16)}&\\4c&H${activeShadowColor}&\\4a&H${blurAlpha.toString(16)}&\\fscx150\\fscy150}${w}`;
        }
        return `{${moveTag}\\alpha&HE0&\\c&HFFFFFF&\\bord-1\\blur${0 * shadowStrength}\\3c&HFFFFFF&\\3a&H${shadowAlpha.toString(16)}&\\4c&HFFFFFF&\\4a&H${blurAlpha.toString(16)}&\\fscx100\\fscy100}${w}`;
      }).join('\\N');

      events.push(`Dialogue: 0,${formatTime(pairStart)},${formatTime(pairEnd)},Default,,0,0,0,,${glowText}`);
      events.push(`Dialogue: 1,${formatTime(pairStart)},${formatTime(pairEnd)},Default,,0,0,0,,${coloredText}`);
    });
  });
  
  return style?.animation2 === 'Shake' ? {
    events: events.join('\n'),
    lastPosition: currentPosition
  } : events.join('\n');
}; 