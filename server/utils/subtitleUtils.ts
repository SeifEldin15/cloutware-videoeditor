// Utility functions for subtitle processing
export const formatTime = (seconds: number): string => {
  const pad = (num: number) => num.toString().padStart(2, '0');
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${pad(hours)}:${pad(minutes)}:${pad(secs)}.${pad(ms)}`;
};

export const convertColorToASS = (color: string): string => {
  if (color.startsWith('#')) {
    let hex = color.replace('#', '');

    if (hex.length !== 6) {
      throw new Error('Invalid HEX color format. Expected #RRGGBB.');
    }

    const RR = hex.slice(0, 2).toUpperCase();
    const GG = hex.slice(2, 4).toUpperCase();
    const BB = hex.slice(4, 6).toUpperCase();

    // &HBBGGRR (no alpha)
    return `&H00${BB}${GG}${RR}&`;
  } else if (color.startsWith('rgba')) {
    const rgbaMatch = color.match(
      /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*(\d*\.?\d+))?\s*\)$/
    );

    if (!rgbaMatch) {
      throw new Error('Invalid RGBA color format. Expected rgba(r, g, b, a).');
    }

    const r = parseInt(rgbaMatch[1], 10);
    const g = parseInt(rgbaMatch[2], 10);
    const b = parseInt(rgbaMatch[3], 10);
    let a = 1;

    if (rgbaMatch[4] !== undefined) {
      a = parseFloat(rgbaMatch[4]);
      if (isNaN(a) || a < 0 || a > 1) {
        throw new Error(
          'Invalid alpha value in RGBA color. Expected a number between 0 and 1.'
        );
      }
    }

    // FFmpeg's alpha is inverted (255 - opacity)
    const AA = (255 - Math.round(a * 255)).toString(16).padStart(2, '0').toUpperCase();
    const RR = r.toString(16).padStart(2, '0').toUpperCase();
    const GG = g.toString(16).padStart(2, '0').toUpperCase();
    const BB = b.toString(16).padStart(2, '0').toUpperCase();

    // &HAABBGGRR
    return `&H${AA}${BB}${GG}${RR}&`;
  } else {
    throw new Error(
      'Unsupported color format. Please use HEX (#RRGGBB) or RGBA (rgba(r, g, b, a)) formats.'
    );
  }
};

export const calculateNextPosition = (
  currentX: number,
  currentY: number,
  duration: number
): { x: number; y: number } => {
  // Simple shake animation calculation
  const shakeIntensity = 5;
  const randomX = (Math.random() - 0.5) * shakeIntensity;
  const randomY = (Math.random() - 0.5) * shakeIntensity;
  
  return {
    x: currentX + randomX,
    y: currentY + randomY
  };
};

export interface SubtitleSegment {
  text: string;
  start: number;
  end: number;
}

export interface GirlbossStyle {
  color?: string;
  shadowStrength?: number;
  animation2?: string;
  verticalPosition?: number;
}

export interface GirlbossResult {
  events: string;
  lastPosition?: { x: number; y: number };
}

export const Girlboss = (
  subtitle: SubtitleSegment,
  start: number,
  end: number,
  style: GirlbossStyle,
  lastPosition: { x: number; y: number } | null = null
): GirlbossResult | string => {
  const words = subtitle.text.split(' ');
  const totalDuration = end - start;
  const timePerWord = totalDuration / words.length;
  const textColor = style.color ? convertColorToASS(style.color) : convertColorToASS('#F361D8');
  const lightGlowColorASS = convertColorToASS(style.color || '#F361D8');
  
  // Calculate shadow/glow intensity based on shadowStrength
  const shadowStrength = style.shadowStrength && style.shadowStrength > 1 ? style.shadowStrength + 0.2 : 1;
  const shadowAlpha = Math.round(133 - (shadowStrength * 24)); // 133 -> 85 as strength goes 0->2
  const blurAlpha = Math.round(96 - (shadowStrength * 28));    // 96 -> 40 as strength goes 0->2
  
  const events: string[] = [];
  
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

    const glowWords = words.map((w, i) => {
      if (i === index || i < index) {
        return `{${moveTag}\\c${lightGlowColorASS}\\bord${0.1 * shadowStrength}\\blur${4 * shadowStrength}\\3c${lightGlowColorASS}\\4c${lightGlowColorASS}\\4a&H${blurAlpha.toString(16)}&\\3a&H${shadowAlpha.toString(16)}&}${w}`;
      } else {
        return `{\\c&HFFFFFF&\\alpha&HFF&}${w}`; // Hidden for inactive words
      }
    }).join(' ');

    const finalColoredWords = moveTag
      ? words.map((w, i) => {
          if (i === index || i < index) {
            return `{${moveTag}\\c${textColor}\\shad0}${w}`;
          } else {
            return `{\\c&HFFFFFF&\\shad0}${w}`;
          }
        }).join(' ')
      : coloredWords;

    events.push(`Dialogue: 1,${formatTime(wordStart)},${formatTime(wordEnd)},Default,,0,0,0,,${glowWords}`);
    events.push(`Dialogue: 2,${formatTime(wordStart)},${formatTime(wordEnd)},Default,,0,0,0,,${finalColoredWords}`);
  });
  
  return style?.animation2 === 'Shake' ? {
    events: events.join('\n'),
    lastPosition: currentPosition
  } : events.join('\n');
};

export const generateASSFile = (
  subtitles: SubtitleSegment[],
  style: GirlbossStyle & {
    fontSize?: number;
    fontFamily?: string;
    textAlign?: string;
    verticalPosition?: number;
  },
  styleType?: string
): string => {
  if (subtitles.length === 0) return '';

  const fontSize = style.fontSize || 50;
  const fontFamily = getStyleFont(styleType || 'basic', style.fontFamily);
  const alignment = style.textAlign === 'left' ? '1' : style.textAlign === 'right' ? '3' : '2';
  const marginV = Math.round((720 * (100 - (style.verticalPosition || 50))) / 100);

  const fontColorASS = convertColorToASS(style.color || '#FFFFFF');
  // Fallback to system fonts if custom fonts not available
  const systemFontFamily = fontFamily === 'Luckiest Guy' ? 'Impact' : 
                          fontFamily === 'Montserrat Thin' ? 'Arial' : 
                          fontFamily;
  const boldValue = fontFamily === 'Luckiest Guy' ? 1 : 0; // Bold for Luckiest Guy font
  
  const header = `[Script Info]
ScriptType: v4.00+
PlayResX: 1280
PlayResY: 720
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,${fontFamily},${fontSize},${fontColorASS},&H000000FF&,&H00000000&,&H00000000&,${boldValue},0,0,0,100,100,0,0,1,2,0,${alignment},10,10,${marginV},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  let lastPosition: { x: number; y: number } | null = null;
  
  const events = subtitles.map((sub) => {
    const result = Girlboss(sub, sub.start, sub.end, style, lastPosition);
    
    if (typeof result === 'object' && result.lastPosition) {
      lastPosition = result.lastPosition;
      return result.events;
    }
    
    return result as string;
  }).join('\n');

  return header + events;
};

