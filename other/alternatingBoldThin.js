import { formatTime } from '../../utils/timeUtils';
import { convertColorToASS } from '../colorUtils';

const getScaledOutlineWidth = (style, scaleFactor = 0.75) => {
  return style && style.textOutlineWidth ? style.textOutlineWidth * scaleFactor : 0;
};

export const alternatingBoldThinAnimation = (subtitle, start, end, style) => {
  const words = subtitle.text.split(' ');
  const totalDuration = end - start;
  const timePerWord = totalDuration / words.length;
  const yellowColor = style?.color ? convertColorToASS(style.color) : convertColorToASS('#FEFD02');

  let events = [];
  
  // Convert the yellow color to ASS format
  const yellowGlowColor = style?.color ? convertColorToASS(style.color) : convertColorToASS('#FEFf22');
  
  words.forEach((word, wordIndex) => {
    const wordStart = start + wordIndex * timePerWord;
    const timePerChar = timePerWord / word.length;
    const isInBoldPair = Math.floor(wordIndex / 2) % 2 === 1;
    
    [...word].forEach((char, charIndex) => {
      const charStart = wordStart + (charIndex * timePerChar);
      const charEnd = wordStart + ((charIndex + 1) * timePerChar);
      
      const fontStyle = isInBoldPair 
        ? '\\fn@Montserrat' 
        : '\\fn@Montserrat Thin';
      const fadeInDuration = 200;
      
      const glowText = words.map((w, wIndex) => {
        if (wIndex < wordIndex) {
          return `{\\c${yellowColor}${Math.floor(wIndex / 2) % 2 === 1 
            ? `\\fn@Montserrat\\blur4\\bord3\\3c${yellowGlowColor}\\4c${yellowGlowColor}\\3a&HB0&\\4a&HB0&`
            : `\\fn@Montserrat Thin\\blur2\\bord1.5\\3c${yellowGlowColor}\\4c${yellowGlowColor}\\3a&HC5&\\4a&HC5&`}\\shad0}${w}`;
        } else if (wIndex === wordIndex) {
          const currentChars = [...w];
          return currentChars.map((c, cIndex) => {
            if (cIndex < charIndex) {
              return `{\\c${yellowColor}${fontStyle}${isInBoldPair 
                ? `\\blur4\\bord3\\3c${yellowGlowColor}\\4c${yellowGlowColor}\\3a&HB0&\\4a&HB0&`
                : `\\blur2\\bord1.5\\3c${yellowGlowColor}\\4c${yellowGlowColor}\\3a&HC5&\\4a&HC5&`}\\shad0}${c}`;
            } else if (cIndex === charIndex) {
              return `{\\an5\\c${yellowColor}${fontStyle}\\bord0\\blur0\\alpha&HFF&\\t(0,${fadeInDuration},\\alpha&H00&)\\t(${fadeInDuration},${fadeInDuration + 1},${isInBoldPair 
                ? `\\blur4\\bord3\\3c${yellowGlowColor}\\4c${yellowGlowColor}\\3a&HB0&\\4a&HB0&`
                : `\\blur2\\bord1.5\\3c${yellowGlowColor}\\4c${yellowGlowColor}\\3a&HC5&\\4a&HC5&`})}${c}`;
            } else {
              return `{\\alpha&HFF&}${c}`;
            }
          }).join('');
        } else {
          return `{\\alpha&HFF&}${w}`;
        }
      }).join(' ');
      
      events.push(`Dialogue: 0,${formatTime(charStart)},${formatTime(charEnd)},Default,,0,0,0,,${glowText}`);
    });
  });
  
  return events.join('\n');
}; 