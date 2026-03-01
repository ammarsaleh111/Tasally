/**
 * Tasally Design System - Token Definitions
 * Single source of truth for all design tokens
 * 
 * Usage:
 * - Import tokens for JS/TS logic
 * - CSS variables defined in globals.css follow these patterns
 * - Theme engine uses these to override accent colors
 */

// ========================================
// SPACING SCALE (4px base)
// ========================================
export const spacing = {
  0: '0',
  0.5: '0.125rem',  // 2px
  1: '0.25rem',     // 4px
  1.5: '0.375rem',  // 6px
  2: '0.5rem',      // 8px
  2.5: '0.625rem',  // 10px
  3: '0.75rem',     // 12px
  4: '1rem',        // 16px
  5: '1.25rem',     // 20px
  6: '1.5rem',      // 24px
  8: '2rem',        // 32px
  10: '2.5rem',     // 40px
  12: '3rem',       // 48px
  16: '4rem',       // 64px
  20: '5rem',       // 80px
  24: '6rem',       // 96px
} as const;

// ========================================
// TYPOGRAPHY
// ========================================
export const typography = {
  fontFamily: {
    sans: ['Geist', 'system-ui', 'sans-serif'],
    mono: ['Geist Mono', 'ui-monospace', 'monospace'],
    serif: ['Georgia', 'serif'],
  },
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],
    sm: ['0.875rem', { lineHeight: '1.25rem' }],
    base: ['1rem', { lineHeight: '1.5rem' }],
    lg: ['1.125rem', { lineHeight: '1.75rem' }],
    xl: ['1.25rem', { lineHeight: '1.75rem' }],
    '2xl': ['1.5rem', { lineHeight: '2rem' }],
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
    '5xl': ['3rem', { lineHeight: '1' }],
    '6xl': ['3.75rem', { lineHeight: '1' }],
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },
} as const;

// ========================================
// BORDER RADIUS
// ========================================
export const radius = {
  none: '0',
  sm: '0.375rem',     // 6px
  md: '0.5rem',       // 8px
  lg: '0.75rem',      // 12px
  xl: '1rem',         // 16px
  '2xl': '1.25rem',   // 20px
  '3xl': '1.5rem',    // 24px
  full: '9999px',
} as const;

// ========================================
// SHADOWS
// ========================================
export const shadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  // Game-specific glows
  glow: {
    success: '0 0 20px rgba(var(--success) / 0.3)',
    warning: '0 0 20px rgba(var(--warning) / 0.3)',
    accent: '0 0 20px rgba(var(--accent-primary) / 0.3)',
  },
} as const;