// Font mapping for different animation styles
export const getStyleFont = (styleType: string, defaultFont?: string): string => {
  const fontMappings: Record<string, string> = {
    'alternatingBoldThinAnimation': 'Montserrat-Thin',
    'ThinToBold': 'Montserrat-Thin',
    'thintobold': 'Montserrat-Thin',
    
    'HormoziViralSentence2': 'Luckiest Guy',
    'PewDiePie': 'Luckiest Guy',
    'Enlarge': 'Luckiest Guy',
    'WormEffect': 'Luckiest Guy',
    'quickfox4': 'Luckiest Guy',
    'HormoziViralSentence4': 'Luckiest Guy',
    'ShrinkingPairs': 'Luckiest Guy',
    'Wavycolors': 'Luckiest Guy',
    'wavycolors': 'Luckiest Guy',
    'quickfox': 'Luckiest Guy',
    'Girlboss': 'Luckiest Guy',
    'girlboss': 'Luckiest Guy',
    'GreenToRedPair': 'Luckiest Guy',
    'hormoziViral': 'Luckiest Guy',
    'hormozi': 'Luckiest Guy',
    'quickfox5': 'Luckiest Guy',
    'RevealEnlarge': 'Luckiest Guy',
    'TrendingAli': 'Luckiest Guy',
    'HormoziViralSentence': 'Luckiest Guy',
    'weakGlitch': 'Luckiest Guy',
    'HormoziViralWord': 'Luckiest Guy',
    'SimpleDisplay': 'Luckiest Guy',
    'none': 'Luckiest Guy',
    
    // Basic uses Arial
    'basic': 'Arial'
  };

  return defaultFont || fontMappings[styleType] || 'Arial';
};

