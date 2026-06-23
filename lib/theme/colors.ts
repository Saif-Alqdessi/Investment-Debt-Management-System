export function hexToHSL(hex: string) {
  let r = 0, g = 0, b = 0;
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else if (hex.length === 7) {
    r = parseInt(hex.substring(1, 3), 16);
    g = parseInt(hex.substring(3, 5), 16);
    b = parseInt(hex.substring(5, 7), 16);
  }
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

export function generateBrandPalette(hex: string) {
  const { h, s, l: baseL } = hexToHSL(hex);

  // Create a spread of lightness values mimicking a typical tailwind curve
  // We'll anchor the base color to 600, which is commonly used for primary buttons.
  const palette: Record<string, string> = {
    50: `${h} ${s}% 97%`,
    100: `${h} ${s}% 94%`,
    200: `${h} ${s}% 86%`,
    300: `${h} ${s}% 77%`,
    400: `${h} ${s}% 66%`,
    500: `${h} ${s}% 50%`,
    600: `${h} ${s}% ${baseL}%`, // Exact brand color
    700: `${h} ${s}% ${Math.max(baseL - 10, 10)}%`,
    800: `${h} ${s}% ${Math.max(baseL - 16, 8)}%`,
    900: `${h} ${s}% ${Math.max(baseL - 21, 5)}%`,
    950: `${h} ${s}% ${Math.max(baseL - 26, 2)}%`,
  };
  return palette;
}
