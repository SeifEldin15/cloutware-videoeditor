import { formatTime } from '../../utils/timeUtils';
import { convertColorToASS } from '../colorUtils';

export const fullDisplayColorsFill3 = (subtitle, start, end) => {
  const words = subtitle.text.split(' ');
  const totalDuration = end - start;
  const timePerWord = totalDuration / words.length;
  
  // Black shadow layer (placed behind) - further reduced border and blur for even subtler effect
  const events = [
    `Dialogue: 0,${formatTime(start)},${formatTime(end)},Default,,0,0,0,,{\\c&H000000&\\bord2\\blur0.8}${subtitle.text}`
  ];
  
  // Main white text layer
  events.push(
    `Dialogue: 1,${formatTime(start)},${formatTime(end)},Default,,0,0,0,,{\\c&HFFFFFF&\\bord0}${subtitle.text}`
  );
  
  words.forEach((word, index) => {
    const wordStart = start + index * timePerWord;
    const wordEnd = start + (index + 1) * timePerWord;
    
    const coloredWords = words.map((w, i) => {
      if (i === index || i < index) {
        return `{\\c&HFFFFFF&\\bord0}${w}`;
      } else {
        return `{\\c&HFFFFFF&\\bord0}${w}`;
      }
    }).join(' ');
    
    events.push(
      `Dialogue: 2,${formatTime(wordStart)},${formatTime(wordEnd)},Default,,0,0,0,,${coloredWords}`
    );
  });
  
  return events.join('\n');
}; 