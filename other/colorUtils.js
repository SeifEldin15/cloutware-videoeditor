export const convertColorToASS = (color) => {
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
  