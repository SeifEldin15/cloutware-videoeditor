import { 
  SubtitleSegment, 
  GirlbossStyle, 
  formatTime
} from '../subtitleUtils';
import { convertColorToASS } from '../colorUtils';

/**
 * WavyColors Animation: Character-level color cycling with stretch effects
 * Each word gets animated with character sets cycling through colors
 * Includes vertical stretch effects and character-by-character color transitions
 * 
 * @param subtitle - The subtitle segment to animate
 * @param start - Start time in seconds
 * @param end - End time in seconds
 * @param style - Style configuration including outline and color options
 * @returns String of ASS subtitle events
 */
export const Wavycolors = (
  subtitle: SubtitleSegment,
  start: number,
  end: number,
  style: GirlbossStyle & { 
    textOutlineWidth?: number; 
    outlineWidth?: number; 
    outlineColor?: string; 
    outlineBlur?: number 
  }
): string => {
  // Input validation
  if (!subtitle?.text?.trim()) {
    console.warn('WavyColors animation: Empty or invalid subtitle text provided');
    return '';
  }

  if (start >= end) {
    console.warn('WavyColors animation: Invalid time range - start must be before end');
    return '';
  }

  try {
    const words = subtitle.text.split(' ').filter(word => word.trim() !== '');
    if (words.length === 0) {
      console.warn('WavyColors animation: No valid words found in subtitle text');
      return '';
    }

    const duration = end - start;
    const timePerWord = duration / words.length;
    const events: string[] = [];

    // Color palette for cycling
    const colors = ['&H00FF00&', '&HFFFF00&', '&H00FFFF&']; // Green, Yellow, Light blue
    
    // Handle outline settings with defaults and bounds checking
    const baseOutlineWidth = Math.max(0, style.outlineWidth || 2);
    const outlineColorASS = (() => {
      try {
        return convertColorToASS(style.outlineColor || '#000000');
      } catch {
        console.warn('WavyColors animation: Invalid outline color, using black');
        return convertColorToASS('#000000');
      }
    })();
    const outlineBlur = Math.max(0, style.outlineBlur || 0);
    const effectOutlineWidth = Math.max(0, style?.textOutlineWidth || 2);

    // Process each word
    words.forEach((word, wordIndex) => {
      if (!word.trim()) return; // Skip empty words

      const wordStart = start + (wordIndex * timePerWord);
      const wordEnd = wordStart + timePerWord;
      
      // Cycle through colors for each word
      const color = colors[wordIndex % colors.length];
      
      // Split word into character sets (max 4 characters per set)
      const charSets = word.match(/.{1,4}/g) || [word];
      if (charSets.length === 0) return;

      const timePerSet = timePerWord / charSets.length;

      // Create stretch effect with bounds checking
      const stretchStart = Math.max(0, timePerWord * 0.0);
      const stretchMid = Math.max(stretchStart, timePerWord * 0.25);
      const stretchEnd = Math.max(stretchMid, timePerWord * 0.5);
      const stretchEffect = `{\\t(${stretchStart},${stretchMid},\\fscx100\\fscy150)}{\\t(${stretchMid},${stretchEnd},\\fscx100\\fscy100)}`;
      
      // Generate events for each character set
      charSets.forEach((_, coloredSetIndex) => {
        const setStart = wordStart + (coloredSetIndex * timePerSet);
        const setEnd = setStart + timePerSet;
        
        // Build word display with character set coloring
        let wordDisplay = '';
        charSets.forEach((chars, setIndex) => {
          const isColored = setIndex === coloredSetIndex;
          
          // Apply different styles for colored vs normal character sets
          const setStyle = isColored 
            ? `{\\3c${color}\\bord${effectOutlineWidth}\\c${color}\\blur8\\alpha&H60&\\shad5}` 
            : `{\\c&HFFFFFF&\\bord${baseOutlineWidth}\\3c${outlineColorASS}\\blur${outlineBlur}\\alpha&H00&\\shad0}`;
          
          wordDisplay += setStyle + chars;
        });

        // Add the animated event
        events.push(
          `Dialogue: 0,${formatTime(setStart)},${formatTime(setEnd)},Default,,0,0,0,,` +
          `${stretchEffect}${wordDisplay}`
        );
      });

      // Add spacing between words (except for the last word)
      if (wordIndex < words.length - 1) {
        try {
          events.push(
            `Dialogue: 0,${formatTime(wordStart)},${formatTime(wordEnd)},Default,,0,0,0,, `
          );
        } catch (error) {
          console.warn(`WavyColors animation: Error adding spacing for word ${wordIndex}`);
        }
      }
    });

    return events.join('\n');

  } catch (error) {
    console.error('WavyColors animation: Unexpected error during processing:', error);
    return '';
  }
}; 