// ========================================
// TRANSITIONS
// ========================================
export const transitions = {
  duration: {
    fast: '150ms',
    normal: '200ms',
    slow: '300ms',
    slower: '500ms',
  },
  timing: {
    ease: 'cubic-bezier(0.4, 0, 0.2, 1)',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
} as const;

// ========================================
// COLOR TOKENS (HSL format for CSS vars)
// ========================================
export const colors = {
  light: {
    // Core
    background: '0 0% 100%',
    foreground: '222 47% 11%',
    
    // Surfaces
    card: '210 40% 98%',
    cardForeground: '222 47% 11%',
    surface: '210 40% 96%',
    surfaceHover: '215 25% 93%',
    surfaceElevated: '0 0% 100%',
    
    // Text
    muted: '215 16% 47%',
    mutedForeground: '215 25% 35%',
    
    // Borders
    border: '215 25% 88%',
    borderHover: '215 20% 75%',
    borderActive: '215 20% 65%',
    
    // Interactive
    primary: '222 47% 11%',
    primaryForeground: '210 40% 98%',
    secondary: '215 25% 93%',
    secondaryForeground: '222 47% 11%',
    
    // Semantic
    success: '142 53% 48%',
    successForeground: '0 0% 100%',
    warning: '38 92% 50%',
    warningForeground: '0 0% 100%',
    danger: '0 72% 51%',
    dangerForeground: '0 0% 100%',
    info: '217 91% 60%',
    infoForeground: '0 0% 100%',
    
    // Accent (theme-overridable)
    accent: '142 43% 54%',
    accentForeground: '0 0% 100%',
    accentMuted: '142 43% 90%',
    
    // Focus
    ring: '217 91% 60%',
    focusRing: '217 91% 60%',
  },
  dark: {
    // Core
    background: '222 47% 11%',
    foreground: '210 40% 98%',
    
    // Surfaces
    card: '222 40% 14%',
    cardForeground: '210 40% 98%',
    surface: '222 35% 18%',
    surfaceHover: '222 35% 22%',
    surfaceElevated: '222 30% 20%',
    
    // Text
    muted: '215 20% 55%',
    mutedForeground: '215 20% 65%',
    
    // Borders
    border: '222 35% 20%',
    borderHover: '222 30% 30%',
    borderActive: '215 20% 50%',
    
    // Interactive
    primary: '210 40% 98%',
    primaryForeground: '222 47% 11%',
    secondary: '222 35% 20%',
    secondaryForeground: '210 40% 98%',
    
    // Semantic
    success: '142 50% 42%',
    successForeground: '0 0% 100%',
    warning: '38 85% 48%',
    warningForeground: '0 0% 100%',
    danger: '0 62% 45%',
    dangerForeground: '210 40% 98%',
    info: '217 80% 55%',
    infoForeground: '0 0% 100%',
    
    // Accent (theme-overridable)
    accent: '142 43% 42%',
    accentForeground: '0 0% 100%',
    accentMuted: '142 43% 20%',
    
    // Focus
    ring: '215 20% 65%',
    focusRing: '217 80% 55%',
  },
} as const;

// ========================================
// GAME-SPECIFIC COLORS
// ========================================
export const gameColors = {
  wordle: {
    light: {
      correct: '142 43% 54%',
      present: '45 70% 55%',
      absent: '215 14% 50%',
      tileBorder: '215 20% 80%',
      tileFilled: '0 0% 100%',
    },
    dark: {
      correct: '142 43% 42%',
      present: '45 65% 48%',
      absent: '222 25% 35%',
      tileBorder: '222 35% 25%',
      tileFilled: '222 40% 14%',
    },
  },
  connections: {
    light: {
      yellow: '48 88% 66%',
      green: '84 48% 52%',
      blue: '220 60% 78%',
      purple: '290 35% 60%',
      textLight: '222 47% 11%',
      textDark: '0 0% 100%',
    },
    dark: {
      yellow: '48 75% 58%',
      green: '84 45% 48%',
      blue: '220 55% 65%',
      purple: '290 35% 55%',
      textLight: '222 47% 11%',
      textDark: '0 0% 100%',
    },
  },
  strands: {
    light: {
      ribbon: '217 91% 60%',
      glow: '217 91% 60%',
      spangram: '38 80% 55%',
      locked: '142 53% 48%',
      bonus: '258 65% 58%',
    },
    dark: {
      ribbon: '217 80% 55%',
      glow: '217 80% 55%',
      spangram: '38 75% 50%',
      locked: '142 50% 42%',
      bonus: '258 60% 55%',
    },
  },
  crossword: {
    light: {
      active: '217 91% 68%',
      activeRing: '217 91% 50%',
      highlight: '217 91% 93%',
      black: '222 47% 11%',
    },
    dark: {
      active: '217 80% 60%',
      activeRing: '217 80% 50%',
      highlight: '222 60% 25%',
      black: '222 47% 11%',
    },
  },
} as const;

// ========================================
// SEASONAL THEME OVERRIDES
// ========================================
export type SeasonalThemeId = 'halloween' | 'christmas' | 'ramadan' | 'sports' | 'worldcup' | 'music' | 'oscars';

export interface SeasonalThemeColors {
  accent: string;
  accentForeground: string;
  accentMuted: string;
  accentGlow: string;
  bannerBg: string;
  bannerText: string;
}

export const seasonalThemes: Record<SeasonalThemeId, SeasonalThemeColors> = {
  halloween: {
    accent: '24 95% 53%',          // Orange
    accentForeground: '0 0% 0%',
    accentMuted: '24 70% 20%',
    accentGlow: '24 95% 53%',
    bannerBg: '#ff6b35',
    bannerText: '#000000',
  },
  christmas: {
    accent: '0 72% 51%',           // Red
    accentForeground: '0 0% 100%',
    accentMuted: '0 50% 20%',
    accentGlow: '0 72% 51%',
    bannerBg: '#dc2626',
    bannerText: '#ffffff',
  },
  ramadan: {
    accent: '262 83% 58%',         // Purple
    accentForeground: '0 0% 100%',
    accentMuted: '262 50% 20%',
    accentGlow: '262 83% 58%',
    bannerBg: '#8b5cf6',
    bannerText: '#ffffff',
  },
  sports: {
    accent: '217 91% 60%',         // Blue
    accentForeground: '0 0% 100%',
    accentMuted: '217 50% 20%',
    accentGlow: '217 91% 60%',
    bannerBg: '#3b82f6',
    bannerText: '#ffffff',
  },
  worldcup: {
    accent: '45 93% 47%',          // Gold
    accentForeground: '0 0% 0%',
    accentMuted: '45 60% 20%',
    accentGlow: '45 93% 47%',
    bannerBg: '#fbbf24',
    bannerText: '#000000',
  },
  music: {
    accent: '330 81% 60%',         // Pink
    accentForeground: '0 0% 100%',
    accentMuted: '330 50% 20%',
    accentGlow: '330 81% 60%',
    bannerBg: '#ec4899',
    bannerText: '#ffffff',
  },
  oscars: {
    accent: '45 93% 47%',          // Gold
    accentForeground: '0 0% 0%',
    accentMuted: '45 60% 20%',
    accentGlow: '45 93% 47%',
    bannerBg: '#fbbf24',
    bannerText: '#000000',
  },
} as const;

// ========================================
// BREAKPOINTS
// ========================================
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// ========================================
// Z-INDEX SCALE
// ========================================
export const zIndex = {
  base: 0,
  dropdown: 10,
  sticky: 20,
  fixed: 30,
  modalBackdrop: 40,
  modal: 50,
  popover: 60,
  tooltip: 70,
  toast: 80,
  confetti: 90,
  max: 9999,
} as const;

// ========================================
// COMPONENT TOKENS
// ========================================
export const components = {
  button: {
    height: {
      sm: '2rem',       // 32px
      md: '2.5rem',     // 40px
      lg: '3rem',       // 48px
    },
    padding: {
      sm: '0.75rem 1rem',
      md: '0.875rem 1.25rem',
      lg: '1rem 1.5rem',
    },
    fontSize: {
      sm: '0.875rem',
      md: '0.875rem',
      lg: '1rem',
    },
    radius: '0.75rem',
  },
  input: {
    height: {
      sm: '2rem',
      md: '2.5rem',
      lg: '3rem',
    },
    padding: '0.75rem 1rem',
    radius: '0.5rem',
    borderWidth: '1px',
  },
  card: {
    padding: {
      sm: '1rem',
      md: '1.5rem',
      lg: '2rem',
    },
    radius: '1rem',
    borderWidth: '1px',
  },
  modal: {
    padding: '1.5rem',
    radius: '1.25rem',
    maxWidth: {
      sm: '24rem',      // 384px
      md: '28rem',      // 448px
      lg: '32rem',      // 512px
      xl: '36rem',      // 576px
    },
  },
  badge: {
    padding: '0.25rem 0.75rem',
    fontSize: '0.75rem',
    radius: '9999px',
  },
  toast: {
    padding: '0.75rem 1rem',
    radius: '0.5rem',
    maxWidth: '24rem',
  },
  tabs: {
    height: '2.5rem',
    padding: '0.5rem 1rem',
    radius: '0.5rem',
  },
  avatar: {
    size: {
      sm: '2rem',
      md: '2.5rem',
      lg: '4rem',
      xl: '6rem',
    },
  },
} as const;

// ========================================
// ANIMATION PRESETS
// ========================================
export const animations = {
  fadeIn: {
    keyframes: {
      from: { opacity: 0 },
      to: { opacity: 1 },
    },
    duration: '200ms',
    timing: 'ease-out',
  },
  fadeInUp: {
    keyframes: {
      from: { opacity: 0, transform: 'translateY(10px)' },
      to: { opacity: 1, transform: 'translateY(0)' },
    },
    duration: '300ms',
    timing: 'cubic-bezier(0.16, 1, 0.3, 1)',
  },
  scaleIn: {
    keyframes: {
      from: { opacity: 0, transform: 'scale(0.95)' },
      to: { opacity: 1, transform: 'scale(1)' },
    },
    duration: '200ms',
    timing: 'ease-out',
  },
  slideDown: {
    keyframes: {
      from: { opacity: 0, transform: 'translateY(-10px)' },
      to: { opacity: 1, transform: 'translateY(0)' },
    },
    duration: '200ms',
    timing: 'ease-out',
  },
  bounce: {
    keyframes: {
      '0%, 100%': { transform: 'translateY(0)' },
      '50%': { transform: 'translateY(-8px)' },
    },
    duration: '600ms',
    timing: 'ease-in-out',
  },
  pulse: {
    keyframes: {
      '0%, 100%': { opacity: 1 },
      '50%': { opacity: 0.7 },
    },
    duration: '2s',
    timing: 'ease-in-out',
    iterations: 'infinite',
  },
  spin: {
    keyframes: {
      from: { transform: 'rotate(0deg)' },
      to: { transform: 'rotate(360deg)' },
    },
    duration: '1s',
    timing: 'linear',
    iterations: 'infinite',
  },
} as const;

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Convert HSL values to CSS hsl() format
 */
export function hsl(value: string): string {
  return `hsl(${value})`;
}

/**
 * Convert HSL values to CSS hsl() format with alpha
 */
export function hsla(value: string, alpha: number): string {
  return `hsl(${value} / ${alpha})`;
}

/**
 * Get CSS variable reference
 */
export function cssVar(name: string): string {
  return `var(--${name})`;
}

/**
 * Get game color for current theme
 */
export function getGameColor(
  game: keyof typeof gameColors,
  colorName: string,
  isDark: boolean
): string {
  const mode = isDark ? 'dark' : 'light';
  const gameColorSet = gameColors[game]?.[mode];
  return gameColorSet?.[colorName as keyof typeof gameColorSet] || '';
}

/**
 * Get seasonal theme accent colors
 */
export function getSeasonalAccent(themeId: SeasonalThemeId): SeasonalThemeColors | null {
  return seasonalThemes[themeId] || null;
}

const designTokens = {
  spacing,
  typography,
  radius,
  shadows,
  transitions,
  colors,
  gameColors,
  seasonalThemes,
  breakpoints,
  zIndex,
  components,
  animations,
};

export default designTokens;
