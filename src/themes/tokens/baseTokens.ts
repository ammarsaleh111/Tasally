/**
 * Base Theme Tokens
 * These are the foundational brand colors for dark and light modes.
 * Season skins sit on top of these without overriding core palette.
 * Dominant themes may override accent/surface variables only.
 */

export const baseTokens = {
  dark: {
    // Core backgrounds
    background: '222 47% 11%',
    foreground: '210 40% 98%',
    
    // Surface layers
    card: '222 40% 14%',
    cardForeground: '210 40% 98%',
    surfaceElevated: '222 35% 18%',
    
    // Primary & Secondary
    primary: '210 40% 98%',
    primaryForeground: '222 47% 11%',
    secondary: '222 35% 20%',
    secondaryForeground: '210 40% 98%',
    
    // Muted & Accent
    muted: '222 35% 20%',
    mutedForeground: '215 20% 65%',
    accent: '222 35% 20%',
    accentForeground: '210 40% 98%',
    
    // Semantic
    success: '142 50% 42%',
    warning: '38 85% 48%',
    destructive: '0 62% 45%',
    info: '217 80% 55%',
    
    // Borders
    border: '222 35% 20%',
    ring: '215 20% 65%',
    focusRing: '217 80% 55%',
    
    // UI Elements
    keyBg: '222 40% 14%',
    keyBgHover: '222 35% 22%',
    surfaceHover: '222 35% 22%',
  },
  
  light: {
    // Core backgrounds
    background: '0 0% 100%',
    foreground: '222 47% 11%',
    
    // Surface layers
    card: '210 40% 98%',
    cardForeground: '222 47% 11%',
    surfaceElevated: '210 40% 99%',
    
    // Primary & Secondary
    primary: '222 47% 11%',
    primaryForeground: '210 40% 98%',
    secondary: '215 25% 93%',
    secondaryForeground: '222 47% 11%',
    
    // Muted & Accent
    muted: '215 25% 93%',
    mutedForeground: '215 16% 47%',
    accent: '215 25% 93%',
    accentForeground: '222 47% 11%',
    
    // Semantic
    success: '142 53% 48%',
    warning: '38 92% 50%',
    destructive: '0 72% 51%',
    info: '217 91% 60%',
    
    // Borders
    border: '215 25% 88%',
    ring: '222 47% 11%',
    focusRing: '217 91% 60%',
    
    // UI Elements
    keyBg: '215 25% 90%',
    keyBgHover: '215 20% 85%',
    surfaceHover: '215 25% 95%',
  },
} as const;

export type BaseTokens = typeof baseTokens.dark;
