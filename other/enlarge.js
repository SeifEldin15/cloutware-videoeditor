import { formatTime } from '../../utils/timeUtils';
import { convertColorToASS } from '../colorUtils';

const getScaledOutlineWidth = (style, scaleFactor = 0.75) => {
  return style && style.textOutlineWidth ? style.textOutlineWidth * scaleFactor : 0;
};

export const Enlarge = (subtitle, start, end, style) => {
  const words = subtitle.text.split(' ');
  const totalDuration = end - start;
  const timePerWord = totalDuration / words.length;
  let events = [];

  const outlineWidth = getScaledOutlineWidth(style);
  const outlineColor = style?.textOutlineColor || '&H000000&';
  const textColor = style?.color ? convertColorToASS(style.color) : convertColorToASS('#FFFFFF');
  const marginV = style?.verticalPosition 
    ? Math.round((720 * (100 - style.verticalPosition)) / 100)
    : 360; // Default to middle of screen

  const popDuration = (end - start) * 0.2;
  
  // Split words into two halves
  const halfIndex = Math.ceil(words.length / 2);
  const firstHalf = words.slice(0, halfIndex).join(' ');
  const secondHalf = words.slice(halfIndex).join(' ');

  // Move the transform tag to the beginning and then apply colors
  const scaleFactor = style?.fontSize ? (style.fontSize / 48) * 150 : 150; // 48 is default ASS font size
  const coloredText = 
    `{\\t(0,${popDuration * 1000},\\fscx${scaleFactor}\\fscy${scaleFactor})}` +
    `{\\pos(640,${marginV})\\an5\\c&HFFFFFF&\\3c${outlineColor}\\bord${outlineWidth}}${firstHalf} ` +
    `{\\pos(640,${marginV})\\an5\\c${textColor}\\3c${outlineColor}\\bord${outlineWidth}}${secondHalf}`;

  events.push(`Dialogue: 1,${formatTime(start)},${formatTime(end)},Default,,0,0,0,,${coloredText}`);

  return events;
}; 