export const getFontFilePath = (fontFamily: string): string => {
  const fontFileMap: Record<string, string> = {
    'Montserrat Thin': 'Montserrat Thin.ttf',
    'Montserrat': 'Montserrat.ttf',
    'Luckiest Guy': 'Luckiest Guy.ttf',  // Using original file name
    'Arial': 'arial.ttf',
    'Arial Black': 'Arial Black.ttf',
    'Impact': 'impact.ttf',
    'Helvetica': 'helvetica.ttf',
    'Georgia': 'georgia.ttf',
    'Times New Roman': 'TimesNewRoman.ttf',
    'Verdana': 'Verdana.ttf',
    'Trebuchet': 'Trebuchet.ttf',
    'Comic Sans MS': 'Comic Sans MS.ttf',
    'Courier New': 'Courier New.ttf',
    'Garamond': 'Garamond.ttf',
    'Palatino Linotype': 'Palatino Linotype.ttf',
    'Bookman Old Style': 'Bookman Old Style.ttf',
    'Erica One': 'Erica One.ttf',
    'Bungee': 'bungee.ttf',
    'Sigmar': 'sigmar.ttf',
    'Sora': 'sora.ttf',
    'Tahoma': 'tahoma.ttf',
    'Gotham Ultra': 'Gotham Ultra.ttf',
    'Bodoni Moda': 'Bodoni Moda.ttf',
    'Montserrat ExtraBold': 'Montserrat ExtraBold.ttf',
    'Montserrat Black': 'Montserrat Black.ttf'
  };
  
  const fontFile = fontFileMap[fontFamily];
  if (!fontFile) {
    return ''; 
  }
  
  const { join } = require('path');
  return join(process.cwd(), 'public', 'fonts', fontFile);
};

export const generateFontsSection = (fontFamily: string): string => {
  const fontFilePath = getFontFilePath(fontFamily);
  if (!fontFilePath) {
    return '';    
  }
  
  const fontKey = fontFamily.toLowerCase().replace(/\s+/g, '_');
  return `[Fonts]
${fontKey}: ${fontFilePath}`;
};

