import { formatTime } from '../../utils/timeUtils';
import { convertColorToASS } from '../colorUtils';
import { calculateNextPosition } from '../animationUtils';

const getScaledOutlineWidth = (style, scaleFactor = 0.75) => {
  return style && style.textOutlineWidth ? style.textOutlineWidth * scaleFactor : 0;
};

export const revealWords3 = (subtitle, start, end, style) => {
  const words = subtitle.text.split(' ');
  const totalDuration = end - start; 
  const timePerWord = totalDuration / words.length; 
  let events = []; 

  const outlineWidth = getScaledOutlineWidth(style);
  const outlineColor = style?.textOutlineColor || '&H000000&';
  // Get text color from style, default to white if not provided
  const textColor = style?.color ? convertColorToASS(style.color) : convertColorToASS('#FFFFFF');
  // Initialize position
  let currentPosition = { x: 670, y: 0 };

  words.forEach((word, index) => {
    const wordStart = start + index * timePerWord;
    const wordEnd = start + (index + 1) * timePerWord;

    // Only calculate movement if animation2 is Shake
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
      if (i < index) {
        // Already revealed words
        return `{\\c${textColor}\\3c${outlineColor}\\bord${outlineWidth}}${w}`; 
      } else if (i === index) {
        // Currently revealing word with movement
        return `{${moveTag}\\c${textColor}\\3c${outlineColor}\\bord${outlineWidth}}${w}`; 
      } else {
        // Not yet revealed words
        return `{\\c${textColor}\\3c${outlineColor}\\bord${outlineWidth}\\alpha&HFF&}${w}`; 
      }
    }).join(' ');

    events.push(`Dialogue: 1,${formatTime(wordStart)},${formatTime(wordEnd)},Default,,0,0,0,,${coloredText}`);
  });

  return style?.animation2 === 'Shake' ? {
    events: events.join('\n'),
    lastPosition: currentPosition
  } : events.join('\n');
}; 