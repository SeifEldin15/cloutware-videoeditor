import { formatTime } from '../../utils/timeUtils';
import { convertColorToASS } from '../colorUtils';
import { calculateNextPosition } from '../animationUtils';

const getScaledOutlineWidth = (style, scaleFactor = 0.75) => {
  return style && style.textOutlineWidth ? style.textOutlineWidth * scaleFactor : 0;
};

export const ThinToBold = (subtitle, start, end, style, lastPosition = null) => {
  const words = subtitle.text.split(' ');
  const totalDuration = end - start;
  const wordPairs = [];
    
  // Group words into pairs
  for (let i = 0; i < words.length; i += 2) {
    if (i + 1 < words.length) {
      wordPairs.push(words[i] + ' ' + words[i + 1]);
    } else {
      wordPairs.push(words[i]); 
    }
  }

  const timePerPair = totalDuration / wordPairs.length;
  const outlineWidth = 0;
  const textColor = convertColorToASS(style.color) || convertColorToASS('#FFFFFF');

  const shadowStrength = style.shadowStrength ? style.shadowStrength + 0.2 : style.shadowStrength;
  const textShadowColor = style.color ? convertColorToASS(style.color) : convertColorToASS('#FFFFFF');
  
  let currentPosition = lastPosition || { x: 670, y: 0 };
  let events = []; 

  wordPairs.forEach((pair, index) => {
    const pairStart = start + index * timePerPair; 
    const pairEnd = start + (index + 1) * timePerPair; 

    // Add movement tag calculation for Shake animation
    let moveTag = '';
    if (style?.animation2 === 'Shake') {
      const duration = pairEnd - pairStart;
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

    // Update coloredText to include moveTag
    const coloredText = wordPairs.map((w, i) => {
      if (i === index) {
        return `{${moveTag}\\c${textColor}\\bord${outlineWidth}\\fn@Montserrat\\fscx120\\fscy120}${w}`;
      }
      return `{\\c${textColor}\\bord${outlineWidth}\\fn@Montserrat Thin}${w}`;
    }).join('\\N');
    
    // Update glowText to include moveTag
    const glowText = wordPairs.map((w, i) => {
      if (i === index) {
        // Calculate alpha values based on shadowStrength (0-2)
        const shadowAlpha = Math.round(133 - (shadowStrength * 24)); // 133 -> 85 as strength goes 0->2
        const blurAlpha = Math.round(96 - (shadowStrength * 28));    // 96 -> 40 as strength goes 0->2
        
        return `{${moveTag}\\c${textShadowColor}\\bord${0.1 * shadowStrength}\\blur${4 * shadowStrength}\\3c${textShadowColor}\\3a&H${shadowAlpha.toString(16)}&\\4c${textShadowColor}\\4a&H${blurAlpha.toString(16)}&\\xshad0\\yshad${-1}\\fn@Montserrat\\fscx120\\fscy120}${w}`;
      }
      // Inactive words - remove all shadow/glow effects
      return `{\\c${textShadowColor}\\bord0\\blur0\\shad0\\fn@Montserrat Thin}${w}`;
    }).join('\\N');
    
    events.push(`Dialogue: 0,${formatTime(pairStart)},${formatTime(pairEnd)},Default,,0,0,0,,${glowText}`);
    events.push(`Dialogue: 1,${formatTime(pairStart)},${formatTime(pairEnd)},Default,,0,0,0,,${coloredText}`);
  });
  
  // Return with lastPosition if Shake animation is enabled
  return style?.animation2 === 'Shake' ? {
    events: events.join('\n'),
    lastPosition: currentPosition
  } : events.join('\n');
}; 