/**
 * Color utility functions for subtitle processing
 * Handles color format conversions and validations
 */

/**
 * Converts various color formats to ASS (Advanced SubStation Alpha) format
 * Supports HEX (#RRGGBB) and RGBA (rgba(r, g, b, a)) formats
 * 
 * @param color - Color string in HEX or RGBA format
 * @returns ASS-formatted color string (&HBBGGRR& or &HAABBGGRR&)
 * @throws Error if color format is invalid
 * 
 * @example
 * convertColorToASS('#FF0000') // Returns '&H0000FF&' (red)
 * convertColorToASS('rgba(255, 0, 0, 0.5)') // Returns '&H800000FF&' (semi-transparent red)
 */
export const convertColorToASS = (color: string): string => {
  if (!color || typeof color !== 'string') {
    throw new Error('Color must be a non-empty string');
  }

  const trimmedColor = color.trim();

  if (trimmedColor.startsWith('#')) {
    let hex = trimmedColor.replace('#', '');

    if (hex.length !== 6) {
      throw new Error('Invalid HEX color format. Expected #RRGGBB.');
    }

    // Validate hex characters
    if (!/^[0-9A-Fa-f]{6}$/.test(hex)) {
      throw new Error('Invalid HEX color format. Only hexadecimal characters (0-9, A-F) are allowed.');
    }

    const RR = hex.slice(0, 2).toUpperCase();
    const GG = hex.slice(2, 4).toUpperCase();
    const BB = hex.slice(4, 6).toUpperCase();

    // &HBBGGRR (no alpha) - BGR format for ASS
    return `&H00${BB}${GG}${RR}&`;
  } else if (trimmedColor.startsWith('rgba') || trimmedColor.startsWith('rgb')) {
    const rgbaMatch = trimmedColor.match(
      /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*(\d*\.?\d+))?\s*\)$/
    );

    if (!rgbaMatch) {
      throw new Error('Invalid RGBA color format. Expected rgba(r, g, b, a) or rgb(r, g, b).');
    }

    const r = parseInt(rgbaMatch[1], 10);
    const g = parseInt(rgbaMatch[2], 10);
    const b = parseInt(rgbaMatch[3], 10);
    let a = 1;

    // Validate RGB values
    if (r < 0 || r > 255 || g < 0 || g > 255 || b < 0 || b > 255) {
      throw new Error('Invalid RGB values. Each component must be between 0 and 255.');
    }

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

    // &HAABBGGRR - ABGR format for ASS
    return `&H${AA}${BB}${GG}${RR}&`;
  } else {
    throw new Error(
      'Unsupported color format. Please use HEX (#RRGGBB) or RGBA (rgba(r, g, b, a)) formats.'
    );
  }
}; 