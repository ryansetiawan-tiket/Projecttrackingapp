/**
 * Calculate the relative luminance of a color
 * @param hex - Hex color code (e.g., '#ff6b6b')
 * @returns Luminance value between 0 and 1
 */
function getLuminance(hex: string): number {
  // Remove # if present
  const cleanHex = hex.replace('#', '');
  
  // Parse RGB values
  const r = parseInt(cleanHex.substr(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substr(2, 2), 16) / 255;
  const b = parseInt(cleanHex.substr(4, 2), 16) / 255;
  
  // Apply gamma correction
  const gammaCorrect = (val: number) => {
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  };
  
  const rLinear = gammaCorrect(r);
  const gLinear = gammaCorrect(g);
  const bLinear = gammaCorrect(b);
  
  // Calculate relative luminance
  return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
}

/**
 * Get contrasting text color (black or white) based on background color
 * Uses WCAG 2.0 guidelines for contrast ratio
 * @param bgColor - Background color in hex format (e.g., '#ff6b6b')
 * @returns '#ffffff' for dark backgrounds, '#000000' for light backgrounds
 */
export function getContrastColor(bgColor: string): string {
  if (!bgColor || bgColor === 'transparent') {
    return '#000000';
  }
  
  try {
    const luminance = getLuminance(bgColor);
    
    // WCAG recommends 0.5 as threshold for contrast
    // For better readability, we use 0.5 as the threshold
    // Lighter colors (luminance > 0.5) get dark text
    // Darker colors (luminance <= 0.5) get light text
    return luminance > 0.5 ? '#000000' : '#ffffff';
  } catch (error) {
    console.error('Error calculating contrast color:', error);
    return '#000000';
  }
}

/**
 * Alternative implementation that's more conservative
 * Returns white text for medium-dark colors, black for light colors
 */
export function getTextColor(bgColor: string): string {
  if (!bgColor || bgColor === 'transparent') {
    return '#374151'; // gray-700
  }
  
  try {
    // Remove # if present
    const cleanHex = bgColor.replace('#', '');
    
    // Parse RGB
    const r = parseInt(cleanHex.substr(0, 2), 16);
    const g = parseInt(cleanHex.substr(2, 2), 16);
    const b = parseInt(cleanHex.substr(4, 2), 16);
    
    // Calculate perceived brightness using YIQ formula
    // This is slightly different from luminance and often works better for UI
    const brightness = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    
    // Threshold: 155 works well for most colors
    // Lower than 155 = dark background = white text
    // Higher than 155 = light background = dark text
    return brightness > 155 ? '#374151' : '#ffffff';
  } catch (error) {
    console.error('Error calculating text color:', error);
    return '#374151';
  }
}
