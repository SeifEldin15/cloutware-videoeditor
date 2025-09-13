import { formatTime } from '../../utils/timeUtils';
import { convertColorToASS } from '../colorUtils';

export const TrendingAli = (subtitle, start, end, style) => {
  const words = subtitle.text.split(' ');
  const duration = end - start;
  const timePerWord = duration / words.length;
  const events = [];

  const bgColor = style?.backgroundColor && style.backgroundColor !== '#00000000' 
    ? convertColorToASS(style.backgroundColor)
    : '&HFFFFFF&';

  const textWidth = words.join(' ').length * 11;
  const padding = 12;
  const boxWidth = textWidth + (padding * 2);
  const boxHeight = 45;

  const verticalPos = Math.round((720 * style.verticalPosition) / 100);

  words.forEach((word, wordIndex) => {
    const wordStart = start + (wordIndex * timePerWord);
    const wordEnd = wordStart + timePerWord;

    const displayText = words.map((w, index) => {
      if (index === wordIndex) {
        return `{\\alpha&H00&\\bord0}${w}`;
      } else if (index < wordIndex) {
        return `{\\alpha&H00&\\bord0}${w}`;
      } else {
        return `{\\alpha&H80&\\bord0}${w}`;
      }
    }).join(' ');

    const backgroundEvent = `Dialogue: 0,${formatTime(wordStart)},${formatTime(wordEnd)},Background,,0,0,0,,` +
      `{\\pos(640,${verticalPos})\\an5\\p1\\bord0\\shad0\\1c${bgColor}\\fscx${boxWidth}\\fscy${boxHeight}}m 0 0 l 100 0 100 100 0 100`;

    const textEvent = `Dialogue: 1,${formatTime(wordStart)},${formatTime(wordEnd)},Default,,0,0,0,,` +
      `{\\pos(640,${verticalPos})\\an5}${displayText}`;

    events.push(backgroundEvent, textEvent);
  });

  const finalBackgroundEvent = `Dialogue: 0,${formatTime(end - 0.1)},${formatTime(end)},Background,,0,0,0,,` +
    `{\\pos(640,${verticalPos})\\an5\\p1\\bord0\\shad0\\1c${bgColor}\\fscx${boxWidth}\\fscy${boxHeight}}m 0 0 l 100 0 100 100 0 100`;

  const finalTextEvent = `Dialogue: 1,${formatTime(end - 0.1)},${formatTime(end)},Default,,0,0,0,,` +
    `{\\pos(640,${verticalPos})\\an5}${words.map(w => `{\\alpha&H00&\\bord0}${w}`).join(' ')}`;

  events.push(finalBackgroundEvent, finalTextEvent);

  return events;
}; 