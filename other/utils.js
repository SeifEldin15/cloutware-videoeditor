export const splitSubtitleIntoWords = (subtitle, start, end) => {
  const words = subtitle.text.split(' ');
  const duration = end - start;
  const timePerWord = duration / words.length;
  
  return words.map((word, index) => ({
    word,
    start: start + index * timePerWord,
    end: start + (index + 1) * timePerWord
  }));
};

export const getScaledOutlineWidth = (style, scaleFactor = 0.75) => {
  return style && style.textOutlineWidth ? style.textOutlineWidth * scaleFactor : 0;
}; 