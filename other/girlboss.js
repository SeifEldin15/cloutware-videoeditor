import { formatTime } from '../../utils/timeUtils';
import { convertColorToASS } from '../colorUtils';
import { calculateNextPosition } from '../animationUtils';

export const Girlboss = (subtitle, start, end, style, lastPosition = null) => {
  const words = subtitle.text.split(' ');
  const totalDuration = end - start;
  const timePerWord = totalDuration / words.length;
  const textColor = style.color ? convertColorToASS(style.color) : convertColorToASS('#F361D8');
  const lightGlowColorASS = convertColorToASS(style.color) || convertColorToASS('#F361D8');
  
  // Calculate shadow/glow intensity based on shadowStrength
  const shadowStrength = style.shadowStrength > 1 ? style.shadowStrength + 0.2 : 1;
  const shadowAlpha = Math.round(133 - (shadowStrength * 24)); // 133 -> 85 as strength goes 0->2
  const blurAlpha = Math.round(96 - (shadowStrength * 28));    // 96 -> 40 as strength goes 0->2
  
  // Base glow layer with adjusted intensity
  const events = [`Dialogue: 0,${formatTime(start)},${formatTime(end)},Default,,0,0,0,,{\\c${lightGlowColorASS}\\bord${0.1 * shadowStrength}\\blur${4 * shadowStrength}\\3c${lightGlowColorASS}\\4c${lightGlowColorASS}\\4a&H${blurAlpha.toString(16)}&\\3a&H${shadowAlpha.toString(16)}&}${subtitle.text}`];
  
  // Base text layer
  events.push(`Dialogue: 1,${formatTime(start)},${formatTime(end)},Default,,0,0,0,,{\\c&HFFFFFF&\\shad0}${subtitle.text}`);
  
  let currentPosition = lastPosition || { x: 670, y: 0 };

  words.forEach((word, index) => {
    const wordStart = start + index * timePerWord;
    const wordEnd = start + (index + 1) * timePerWord;
    
    const coloredWords = words.map((w, i) => {
      if (i === index || i < index) {
        return `{\\c${textColor}\\shad0}${w}`;
      } else {
        return `{\\c&HFFFFFF&\\shad0}${w}`;
      }
    }).join(' ');
    
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

    const finalColoredWords = moveTag
      ? words.map((w, i) => {
          if (i === index || i < index) {
            return `{${moveTag}\\c${textColor}\\shad0}${w}`;
          } else {
            return `{\\c&HFFFFFF&\\shad0}${w}`;
          }
        }).join(' ')
      : coloredWords;

    events.push(`Dialogue: 2,${formatTime(wordStart)},${formatTime(wordEnd)},Default,,0,0,0,,${finalColoredWords}`);
  });
  
  return style?.animation2 === 'Shake' ? {
    events: events.join('\n'),
    lastPosition: currentPosition
  } : events.join('\n'); 
};