export const generateAdvancedASSFile = (
  subtitles: SubtitleSegment[],
  style: GirlbossStyle & {
    fontSize?: number;
    fontFamily?: string;
    fontFilePath?: string; // NEW: Direct font file path
    textAlign?: string;
    verticalPosition?: number;
    alternateColors?: string[];
    textOutlineWidth?: number;
  },
  styleType: string
): string => {
  if (subtitles.length === 0) return '';

  const fontSize = style.fontSize || 50;
  const fontFamily = style.fontFamily || getStyleFont(styleType, style.fontFamily);
  const alignment = style.textAlign === 'left' ? '1' : style.textAlign === 'right' ? '3' : '2';
  const marginV = Math.round((720 * (100 - (style.verticalPosition || 50))) / 100);

  const fontColorASS = convertColorToASS(style.color || '#FFFFFF');
  const boldValue = (fontFamily.includes('Arial Black') || fontFamily.includes('Luckiest Guy') || fontFamily.toLowerCase().includes('black')) ? 1 : 0;
  
  console.log(`🎨 ASS File using font: "${fontFamily}" (Bold: ${boldValue})`);
  
  const header = `[Script Info]
ScriptType: v4.00+
PlayResX: 1280
PlayResY: 720
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,${fontFamily},${fontSize},${fontColorASS},&H000000FF&,&H00000000&,&H00000000&,${boldValue},0,0,0,100,100,0,0,1,2,0,${alignment},10,10,${marginV},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  let lastPosition: { x: number; y: number } | null = null;
  
  const events = subtitles.map((sub) => {
    let result: GirlbossResult | string;
    
    switch (styleType) {
      case 'girlboss':
        result = Girlboss(sub, sub.start, sub.end, style, lastPosition);
        break;
      case 'hormozi':
        result = alternatingColorsAnimation(sub, sub.start, sub.end, style, lastPosition);
        break;
      case 'thintobold':
        result = ThinToBold(sub, sub.start, sub.end, style, lastPosition);
        break;
      case 'wavycolors':
        result = Wavycolors(sub, sub.start, sub.end, style);
        break;
      default:
        result = Girlboss(sub, sub.start, sub.end, style, lastPosition);
    }
    
    if (typeof result === 'object' && result.lastPosition) {
      lastPosition = result.lastPosition;
      return result.events;
    }
    
    return result as string;
  }).join('\n');

  return header + events;
};

export const alternatingColorsAnimation = (
  subtitle: SubtitleSegment,
  start: number,
  end: number,
  style: GirlbossStyle & { alternateColors?: string[]; shadowColor?: string },
  lastPosition: { x: number; y: number } | null = null
): GirlbossResult | string => {
  const words = subtitle.text.split(' ');
  const timePerWord = (end - start) / words.length;
  
  const shadowStrength = style.shadowStrength || 3;
  const shadowAlpha = Math.round(150 - (shadowStrength * 20));
  const blurAlpha = Math.round(120 - (shadowStrength * 20));
  
  const defaultColors = ['0BF431', '2121FF', '1DE0FE', 'FFFF00'];
  const hormoziColors = style?.alternateColors 
    ? style.alternateColors.map(color => convertColorToASS(color).replace('&H', '').replace('&', ''))
    : defaultColors;

  const glowColors = style?.alternateColors
    ? Object.fromEntries(
        style.alternateColors.map((color, index) => [
          convertColorToASS(color).replace('&H', '').replace('&', ''),
          convertColorToASS(style.alternateColors![index]).replace('&H', '').replace('&', '')
        ])
      )
    : Object.fromEntries(hormoziColors.map(color => [color, color]));

  const whiteASS = convertColorToASS('#FFFFFF');
  
  let events: string[] = [];
  let currentPosition = lastPosition || { x: 670, y: 0 };

  words.forEach((word, index) => {
    const wordStart = start + index * timePerWord;
    const wordEnd = start + (index + 1) * timePerWord;
    const duration = wordEnd - wordStart;

    const colorIndex = index % hormoziColors.length;
    const color = hormoziColors[colorIndex];
    const glowColor = glowColors[color];
    const borderWidth = 0.1 * shadowStrength;
    const blurAmount = 2 * shadowStrength;

    let moveTag = '';
    if (style?.animation2 === 'Shake') {
      const endPosition = calculateNextPosition(currentPosition.x, currentPosition.y, duration);
      const marginV = style?.verticalPosition 
        ? Math.round((720 * (100 - style.verticalPosition)) / 100)
        : 0;
      moveTag = `\\move(${Math.round(currentPosition.x)},${Math.round(currentPosition.y + marginV)},${Math.round(endPosition.x)},${Math.round(endPosition.y + marginV)})`;
      currentPosition = endPosition;
    }

    const coloredText = words.map((w, i) => {
      if (i === index) {
        return `{${moveTag}\\c&H${color}&\\bord0\\shad0}${w}`;
      } else if (i < index) {
        return `{\\c${whiteASS}\\bord0\\shad0}${w}`;
      } else {
        return `{\\c${whiteASS}\\bord0\\shad0}${w}`;
      }
    }).join(' ');

    const glowText = words.map((w, i) => {
      if (i === index) {
        return `{${moveTag}\\c&H${glowColor}&\\bord${borderWidth}\\blur${blurAmount}\\3c&H${glowColor}&\\3a&H${shadowAlpha.toString(16)}&\\4c&H${glowColor}&\\4a&H${blurAlpha.toString(16)}&\\xshad0\\yshad${-1}}${w}`;
      }
      return `{\\alpha&HFF&}${w}`;
    }).join(' ');

    events.push(`Dialogue: 0,${formatTime(wordStart)},${formatTime(wordEnd)},Default,,0,0,0,,${glowText}`);
    events.push(`Dialogue: 1,${formatTime(wordStart)},${formatTime(wordEnd)},Default,,0,0,0,,${coloredText}`);
  });

  return style?.animation2 === 'Shake' ? {
    events: events.join('\n'),
    lastPosition: currentPosition
  } : events.join('\n');
};

// ThinToBold animation
export const ThinToBold = (
  subtitle: SubtitleSegment,
  start: number,
  end: number,
  style: GirlbossStyle,
  lastPosition: { x: number; y: number } | null = null
): GirlbossResult | string => {
  const words = subtitle.text.split(' ');
  const totalDuration = end - start;
  const wordPairs: string[] = [];
    
  for (let i = 0; i < words.length; i += 2) {
    if (i + 1 < words.length) {
      wordPairs.push(words[i] + ' ' + words[i + 1]);
    } else {
      wordPairs.push(words[i]); 
    }
  }

  const timePerPair = totalDuration / wordPairs.length;
  const textColor = convertColorToASS(style.color || '#FFFFFF');
  const shadowStrength = style.shadowStrength ? style.shadowStrength + 0.2 : 1;
  const textShadowColor = convertColorToASS(style.color || '#FFFFFF');
  
  let currentPosition = lastPosition || { x: 670, y: 0 };
  let events: string[] = []; 

  wordPairs.forEach((pair, index) => {
    const pairStart = start + index * timePerPair; 
    const pairEnd = start + (index + 1) * timePerPair; 

    let moveTag = '';
    if (style?.animation2 === 'Shake') {
      const duration = pairEnd - pairStart;
      const endPosition = calculateNextPosition(currentPosition.x, currentPosition.y, duration);
      const marginV = style?.verticalPosition 
        ? Math.round((720 * (100 - style.verticalPosition)) / 100)
        : 0;
      moveTag = `\\move(${Math.round(currentPosition.x)},${Math.round(currentPosition.y + marginV)},${Math.round(endPosition.x)},${Math.round(endPosition.y + marginV)})`;
      currentPosition = endPosition;
    }

    const coloredText = wordPairs.map((w, i) => {
      if (i === index) {
        return `{${moveTag}\\c${textColor}\\bord0\\fn@Montserrat\\fscx120\\fscy120}${w}`;
      }
      return `{\\c${textColor}\\bord0\\fn@Montserrat Thin}${w}`;
    }).join('\\N');
    
    const glowText = wordPairs.map((w, i) => {
      if (i === index) {
        const shadowAlpha = Math.round(133 - (shadowStrength * 24));
        const blurAlpha = Math.round(96 - (shadowStrength * 28));
        
        return `{${moveTag}\\c${textShadowColor}\\bord${0.1 * shadowStrength}\\blur${4 * shadowStrength}\\3c${textShadowColor}\\3a&H${shadowAlpha.toString(16)}&\\4c${textShadowColor}\\4a&H${blurAlpha.toString(16)}&\\xshad0\\yshad${-1}\\fn@Montserrat\\fscx120\\fscy120}${w}`;
      }
      return `{\\c${textShadowColor}\\bord0\\blur0\\shad0\\fn@Montserrat Thin}${w}`;
    }).join('\\N');
    
    events.push(`Dialogue: 0,${formatTime(pairStart)},${formatTime(pairEnd)},Default,,0,0,0,,${glowText}`);
    events.push(`Dialogue: 1,${formatTime(pairStart)},${formatTime(pairEnd)},Default,,0,0,0,,${coloredText}`);
  });
  
  return style?.animation2 === 'Shake' ? {
    events: events.join('\n'),
    lastPosition: currentPosition
  } : events.join('\n');
};

// WavyColors animation
export const Wavycolors = (
  subtitle: SubtitleSegment,
  start: number,
  end: number,
  style: GirlbossStyle & { textOutlineWidth?: number }
): string => {
  const words = subtitle.text.split(' ');
  const duration = end - start;
  const timePerWord = duration / words.length;
  const events: string[] = [];

  const colors = ['&H00FF00&', '&HFFFF00&', '&H00FFFF&']; // Green, Yellow, Light blue

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

  return events.join('\n');
};

export const parseSRT = (srtContent: string): SubtitleSegment[] => {
  const segments: SubtitleSegment[] = [];
  const blocks = srtContent.trim().split('\n\n');
  
  for (const block of blocks) {
    const lines = block.trim().split('\n');
    if (lines.length < 3) continue;
    
    const timeLine = lines[1];
    const timeMatch = timeLine.match(/(\d{2}):(\d{2}):(\d{2}),(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2}),(\d{3})/);
    
    if (!timeMatch) continue;
    
    const start = parseInt(timeMatch[1]) * 3600 + 
                  parseInt(timeMatch[2]) * 60 + 
                  parseInt(timeMatch[3]) + 
                  parseInt(timeMatch[4]) / 1000;
    
    const end = parseInt(timeMatch[5]) * 3600 + 
                parseInt(timeMatch[6]) * 60 + 
                parseInt(timeMatch[7]) + 
                parseInt(timeMatch[8]) / 1000;
    
    const text = lines.slice(2).join(' ');
    
    segments.push({ text, start, end });
  }
  
  return segments;
}; 