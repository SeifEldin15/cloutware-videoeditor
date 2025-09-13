import { formatTime } from '../../utils/timeUtils';
import { convertColorToASS } from '../colorUtils';

const getScaledOutlineWidth = (style, scaleFactor = 0.75) => {
  return style && style.textOutlineWidth ? style.textOutlineWidth * scaleFactor : 0;
};

export const revealWordsOneByOne = (subtitle, start, end, style) => {
  const words = subtitle.text.split(' ');
  const totalDuration = end - start;
  const timePerWord = totalDuration / words.length;
  
  // Get shadow properties from style
  const shadowStrength = style.shadowStrength
    ? style.shadowStrength 
    : 1;

  // Calculate alpha values based on shadowStrength
  const shadowAlpha = Math.round(150 - (shadowStrength * 20));
  const blurAlpha = Math.round(120 - (shadowStrength * 20));
  
  const outlineColor = style?.textOutlineColor 
    ? convertColorToASS(style.textOutlineColor) 
    : '&H000000&';
  
  const textColors = style?.alternateColors?.map(color => 
    convertColorToASS(color).replace('&H', '').replace('&', '')
  );
  const shadowColors = style?.alternateShadowColors?.map(color => 
    convertColorToASS(color).replace('&H', '').replace('&', '')
  );

  return words.map((word, index) => {
    const wordStart = start + index * timePerWord;
    const wordEnd = start + (index + 1) * timePerWord;
    
    const createWordWithGlow = (textColor, shadowColor) => {
      // Calculate border width based on shadow strength
      const borderWidth = getScaledOutlineWidth(style);
      
      // Shadow/glow layer
      const glowLayer = `Dialogue: 0,${formatTime(wordStart)},${formatTime(wordEnd)},Default,,0,0,0,,{\\alpha&HFF&\\t(0,10,\\alpha&H00&)\\c&H${shadowColor}&\\bord${borderWidth}\\blur${3 * shadowStrength}\\3c&H${shadowColor}&\\3a&H${shadowAlpha.toString(16)}&\\4c&H${shadowColor}&\\4a&H${blurAlpha.toString(16)}&\\xshad0\\yshad${-0.5}}${word}`;
      
      // Main text layer
      const textLayer = `Dialogue: 1,${formatTime(wordStart)},${formatTime(wordEnd)},Default,,0,0,0,,{\\alpha&HFF&\\t(0,10,\\alpha&H00&)\\c&H${textColor}&\\bord${borderWidth}}${word}`;
      
      return `${glowLayer}\n${textLayer}`;
    };

    const textColor = style?.color 
      ? convertColorToASS(style.color).replace('&H', '').replace('&', '') 
      : 'FFFFFF';
    const shadowColor = style?.color ? textColor : textColor;

    if (style?.animation === 'HormoziViralSentence' && textColors && shadowColors) {
      const colorIndex = index % textColors.length;
      return createWordWithGlow(textColors[colorIndex], textColors[colorIndex]);
    } else if (style?.animation === 'quickfox') {
      const yellowColor = convertColorToASS('rgba(248, 231, 28, 1)').replace('&H', '').replace('&', '');
      return createWordWithGlow(yellowColor, yellowColor);
    } else if (style?.animation === 'HormoziViralWord' && textColors) {
      const colorIndex = index % textColors.length;
      return createWordWithGlow(textColors[colorIndex], textColors[colorIndex]);
    }

    return createWordWithGlow(textColor, shadowColor);
  }).join('\n');
};