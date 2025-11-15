import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';

const COLORS = ['#11FF21', '#f4310b', '#FFFF00'];  // For HormoziViralSentence
const COLORS2 = ['#11FF21', '#f4310b', '#FFFF00', 'white'];  // For HormoziViralWord
const COLORSREDGREEN = ['#11FF21', '#f4310b'];  // For GreenToRed component
const QuickfoxCOLORS = ['rgb(255, 143, 236)', 'white'];
const WAVY_COLORS = ['#65FE08', 'yellow', '#0FF9EE', '#1FFFF7', 'red'];
// For HormoziViralSentence
const getGlowEffect = (color) => {
  // Convert the color to rgba with different opacity levels
  const getRGBA = (hexColor, opacity) => {
    // If color is already RGB/RGBA format, convert to rgba
    if (hexColor.startsWith('rgb')) {
      return hexColor.replace('rgb', 'rgba').replace(')', `, ${opacity})`);
    }
    // Convert hex to rgba
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  return `
    0 0 5px ${getRGBA(color, 0.8)},
    0 0 10px ${getRGBA(color, 0.6)},
    0 0 20px ${getRGBA(color, 0.4)},
    0 0 30px ${getRGBA(color, 0.2)}
  `;
};

// Add white glow effect function
const getWhiteGlowEffect = () => {
  return `
    0 0 5px rgba(255, 255, 255, 0.4),
    0 0 10px rgba(255, 255, 255, 0.3),
    0 0 20px rgba(255, 255, 255, 0.2),
    0 0 30px rgba(255, 255, 255, 0.1)
  `;
};

// At the top of the file, add a helper function to extract styles
const extractStyles = (style) => {
  return {
    outlineColor: style?.outlineColor || 'black',
    outlineWidth: style?.outlineWidth || '2px',
    textColor: style?.textColor || 'white',
    backgroundColor: style?.backgroundColor || 'transparent',
    // Preserve any other style properties
    ...style
  };
};

export const HormoziViralSentence = ({ style, subtitles = [], groupColor = 'white' }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const styles = extractStyles(style);
  
  const firstSubtitleStart = subtitles[0]?.start || 0;
  const firstStartFrame = firstSubtitleStart * fps;

  // Get colors and shadow colors
  const colors = style?.alternateColors || COLORS;
  const shadowColors = style?.alternateColors || colors; // Default to text colors if no shadow colors
  const intensity = style?.shadowStrength || 1;

  // Updated getGlowEffect to use intensity and shadow colors
  const getGlowEffect = (colorIndex) => {
    const shadowColor = shadowColors[colorIndex % shadowColors.length];

    // Convert the color to rgba with different opacity levels
    const getRGBA = (color, opacity) => {
      if (color.startsWith('rgb')) {
        return color.replace('rgb', 'rgba').replace(')', `, ${opacity})`);
      }
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    };

    return `
      0 0 ${5 * intensity}px ${getRGBA(shadowColor, 0.8)},
      0 0 ${10 * intensity}px ${getRGBA(shadowColor, 0.6)},
      0 0 ${20 * intensity}px ${getRGBA(shadowColor, 0.4)},
      0 0 ${30 * intensity}px ${getRGBA(shadowColor, 0.2)}
    `;
  };

  // Add CSS keyframes animation style with slower timing
  const shakeKeyframes = `
    @keyframes shake2 {
      0% { transform: translate(0, 0); }
      20% { transform: translate(20px, 0); }
      40% { transform: translate(20px, 20px); }
      60% { transform: translate(-20px, 0); }
      80% { transform: translate(-20px, -20px); }
      100% { transform: translate(0, 0); }
    }
  `;

  const getWhiteGlowEffect2 = (intensity) => {
    return  `
     0 0 ${5 * intensity}px rgba(255, 255, 255, 0.8),
     0 0 ${10 * intensity}px rgba(255, 255, 255, 0.6),
     0 0 ${20 * intensity}px rgba(255, 255, 255, 0.4),
     0 0 ${30 * intensity}px rgba(255, 255, 255, 0.2)
   `;
     }

  return (
    <>
        <style>{shakeKeyframes}</style>
      <div className={`p-4 flex flex-col`} style={style}>
        {subtitles.map((subtitle, index) => {
          const words = subtitle.text.split(' ');
          const subtitleDuration = subtitle.end - subtitle.start;
          const wordsPerSecond = words.length / subtitleDuration;
          const startFrame = subtitle.start * fps;
          const isSubtitleActive = frame >= startFrame;
  
          return (
            <p 
              key={index} 
              className="" 
              style={{ 
                margin: '5px 0',
                // Base animation on first subtitle's start time instead of individual subtitle
                animation: frame >= firstStartFrame ? 'none' : 'none'
              }}
            >
              {words.map((word, wordIndex) => {
                const wordStartFrame = startFrame + (wordIndex / wordsPerSecond) * fps;
                const wordEndFrame = startFrame + ((wordIndex + 1) / wordsPerSecond) * fps;
                const isVisible = frame >= wordStartFrame;
                const isVisibleColor = frame >= wordStartFrame && frame < wordEndFrame;
                const currentColor = isVisibleColor ? colors[wordIndex % colors.length] : styles.textColor;
  
            return (
            <span
              key={wordIndex}
              className=""
              style={{
                color: currentColor,
                backgroundColor: styles.backgroundColor,
                WebkitTextStroke: `${styles.outlineWidth} ${styles.outlineColor}`,
                display: 'inline-block',
                margin: '0 4px',
                backgroundColor: styles.backgroundColor,
                opacity: isVisible ? 1 : 0,
                transition: 'opacity 0.05s',
                textShadow: isVisibleColor ? getGlowEffect(wordIndex) : getWhiteGlowEffect2(intensity),
              }}
            >
              {word}
            </span>
            );
          })}
        </p>
      );
    })}
  </div>
</>
);
};

  
  export const HormoziViralSentence2 = ({ style, subtitles = [], groupColor = 'white' }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    const styles = extractStyles(style);
    
    // Get the start time of the first subtitle for continuous animation
    const firstSubtitleStart = subtitles[0]?.start || 0;
    const firstStartFrame = firstSubtitleStart * fps;

    // Use style.alternateColors if provided, otherwise fallback to COLORS
    const colors = style?.alternateColors || COLORS;
    // Get shadow colors from style or default to text colors
    const shadowColors = style?.alternateColors || colors;
    // Get shadow strength from style or default to 1
    const intensity = style?.shadowStrength || 1;

    // Updated getGlowEffect to use intensity and shadow colors
    const getGlowEffect = (colorIndex) => {
      const shadowColor = shadowColors[colorIndex % shadowColors.length];
      
      // Convert the color to rgba with different opacity levels
      const getRGBA = (color, opacity) => {
        if (color.startsWith('rgb')) {
          return color.replace('rgb', 'rgba').replace(')', `, ${opacity})`);
        }
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
      };

      return `
        0 0 ${5 * intensity}px ${getRGBA(shadowColor, 0.8)},
        0 0 ${10 * intensity}px ${getRGBA(shadowColor, 0.6)},
        0 0 ${20 * intensity}px ${getRGBA(shadowColor, 0.4)},
        0 0 ${30 * intensity}px ${getRGBA(shadowColor, 0.2)}
      `;
    };

    let shakeKeyframes = '';
    if (style.animation2 === 'Shake') {
    shakeKeyframes = `
      @keyframes shake2 {
        0% { transform: translate(0, 0); }
        20% { transform: translate(20px, 0); }
        40% { transform: translate(20px, 20px); }
        60% { transform: translate(-20px, 0); }
        80% { transform: translate(-20px, -20px); }
        100% { transform: translate(0, 0); }
      }
    `;
}

    return (
      <>
        <style>{shakeKeyframes}</style>
        <div className={`p-4 flex flex-col`} style={style}>
          {subtitles.map((subtitle, index) => {
            const words = subtitle.text.split(' ');
            const subtitleDuration = subtitle.end - subtitle.start;
            const wordsPerSecond = words.length / subtitleDuration;
            const startFrame = subtitle.start * fps;

            return (
              <p 
                key={index} 
                className="" 
                style={{ 
                  margin: '5px 0',
                  animation: frame >= firstStartFrame ? 'shake2 5.2s ease-in-out infinite' : 'none'
                }}
              >
                {words.map((word, wordIndex) => {
                  const wordStartFrame =
                    startFrame + (wordIndex / wordsPerSecond) * fps;
                  const wordEndFrame =
                    startFrame + ((wordIndex + 1) / wordsPerSecond) * fps;
                  const isVisible = frame >= wordStartFrame && frame < wordEndFrame;
                  const currentColor = colors[wordIndex % colors.length];

                  return (
                    <span
                      key={wordIndex}
                      className=""
                      style={{
                        display: 'inline-block',
                        margin: '0 4px',
                        color: isVisible ? currentColor : 'white',
                        transition: 'transform 0.3s',
                        textShadow: isVisible ? getGlowEffect(wordIndex) : getWhiteGlowEffect(),
                        WebkitTextStroke: `${styles.outlineWidth} ${styles.outlineColor}`,
                      }}
                    >
                      {word}
                    </span>
                  );
                })}
              </p>
            );
          })}
        </div>
      </>
    );
  };
  
  export const HormoziViralSentence4 = ({ style, subtitles = [] }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    // Extract outline properties from style
    const outlineWidth = style?.textOutlineWidth * 0.5  || '2px';
    const outlineColor = style?.textOutlineColor || 'black';
console.log("outlineWiddsfgth", outlineWidth);
    const firstSubtitleStart = subtitles[0]?.start || 0;
    const firstStartFrame = firstSubtitleStart * fps;
    let shakeKeyframes = '';
    if (style.animation2 === 'Shake') {
    shakeKeyframes = `
      @keyframes shake2 {
        0% { transform: translate(0, 0); }
        20% { transform: translate(20px, 0); }
        40% { transform: translate(20px, 30px); }
        60% { transform: translate(-20px, 0); }
        80% { transform: translate(-20px, -30px); }
        100% { transform: translate(0, 0); }
      }
    `;
}
    const defaultColorPairs = [
      ['#65FE08', '#F22E19'],  // First pair: Green & Red
      ['#1DE0FE', '#FFFF00']   // Second pair: Cyan & Yellow
    ];
    
    const colorPairs = style?.alternateColors ? [
      [style.alternateColors[0], style.alternateColors[1]],
      [style.alternateColors[2], style.alternateColors[3]]
    ] : defaultColorPairs;

    // Get shadow colors from style or default to text colors
    const shadowPairs = style?.alternateColors ? [
      [style.alternateColors[0], style.alternateColors[1]],
      [style.alternateColors[2], style.alternateColors[3]]
    ] : colorPairs;

    const getGlowStyle = (colorIndex, pairIndex) => {
      const color = colorPairs[pairIndex % 2][colorIndex % 2];
      const shadowColor = shadowPairs[pairIndex % 2][colorIndex % 2];
      const intensity = style?.shadowStrength * 0.8 || 1;

      // Helper function to convert hex/rgb to rgba
      const toRGBA = (color, alpha) => {
        if (color.startsWith('rgb')) {
          return color.replace('rgb', 'rgba').replace(')', `, ${alpha})`);
        }
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
      };

      // Increased shadow spread values (30->60, 60->120, 90->180, 120->240)
      return `
        0 0 ${60 * intensity * 0.3 }px ${toRGBA(shadowColor, 0.8 * intensity * 0.1)},
        0 0 ${120 * intensity * 0.3 }px ${toRGBA(shadowColor, 0.8 * intensity * 0.1)},
        0 0 ${180 * intensity * 0.3 }px ${toRGBA(shadowColor, 0.8 * intensity * 0.2)},
        0 0 ${240 * intensity * 0.3 }px ${toRGBA(shadowColor, 0.8 * intensity * 0.2)}
      `;
    };

    // Add text-shadow based outline
    const getTextOutline = (color = 'black') => {
      const width = outlineWidth * 2 || '6px';
      return `
        -${width}px -${width}px 0 ${color},
        ${width}px -${width}px 0 ${color},
        -${width}px ${width}px 0 ${color},
        ${width}px ${width}px 0 ${color}
      `;
    };

    return (
      <>
        <style>{shakeKeyframes}</style>
        <div className={`p-4 flex flex-col`} 
             style={{
               ...style,
               animation: frame >= firstStartFrame ? 'shake2 5s ease-in-out infinite' : 'none'
             }}>
          {subtitles.map((subtitle, index) => {
            const words = subtitle.text.split(' ');
            const wordPairs = [];
            
            // Group words into pairs
            for (let i = 0; i < words.length; i += 2) {
              wordPairs.push(words.slice(i, i + 2).join(' '));
            }

            const subtitleDuration = subtitle.end - subtitle.start;
            const pairsPerSecond = wordPairs.length / (2 * subtitleDuration); // Slowed down
            const startFrame = subtitle.start * fps;

            return (
              <div key={index} className="flex flex-col" style={{ margin: '5px 0' }}>
                {wordPairs.map((pair, pairIndex) => {
                  const groupIndex = Math.floor(pairIndex / 2);
                  const isFirstInGroup = pairIndex % 2 === 0;
                  
                  const groupStartFrame = startFrame + (groupIndex / pairsPerSecond) * fps;
                  const groupEndFrame = groupStartFrame + (fps / pairsPerSecond);
                  
                  const isGroupVisible = frame >= groupStartFrame && frame < groupEndFrame;
                  const isTransitionPhase = frame >= groupStartFrame + (fps / (pairsPerSecond * 2));
                  
                  let color = 'white';
                  let scale = 1;
                  if (isGroupVisible) {
                    if (isFirstInGroup) {
                      color = isTransitionPhase ? 'white' : colorPairs[groupIndex % 2][0];
                      scale = isTransitionPhase ? 1 : 1.5; // Add scale when colored
                    } else {
                      color = isTransitionPhase ? colorPairs[groupIndex % 2][1] : 'white';
                      scale = isTransitionPhase ? 1.5 : 1; // Add scale when colored
                    }
                  }

                  return (
                    <span
                      key={pairIndex}
                      style={{
                        color: color,
                        display: isGroupVisible ? 'inline-block' : 'none',
                        padding: '25px',
                        transform: `scale(${scale})`,
                        transition: '',
                        textShadow: `${getTextOutline(outlineColor)}, ${color !== 'white' ? getGlowStyle(isFirstInGroup ? 0 : 1, groupIndex) : '5px 5px 10px #000000'}`,
                        fontWeight: 1000,
                        letterSpacing: '8px',
                        WebkitFontSmoothing: 'antialiased',
                        MozOsxFontSmoothing: 'grayscale',
                        fontFamily: style.fontFamily,
                        lineHeight: '1em',
                      }}
                    >
                      {pair}
                    </span>
                  );
                })}
              </div>
            );
          })}
        </div>
      </>
    );
  };


  export const ThinToBold = ({ style, subtitles = [] }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    const styles = extractStyles(style);
    const textColor = style.color ? style.color : '#FFFFFF';
    
    // Get shadow color and strength from style
    const shadowColor = style.color || textColor;
    const shadowStrength = style.shadowStrength || 1; // Get shadowStrength from style props

    // Updated getGlowStyle function with shadowStrength
    const getGlowStyle = (isActive) => {
      if (!isActive) return 'none';
      
      // Apply shadowStrength to all shadow values
      return `
        0 0 ${10 * shadowStrength}px ${shadowColor},
        0 0 ${20 * shadowStrength}px ${shadowColor},
        0 0 ${30 * shadowStrength}px ${shadowColor},
        0 0 ${40 * shadowStrength}px ${shadowColor}
      `;
    };

    // Get the start time of the first subtitle for continuous animation
    const firstSubtitleStart = subtitles[0]?.start || 0;
    const firstStartFrame = firstSubtitleStart * fps;

    // Add CSS keyframes animation style
    let shakeKeyframes = '';
    if (style.animation2 === 'Shake') {
    shakeKeyframes = `
      @keyframes shake2 {
        0% { transform: translate(0, 0); }
        20% { transform: translate(20px, 0); }
        40% { transform: translate(20px, 20px); }
        60% { transform: translate(-20px, 0); }
        80% { transform: translate(-20px, -20px); }
        100% { transform: translate(0, 0); }
      }
    `;
    }
    return (
      <>
        <style>{shakeKeyframes}</style>
        <div className={`p-4 flex flex-col`} 
             style={{
               ...style,
               animation: frame >= firstStartFrame ? 'shake2 5.2s ease-in-out infinite' : 'none'
             }}>
          {subtitles.map((subtitle, index) => {
            const words = subtitle.text.split(' ');
            const wordPairs = [];
            
            // Group words into pairs
            for (let i = 0; i < words.length; i += 2) {
              if (i + 1 < words.length) {
                wordPairs.push(words[i] + ' ' + words[i + 1]);
              } else {
                wordPairs.push(words[i]);
              }
            }

            const subtitleDuration = subtitle.end - subtitle.start;
            const pairsPerSecond = wordPairs.length / subtitleDuration;
            const startFrame = subtitle.start * fps;

            return (
              <div key={index} className="flex flex-col" style={{ margin: '5px 0' }}>
                {wordPairs.map((pair, pairIndex) => {
                  const pairStartFrame = startFrame + (pairIndex / pairsPerSecond) * fps;
                  const pairEndFrame = startFrame + ((pairIndex + 1) / pairsPerSecond) * fps;
                  const isActivePair = frame >= pairStartFrame && frame < pairEndFrame;

                  // Create two layers for each pair - glow and text
                  return (
                    <div key={pairIndex} style={{ position: 'relative' }}>
                      {/* Glow layer with updated blur based on shadowStrength */}
                      <span
                        style={{
                          position: 'absolute',
                          display: 'inline-block',
                          margin: '4px 8px',
                          padding: '25px',
                          color: textColor,
                          fontFamily: isActivePair ? 'Montserrat' : 'Montserrat Thin',
                          transform: isActivePair ? 'scale(1.5)' : 'scale(1)',
                          filter: isActivePair ? `blur(${4 * shadowStrength}px)` : 'blur(0)', // Scale blur with shadowStrength
                          opacity: isActivePair ? 0.5 : 0.1,
                          transition: '',
                          textShadow: getGlowStyle(isActivePair),
                        }}
                      >
                        {pair}
                      </span>
                      
                      {/* Main text layer */}
                      <span
                        style={{
                          display: 'inline-block',
                          margin: '4px 8px',
                          padding: '25px',
                          color: textColor,
                          fontFamily: isActivePair ? 'Montserrat' : 'Montserrat Thin',
                          fontWeight: isActivePair ? 800 : 200,
                          transform: isActivePair ? 'scale(1.5)' : 'scale(1)',
                          transition: '',
                          WebkitTextStroke: isActivePair ? `${shadowStrength}px rgba(255,255,255,0.2)` : 'none', // Scale stroke with shadowStrength
                        }}
                      >
                        {pair}
                      </span>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </>
    );
  };

  export const GreenToRedPair = ({ style, subtitles = [], groupColor = 'white' }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    
    // Extract outline and shadow properties
    const outlineWidth = style.textOutlineWidth || '2px';
    const outlineColor = style.textOutlineColor || 'black';
    const textShadow = style.textShadow || '2px 4px 4px rgba(0,0,0,0.7)';

    // Add text-shadow based outline function with text shadow
    const getTextOutline = (color = 'black') => {
      return `
        -${outlineWidth}px -${outlineWidth}px 0 ${color},
        ${outlineWidth}px -${outlineWidth}px 0 ${color},
        -${outlineWidth}px ${outlineWidth}px 0 ${color},
        ${outlineWidth}px ${outlineWidth}px 0 ${color},
        ${textShadow}
      `;
    };

    // Separate function for inactive state
    const getInactiveTextShadow = (color = 'black') => {
      return `
        -${outlineWidth}px -${outlineWidth}px 0 ${color},
        ${outlineWidth}px -${outlineWidth}px 0 ${color},
        -${outlineWidth}px ${outlineWidth}px 0 ${color},
        ${outlineWidth}px ${outlineWidth}px 0 ${color},
        ${textShadow}
      `;
    };

    // Get the start time of the first subtitle for continuous animation
    const firstSubtitleStart = subtitles[0]?.start || 0;
    const firstStartFrame = firstSubtitleStart * fps;
  
    // Add CSS keyframes animation style
    let shakeKeyframes = '';
    if (style.animation2 === 'Shake') {
    shakeKeyframes = `
      @keyframes shake2 {
        0% { transform: translate(0, 0); }
        20% { transform: translate(20px, 0); }
        40% { transform: translate(20px, 20px); }
        60% { transform: translate(-20px, 0); }
        80% { transform: translate(-20px, -20px); }
        100% { transform: translate(0, 0); }
      }
    `;
    }
  
    // Use style.alternateColors if available, otherwise use defaults
    const defaultColors = {
      first: '#11FF21',
      second: '#f4310b'
    };
    // Get colors from style or use defaults
    const firstColor = style.alternateColors?.[0] || defaultColors.first;
    const secondColor = style.alternateColors?.[1] || defaultColors.second;
  
    // Get shadow colors from style or default to text colors
    const firstShadowColor = style.alternateColors?.[0] || firstColor;
    const secondShadowColor = style.alternateColors?.[1] || secondColor;
  
    const getGlowStyle = (isFirstColor) => {
      const intensity  = style.shadowStrength || 6.5;
      
      const shadowColor = isFirstColor ? firstShadowColor : secondShadowColor;
      
      // Convert color to rgba with much lower opacity values
      const toRGBA = (color, opacity) => {
        if (color.startsWith('rgb')) {
          return color.replace('rgb', 'rgba').replace(')', `, ${opacity})`);
        }
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
      };
  
      return `
        0 0 ${5 * intensity * 3}px ${toRGBA(shadowColor, 0.2 * intensity )},
        0 0 ${10 * intensity * 3}px ${toRGBA(shadowColor, 0.2 * intensity )},
        0 0 ${15 * intensity * 3}px ${toRGBA(shadowColor, 0.2 * intensity )},
        0 0 ${20 * intensity * 3}px ${toRGBA(shadowColor, 0.2 * intensity )}
      `;
    };
  
    return (
      <>
        <style>{shakeKeyframes}</style>
        <div className={`p-4 flex flex-col`} 
             style={{
               ...style,
               animation: frame >= firstStartFrame ? 'shake2 5.2s ease-in-out infinite' : 'none'
             }}>
          {subtitles.map((subtitle, index) => {
            const wordPairs = subtitle.text.match(/(\S+\s+\S+|\S+)\s*/g) || [];
            const subtitleDuration = subtitle.end - subtitle.start;
            const pairsPerSecond = wordPairs.length / subtitleDuration;
            const startFrame = subtitle.start * fps;
  
            return (
              <div key={index} className="flex flex-col" style={{ margin: '5px 0' }}>
                {wordPairs.map((pair, pairIndex) => {
                  const pairStartFrame = startFrame + (pairIndex / pairsPerSecond) * fps;
                  const pairEndFrame = startFrame + ((pairIndex + 1) / pairsPerSecond) * fps;
                  const isVisible = frame >= pairStartFrame && frame < pairEndFrame;
                  const isFirstColor = pairIndex % 2 === 0;
                  
                  return (
                    <span
                      key={pairIndex}
                      className="flex flex-col"
                      style={{
                        color: isVisible ? (isFirstColor ? firstColor : secondColor) : 'white',
                        display: 'inline-block',
                        margin: '4px 8px',
                        padding: '25px',
                        fontFamily: style.fontFamily,
                        transform: isVisible ? 'scale(1.3)' : 'scale(1)',
                        textShadow: isVisible 
                          ? `${getTextOutline(outlineColor)}, ${getGlowStyle(isFirstColor)}` 
                          : getInactiveTextShadow(outlineColor),
                        fontWeight: 1000,
                        WebkitFontSmoothing: 'antialiased',
                        MozOsxFontSmoothing: 'grayscale',
                      }}
                    >
                      {pair}
                    </span>
                  );
                })}
              </div>
            );
          })}
        </div>
      </>
    );
  };

  
  
  export const Girlboss = ({ style, subtitles = [], groupColor = 'white' }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    const styles = extractStyles(style);
    
    // Get shadow color and strength from style
    const shadowColor = style.color || style.textColor;
    const shadowStrength = style.shadowStrength || 1;

    // Updated getGlowStyle function with more transparency
    const getGlowStyle = (isVisible) => {
      if (!isVisible) return 'none';
      
      // Convert color to rgba with lower opacity values
      const toRGBA = (color, opacity) => {
        if (color.startsWith('rgb')) {
          return color.replace('rgb', 'rgba').replace(')', `, ${opacity})`);
        }
        // Convert hex to rgba
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
      };

      return `
        0 0 ${10 * shadowStrength}px ${toRGBA(shadowColor, 0.4)},
        0 0 ${20 * shadowStrength}px ${toRGBA(shadowColor, 0.3)},
        0 0 ${30 * shadowStrength}px ${toRGBA(shadowColor, 0.2)},
        0 0 ${40 * shadowStrength}px ${toRGBA(shadowColor, 0.1)}
      `;
    };

    return (
      <div className={`p-4 flex flex-col`} style={style}>
        {subtitles.map((subtitle, index) => {
          const words = subtitle.text.split(' ');
          const subtitleDuration = subtitle.end - subtitle.start;
          const wordsPerSecond = words.length / subtitleDuration;
          const startFrame = subtitle.start * fps;

          return (
            <p key={index} className="" style={{ margin: '5px 0' }}>
              {words.map((word, wordIndex) => {
                const wordStartFrame =
                  startFrame + (wordIndex / wordsPerSecond) * fps;
                const wordEndFrame =
                  startFrame + ((wordIndex + 1) / wordsPerSecond) * fps;
                const isVisible = frame >= wordStartFrame;

                return (
                  <span
                    key={wordIndex}
                    className=""
                    style={{
                      color: isVisible ? style.textColor : 'white',
                      backgroundColor: styles.backgroundColor,
                      WebkitTextStroke: `${styles.outlineWidth} ${styles.outlineColor}`,
                      display: 'inline-block',
                      margin: '0 12px',
                      transition: 'transform 0.3s',
                      textShadow: getGlowStyle(isVisible),
                      filter: isVisible ? `blur(${2 * shadowStrength}px)` : 'none',
                    }}
                  >
                    {word}
                  </span>
                );
              })}
            </p>
          );
        })}
      </div>
    );
  };
    
  export const Quickfox = ({ style, subtitles = [], groupColor = 'white' }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    const styles = extractStyles(style);

    return (
      <div className={`p-4 flex flex-col`} style={style}>
        {subtitles.map((subtitle, index) => {
          const words = subtitle.text.split(' ');
          const subtitleDuration = subtitle.end - subtitle.start;
          const wordsPerSecond = words.length / subtitleDuration;
          const startFrame = subtitle.start * fps;
  
          return (
            <p key={index} className="" style={{ margin: '5px 0' }}>
              {words.map((word, wordIndex) => {
                const wordStartFrame =
                  startFrame + (wordIndex / wordsPerSecond) * fps;
                const wordEndFrame =
                  startFrame + ((wordIndex + 1) / wordsPerSecond) * fps;
                const isVisible = frame >= wordStartFrame && frame < wordEndFrame;
  
                return (
                  <span
                    key={wordIndex}
                    className=""
                    style={{
                      color: isVisible ? style.textColor : 'white',
                      WebkitTextStroke: `${style.textOutlineWidth}px ${style.textOutlineColor}`,
                      display: 'inline-block',
                      margin: '0 4px',
                      transition: 'transform 0.3s',
                      textShadow: 'none'
                    }}
                  >
                    {word}
                  </span>
                );
              })}
            </p>
          );
        })}
      </div>
    );
  };
  
  
  
  export const Quickfox4 = ({ style, subtitles = [], groupColor = 'white' }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
  
    return (
      <div className={`p-4 flex flex-col`} style={style}>
        {subtitles.map((subtitle, index) => {
          const words = subtitle.text.split(' ');
          const subtitleDuration = subtitle.end - subtitle.start;
          const wordsPerSecond = words.length / subtitleDuration;
          const startFrame = subtitle.start * fps;
          const styles = extractStyles(style);

          return (
            <p key={index} className="" style={{ margin: '5px 0' }}>
              {words.map((word, wordIndex) => {
                const wordStartFrame =
                  startFrame + (wordIndex / wordsPerSecond) * fps;
                const wordEndFrame =
                  startFrame + ((wordIndex + 1) / wordsPerSecond) * fps;
                const isVisible = frame >= wordStartFrame && frame < wordEndFrame;
                // console.log("wordsdsdadasdasdsa", isVisible);
  
                return (
                  <span
                    key={wordIndex}
                    className=""
                    style={{
                      // Use COLORS array to color each word
                      display: 'inline-block',
                      margin: '0 4px',
                      // color: isVisible ? 'yellow' : 'white',
                      // color: isVisible ? 'white' : COLORS[wordIndex % COLORS.length],
                      // color: isVisible ?   COLORS[wordIndex % COLORS.length] : 'white',
                      display: isVisible ? 'flex' : 'none',
                      color:   style.textColor ,
                      transition: 'opacity 0.3s, transform 0.3s',
                    }}
                  >
                    {word}
                  </span>
                );
              })}
            </p>
          );
        })}
      </div>
    );
  };
 
  export const quickfox5 = ({ style, subtitles = [], groupColor = 'white' }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    const styles = extractStyles(style);

    return (
      <div className={`p-4 flex flex-col`} style={style}>
        {subtitles.map((subtitle, index) => {
          const words = subtitle.text.split(' ');
          const subtitleDuration = subtitle.end - subtitle.start;
          const wordsPerSecond = words.length / subtitleDuration;
          const startFrame = subtitle.start * fps;
  
          return (
            <p key={index} className="" style={{ margin: '5px 0' }}>
              {words.map((word, wordIndex) => {
                const wordStartFrame =
                  startFrame + (wordIndex / wordsPerSecond) * fps;
                const wordEndFrame =
                  startFrame + ((wordIndex + 1) / wordsPerSecond) * fps;
                const isVisible = frame >= wordStartFrame && frame < wordEndFrame;
                // console.log("wordsdsdadasdasdsa", isVisible);
  
                return (
                  <span
                    key={wordIndex}
                    className=""
                    style={{
                      // Use COLORS array to color each word
                      display: 'inline-block',
                      margin: '0 4px',
                      // color: isVisible ? 'yellow' : 'white',
                      // color: isVisible ? 'white' : COLORS[wordIndex % COLORS.length],
                      // color: isVisible ?   COLORS[wordIndex % COLORS.length] : 'white',
                      display: isVisible ? 'flex' : 'none',
                      color:   style.textColor ,
                      transition: 'opacity 0.3s, transform 0.3s',
                    }}
                  >
                    {word}
                  </span>
                );
              })}
            </p>
          );
        })}
      </div>
    );
  };
  export const Quickfox3 = ({ style, subtitles = [], groupColor = 'white' }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    const styles = extractStyles(style);
    return (
      <div className={`p-4 flex flex-col`} style={style}>
        {subtitles.map((subtitle, index) => {
          const words = subtitle.text.split(' ');
          const subtitleDuration = subtitle.end - subtitle.start;
          const wordsPerSecond = words.length / subtitleDuration;
          const startFrame = subtitle.start * fps;
  
          return (
            <p key={index} className="" style={{ margin: '5px 0' }}>
              {words.map((word, wordIndex) => {
                const wordStartFrame =
                  startFrame + (wordIndex / wordsPerSecond) * fps;
                const wordEndFrame =
                  startFrame + ((wordIndex + 1) / wordsPerSecond) * fps;
                const isVisible = frame >= wordStartFrame && frame < wordEndFrame;
  
                return (
                  <span
                    key={wordIndex}
                    className=""
                    style={{
                      color: isVisible ? styles.textColor : 'white',
                      backgroundColor: isVisible ? styles.textColor : 'transparent',
                      display: 'inline-block',
                      margin: '0 4px',
                      padding: '25px',
                      margin: '5px',
                      transition: 'transform 0.3s',
                    }}
                  >
                    {word}
                  </span>
                );
              })}
            </p>
          );
        })}
      </div>
    );
  };

  
  export const HormoziViralWord = ({ style, subtitles = [], groupColor = 'white' }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    const styles = extractStyles(style);
    const outlineWidth = style?.textOutlineWidth || '2px';
    const outlineColor = style?.textOutlineColor;
    // Use style.alternateColors if provided, otherwise fallback to COLORS2
    const colors = style?.alternateColors || COLORS2;
    // Get shadow colors from style or default to text colors
    const shadowColors = style?.alternateColors || colors;
    // Get shadow strength from style or default to 1
    const shadowStrength = style?.shadowStrength || 1;

    // Enhanced glow effect with transparency and shadow strength
    const getEnhancedGlow = (colorIndex) => {
      const color = colors[colorIndex % colors.length];
      const shadowColor = shadowColors[colorIndex % shadowColors.length];
      
      // Convert color to rgba with transparency
      const toRGBA = (color, alpha) => {
        if (color.startsWith('rgb')) {
          return color.replace('rgb', 'rgba').replace(')', `, ${alpha})`);
        }
        // Convert hex to rgba
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
      };

      return `
        0 0 ${10 * shadowStrength}px ${toRGBA(shadowColor, 0.8)},
        0 0 ${20 * shadowStrength}px ${toRGBA(shadowColor, 0.6)},
        0 0 ${30 * shadowStrength}px ${toRGBA(shadowColor, 0.4)},
        0 0 ${40 * shadowStrength}px ${toRGBA(shadowColor, 0.2)}
      `;
    };

    return (
      <div className={`p-4 flex flex-col`} style={style}>
        {subtitles.map((subtitle, index) => {
          const words = subtitle.text.split(' ');
          const subtitleDuration = subtitle.end - subtitle.start;
          const wordsPerSecond = words.length / subtitleDuration;
          const startFrame = subtitle.start * fps;

          return (
            <p key={index} className="" style={{ margin: '5px 0' }}>
              {words.map((word, wordIndex) => {
                const wordStartFrame = startFrame + (wordIndex / wordsPerSecond) * fps;
                const wordEndFrame = startFrame + ((wordIndex + 1) / wordsPerSecond) * fps;
                const isVisible = frame >= wordStartFrame && frame < wordEndFrame;
                const currentColor = colors[wordIndex % colors.length];

                return (
                  <span
                    key={wordIndex}
                    className=""
                    style={{
                      display: isVisible ? 'flex' : 'none',
                      fontFamily: 'Montserrat',
                      fontWeight: 1000,      WebkitTextStroke: `${outlineWidth}px ${outlineColor}`,

                      transition: 'opacity 0.3s, transform 0.3s',
                      textShadow: isVisible ? getEnhancedGlow(wordIndex) : 'none',
                       margin: '0 4px',
                      transform: isVisible ? 'scale(1.2)' : 'scale(1)',
                    }}
                  >
                    {word}
                  </span>
                );
              })}
            </p>
          );
        })}
      </div>
    );
  };


  export const Wavycolors = ({ style, subtitles = [], groupColor = 'white' }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    
    // Use style.alternateColors if provided, otherwise fallback to WAVY_COLORS
    const colors = style?.alternateColors || WAVY_COLORS;

    const getGlowStyle = (color) => {
      const intensity = style?.shadowStrength || 1;
      return `
        0 0 ${15 * intensity}px ${color}, 
        0 0 ${30 * intensity}px ${color}, 
        0 0 ${45 * intensity}px ${color}, 
        0 0 ${60 * intensity}px ${color}
      `;
    };

    return (
      <div className={`p-4 flex flex-col letter-spacing-6 test-font`} style={style}>
        {subtitles.map((subtitle, index) => {
          const words = subtitle.text.split(' ');
          const subtitleDuration = subtitle.end - subtitle.start;
          const wordsPerSecond = words.length / subtitleDuration;
          const startFrame = subtitle.start * fps;
          return (
            <p key={index} className="" style={{ margin: '5px 0' }}>
              {words.map((word, wordIndex) => {
                const wordStartFrame = startFrame + (wordIndex / wordsPerSecond) * fps;
                const wordEndFrame = startFrame + ((wordIndex + 1) / wordsPerSecond) * fps;
                const wordDuration = wordEndFrame - wordStartFrame;
                const isVisible = frame >= wordStartFrame && frame < wordEndFrame;
                const progress = Math.min(1, (frame - wordStartFrame) / 3);
                const stretchFactor = isVisible ? 1 + 0.5 * (1 - progress) : 1.5;
                const blurAmount = Math.max(0, (stretchFactor - 1) * 10);
                const numSets = Math.ceil(word.length / 3);
                const coloredSetIndex = isVisible
                  ? Math.floor(((frame - wordStartFrame) / wordDuration) * numSets)
                  : 0;
                const colorIndex = (wordIndex + coloredSetIndex) % colors.length;
                const color = colors[colorIndex];

                return (
                  <span
                    key={wordIndex}
                    style={{
                      display: isVisible ? 'inline-block' : 'none',
                      margin: '0 4px',
                      transform: `scaleY(${stretchFactor})`,
                      transition: 'transform 0.1s',
                      padding: '0 5px',
                      letterSpacing: '1px',
                      filter: `blur(${blurAmount}px)`,
                    }}
                  >
                    {[...Array(numSets)].map((_, setIndex) => {
                      const isColored = setIndex === coloredSetIndex;
                      const chars = word.slice(setIndex * 3, (setIndex + 1) * 3);
                      const setColorIndex = (wordIndex + setIndex) % colors.length;
                      const setColor = colors[setColorIndex];
                      
                      return (
                        <span
                          key={setIndex}
                          style={{
                            color: isColored ? setColor : 'white',
                            textShadow: isVisible && isColored
                              ? `2px 4px 4px rgba(0,0,0,0.7), -2px 4px 4px rgba(0,0,0,0.7), ${getGlowStyle(setColor)}`
                              : '2px 4px 4px rgba(0,0,0,0.7), -2px 4px 4px rgba(0,0,0,0.7)',
                          }}
                        >
                          {chars}
                        </span>
                      );
                    })}
                  </span>
                );
              })}
            </p>
          );
        })}
      </div>
    );
  };
  export const alternatingBoldThinAnimation = ({ style, subtitles = [] }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    
    // Get text color and shadow intensity from style
    const textColor =  style.color || '#ffffff';
    const shadowIntensity = style.glowIntensity || 1;
    const outlineWidth = style.textOutlineWidth || '0px';  // Add outline width
    const outlineColor = style.textOutlineColor || '#F8E71C'; // Add outline color
    
    // Create shadow using text color
    const shadow = `
      0 0 ${51 * shadowIntensity}px ${textColor},
      0 0 ${10 * shadowIntensity}px ${textColor}
    `;

    const thinFont = {
      fontFamily: 'Montserrat Thin',
      fontWeight: 200,
    };
    
    const boldFont = {
      fontFamily: 'Montserrat',
      fontWeight: 800,
    };

    return (
      <div className={`p-4 flex flex-col`} style={style}>
        {subtitles.map((subtitle, index) => {
          const words = subtitle.text.split(' ');
          const subtitleDuration = subtitle.end - subtitle.start;
          const wordsPerSecond = words.length / subtitleDuration;
          const startFrame = subtitle.start * fps;
          return (
            <p key={index} className="" style={{ margin: '5px 0' }}>
              {words.map((word, wordIndex) => {
                const wordStartFrame = startFrame + (wordIndex / wordsPerSecond) * fps;
                const charsPerFrame = fps / (wordsPerSecond * word.length);
                const isInBoldPair = Math.floor(wordIndex / 2) % 2 === 1;
                const fontStyle = isInBoldPair ? boldFont : thinFont;
                return (
                  <span key={wordIndex} style={{ margin: '0 4px' }}>
                    {[...word].map((char, charIndex) => {
                      const charStartFrame = wordStartFrame + (charIndex * charsPerFrame);
                      const isVisible = frame >= charStartFrame;
                      return (
                        <span
                          key={charIndex}
                          style={{
                            ...fontStyle,
                            display: 'inline-block',
                            opacity: isVisible ? 1 : 0,
                            color: textColor,
                            textShadow: shadow,
                            WebkitTextStroke: `${outlineWidth} ${outlineColor}`, // Add outline
                            transition: 'opacity 0.2s',
                          }}
                        >
                          {char}
                        </span>
                      );
                    })}
                    {wordIndex < words.length - 1 && ' '}
                  </span>
                );
              })}
            </p>
          );
        })}
      </div>
    );
  };

export const PewDiePie = ({ style, subtitles = [] }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const styles = extractStyles(style);

  // Pop animation parameters
  const popDuration = 10; // frames for pop animation
  const maxScale = 1.2; // maximum scale during pop
  
  return (
    <div className={`p-4 flex flex-col`} style={style}>
      {subtitles.map((subtitle, index) => {
        const words = subtitle.text.split(' ');
        const subtitleDuration = subtitle.end - subtitle.start;
        const wordsPerSecond = words.length / subtitleDuration;
        const startFrame = subtitle.start * fps;

        return (
          <p key={index} className="" style={{ margin: '5px 0' }}>
            {words.map((word, wordIndex) => {
              const wordStartFrame = startFrame + (wordIndex / wordsPerSecond) * fps;
              const isVisible = frame >= wordStartFrame;
              const framesSinceStart = frame - wordStartFrame;
              
              // Calculate pop scale
              let scale = 1;
              if (isVisible && framesSinceStart < popDuration) {
                const progress = framesSinceStart / popDuration;
                if (progress < 0.5) {
                  // Scale up
                  scale = 1 + (maxScale - 1) * (progress * 2);
                } else {
                  // Scale down
                  scale = maxScale - (maxScale - 1) * ((progress - 0.5) * 2);
                }
              }

              return (
                <span
                  key={wordIndex}
                  className=""
                  style={{
                    display: 'inline-block',
                    margin: '0 4px',
                    opacity: isVisible ? 1 : 0,
                    transform: `scale(${scale})`,
                    color: style.textColor || 'white',
                    WebkitTextStroke: `${styles.outlineWidth} ${styles.outlineColor}`,
                    transition: 'opacity 0.05s',
                    fontFamily: style.fontFamily || 'Montserrat',
                    fontWeight: style.fontWeight || 800,
                  }}
                >
                  {word}
                </span>
              );
            })}
          </p>
        );
      })}
    </div>
  );
};

  export const Default = ({ style, subtitles = [] }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    return (
      <div className={`p-4 flex  justify-center`} style={style}>
        {subtitles.map((subtitle, index) => {
          const startFrame = subtitle.start * fps;
          const isVisible = frame >= startFrame;

          return (
            <p 
              key={index} 
              style={{
                margin: '5px 0',
                opacity: isVisible ? 1 : 0,
              }}
            >
              {subtitle.text}
            </p>
          );
        })}
      </div>
    );
  };

export const TrendingAli = ({ style, subtitles = [] }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  // Extract style properties
  const outlineWidth = style?.textOutlineWidth || '5px';
  const outlineColor = style?.textOutlineColor || '#000000';
  const glowIntensity = style?.glowIntensity || 1;
  
  // Enhanced glow effect with white color
  const getGlowEffect = (isActive) => {
    const intensity = glowIntensity * 0.8; // Slightly reduce intensity for softer effect
    return `
      0 0 ${5 * intensity}px rgba(255, 255, 255, 0.8),
      0 0 ${10 * intensity}px rgba(255, 255, 255, 0.6),
      0 0 ${15 * intensity}px rgba(255, 255, 255, 0.4),
      0 0 ${20 * intensity}px rgba(255, 255, 255, 0.2)
    `;
  };

  return (
    <div className={`p-4 flex flex-col items-center`} style={style}>
      {subtitles.map((subtitle, index) => {
        const words = subtitle.text.split(' ');
        const subtitleDuration = subtitle.end - subtitle.start;
        const wordsPerSecond = words.length / subtitleDuration;
        const startFrame = subtitle.start * fps;

        return (
          <p key={index} className="text-center" style={{ margin: '5px 0' }}>
            {words.map((word, wordIndex) => {
              const wordStartFrame = startFrame + (wordIndex / wordsPerSecond) * fps;
              const isVisible = frame >= wordStartFrame;
              
              return (
                <span
                  key={wordIndex}
                  style={{
                    display: 'inline-block',
                    margin: '0 4px',
                    opacity: isVisible ? 1 : 0.5,
                    color: style.color || '#000000',
                    WebkitTextStroke: `${outlineWidth} ${outlineColor}`,
                    transition: 'opacity 0.2s',
                    backgroundColor: style.backgroundColor || 'transparent',
                    fontFamily: style.fontFamily || 'Montserrat',
                    fontWeight: 800,
                    letterSpacing: style.letterSpacing || '0em',
                  }}
                >
                  {word} 
                </span>
              );
            })}
          </p>
        );
      })}
    </div>
  );
};

export const ShrinkingPairs = ({ style, subtitles = [] }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  // Extract style properties
  const outlineWidth = style?.textOutlineWidth;
  const outlineColor = style?.textOutlineColor || '#000000';
  const shadowStrength = style?.shadowStrength || 0;
  const blurStrength = style?.blurStrength || 1; // New blur strength property
  
  // Default color sets if not provided in style
  const defaultColorSets = [
    ['#0BF431', '#2121FF'],  // Green & Blue
    ['#1DE0FE', '#FFFF00']   // Cyan & Yellow
  ];
  
  const colorSets = style?.alternateColors ? [
    [style.alternateColors[0], style.alternateColors[1]],
    [style.alternateColors[2] || style.alternateColors[0], style.alternateColors[3] || style.alternateColors[1]]
  ] : defaultColorSets;

  // Enhanced glow effect with shadow strength and blur
  const getGlowEffect = (color, isActive, blurAmount) => {
    if (!isActive) return 'none';
    
    // Helper function to convert color to rgba with custom opacity
    const toRGBA = (color, opacity) => {
      if (color.startsWith('rgb')) {
        return color.replace('rgb', 'rgba').replace(')', `, ${opacity})`);
      }
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    };

    return `
      0 0 ${15 * shadowStrength}px ${toRGBA(color, 0.4)},
      0 0 ${30 * shadowStrength}px ${toRGBA(color, 0.3)},
      0 0 ${45 * shadowStrength}px ${toRGBA(color, 0.2)},
      0 0 ${60 * shadowStrength}px ${toRGBA(color, 0.1)}
    `;
  };

  return (
    <div className={`p-4 flex flex-col`} style={style}>
      {subtitles.map((subtitle, index) => {
        const words = subtitle.text.split(' ');
        const wordPairs = [];
        
        // Group words into pairs
        for (let i = 0; i < words.length; i += 2) {
          const pair = words[i] + (words[i + 1] ? ' ' + words[i + 1] : '');
          if (pair) {
            wordPairs.push(pair);
          }
        }

        const subtitleDuration = subtitle.end - subtitle.start;
        const pairsPerSecond = wordPairs.length / subtitleDuration;
        const startFrame = subtitle.start * fps;
        const shrinkDuration = 15; // frames for shrinking animation

        return (
          <div key={index} className="flex flex-col items-center" style={{ margin: '5px 0' }}>
            {wordPairs.map((pair, pairIndex) => {
              const pairStartFrame = startFrame + (pairIndex / pairsPerSecond) * fps;
              const pairEndFrame = startFrame + ((pairIndex + 1) / pairsPerSecond) * fps;
              const isVisible = frame >= pairStartFrame;
              const framesSinceStart = frame - pairStartFrame;
              
              // Calculate scale and blur based on frames since start
              let scale = 1;
              let blur = 0;
              if (isVisible && framesSinceStart < shrinkDuration) {
                const progress = framesSinceStart / shrinkDuration;
                scale = 1.2 - (0.2 * progress);
                // Blur is strongest at start and decreases as the text shrinks
                blur = ((1 - progress) * 4 * blurStrength); // Multiply by blurStrength
              }

              const colorSetIndex = Math.floor(pairIndex / 2) % colorSets.length;
              const isYellow = frame >= pairStartFrame && frame < pairEndFrame;
              const currentColor = isYellow ? style.color || '#FFFF00' : '#FFFFFF';
              
              // Increased margins for second pair in group
              const isSecondInGroup = pairIndex % 2 === 1;
              const pairMargin = isSecondInGroup ? '35px 0 45px' : '4px 0';

              return (
                <div
                  key={pairIndex}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'center',
                    margin: pairMargin, // Increased margins
                    opacity: isVisible ? 1 : 0,
                    transform: `scale(${scale})`,
                    filter: `blur(${blur}px)`,
                    color: currentColor,
                    WebkitTextStroke: `${outlineWidth} ${outlineColor}`,
                    transition: 'transform 0.1s',
                    textShadow: getGlowEffect(currentColor, isVisible, blur),
                    fontFamily: style.fontFamily || 'Montserrat',
                    fontWeight: 800,
                  }}
                >
                  {pair}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

export const RevealEnlarge = ({ style, subtitles = [] }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  const defaultColors = ['#0BF431', '#2121FF', '#1DE0FE', '#FFFF00'];
  const colors = style?.alternateColors || defaultColors;
  const outlineWidth = style?.textOutlineWidth || 2;
  const outlineColor = style?.textOutlineColor || 'black';
  const shadowStrength = style?.shadowStrength || 1;

  // Enhanced glow effect with shadow strength
  const getGlowEffect = (colorIndex, isActive) => {
    if (!isActive) return '';
    
    const color = colors[colorIndex % colors.length];
    const intensity = shadowStrength * 0.8; // Adjust intensity
    
    // Convert color to rgba with different opacity levels
    const getRGBA = (color, opacity) => {
      if (color.startsWith('rgb')) {
        return color.replace('rgb', 'rgba').replace(')', `, ${opacity})`);
      }
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    };

    const width = outlineWidth * 2;
    return `
      -${width}px -${width}px 0 ${outlineColor},
      ${width}px -${width}px 0 ${outlineColor},
      -${width}px ${width}px 0 ${outlineColor},
      ${width}px ${width}px 0 ${outlineColor},
      0 0 ${5 * intensity}px ${getRGBA(color, 0.8)},
      0 0 ${10 * intensity}px ${getRGBA(color, 0.6)},
      0 0 ${20 * intensity}px ${getRGBA(color, 0.4)},
      0 0 ${30 * intensity}px ${getRGBA(color, 0.2)}
    `;
  };

  // Add shake animation if enabled
  let shakeKeyframes = '';
  if (style?.animation2 === 'Shake') {
    shakeKeyframes = `
      @keyframes shake2 {
        0% { transform: translate(0, 0) scale(1); }
        20% { transform: translate(20px, 0) scale(1); }
        40% { transform: translate(20px, 20px) scale(1); }
        60% { transform: translate(-20px, 0) scale(1); }
        80% { transform: translate(-20px, -20px) scale(1); }
        100% { transform: translate(0, 0) scale(1); }
      }
    `;
  }

  return (
    <>
      <style>{shakeKeyframes}</style>
      <div className={`p-4 flex flex-col`} style={style}>
        {subtitles.map((subtitle, index) => {
          const words = subtitle.text.split(' ');
          const subtitleDuration = subtitle.end - subtitle.start;
          const wordsPerSecond = words.length / subtitleDuration;
          const startFrame = subtitle.start * fps;

          return (
            <p key={index} className="" style={{ margin: '5px 0' }}>
              {words.map((word, wordIndex) => {
                const wordStartFrame = startFrame + (wordIndex / wordsPerSecond) * fps;
                const wordEndFrame = startFrame + ((wordIndex + 1) / wordsPerSecond) * fps;
                const isActive = frame >= wordStartFrame && frame < wordEndFrame;
                const colorIndex = wordIndex % colors.length;
                
                const framesSinceStart = frame - wordStartFrame;
                const scaleDuration = 5;
                let scale = 1;
                if (isActive && framesSinceStart < scaleDuration) {
                  scale = 1 + (0.2 * (framesSinceStart / scaleDuration));
                }

                return (
                  <span
                    key={wordIndex}
                    style={{
                      display: 'inline-block',
                      margin: '0 4px',
                      color: isActive ? colors[colorIndex] : 'white',
                      transform: `scale(${scale})`,
                      animation: style?.animation2 === 'Shake' ? 'shake2 5.2s ease-in-out infinite' : 'none',
                      textShadow: getGlowEffect(colorIndex, isActive),
                      fontFamily: style?.fontFamily || 'Montserrat',
                      fontWeight: 800,
                    }}
                  >
                    {word}
                  </span>
                );
              })}
            </p>
          );
        })}
      </div>
    </>
  );
};

 