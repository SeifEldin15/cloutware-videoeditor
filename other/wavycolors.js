import { formatTime } from '../../utils/timeUtils';

export const Wavycolors = (subtitle, start, end, style) => {
  const words = subtitle.text.split(' ');
  const duration = end - start;
  const timePerWord = duration / words.length;
  const events = [];

  const colors = [
    '&H00FF00&', // Green
    '&HFFFF00&', // Yellow
    '&H00FFFF&'  // Light blue
  ];

  words.forEach((word, wordIndex) => {
    const wordStart = start + (wordIndex * timePerWord);
    const wordEnd = wordStart + timePerWord;
    const color = colors[wordIndex % colors.length];
    
    const charSets = word.match(/.{1,4}/g) || [word];
    const timePerSet = timePerWord / charSets.length;

    const stretchEffect = `{\\t(${timePerWord * 0.0},${timePerWord * 0.25},\\fscx100\\fscy150)}{\\t(${timePerWord * 0.25},${timePerWord * 0.5},\\fscx100\\fscy100)}`;
    
    charSets.forEach((_, coloredSetIndex) => {
      const setStart = wordStart + (coloredSetIndex * timePerSet);
      const setEnd = setStart + timePerSet;
      
      let wordDisplay = '';
      charSets.forEach((chars, setIndex) => {
        const isColored = setIndex === coloredSetIndex;
        const outlineWidth = style?.textOutlineWidth || 2;
        const setStyle = isColored 
          ? `{\\3c${color}\\bord${outlineWidth}\\c${color}\\blur8\\alpha&H60&\\shad5}` 
          : `{\\c&HFFFFFF&\\bord0\\blur0\\alpha&H00&\\shad0}`;
        wordDisplay += setStyle + chars;
      });

      events.push(
        `Dialogue: 0,${formatTime(setStart)},${formatTime(setEnd)},Default,,0,0,0,,` +
        `${stretchEffect}${wordDisplay}`
      );
    });

    if (wordIndex < words.length - 1) {
      events.push(
        `Dialogue: 0,${formatTime(wordStart)},${formatTime(wordEnd)},Default,,0,0,0,, `
      );
    }
  });

  return events;
}; 