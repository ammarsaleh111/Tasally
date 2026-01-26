/**
 * Theme Registry
 * Central registry for all themes in Ammar Times.
 * 
 * Three-layer architecture:
 * 1. Dominant Themes - Admin-controlled special events (Ramadan, Eid)
 * 2. Season Skins - User-selected decorative overlays (Spring, Summer, etc.)
 * 3. Base Theme - Brand identity (Dark/Light appearance)
 */

import type { SeasonTheme, ThemeRegistry, DominantTheme } from './types';
import { DOMINANT_THEMES } from './dominantConfig';
import { seasonDecorations } from './tokens/seasonDecorations';

/**
 * Season Skin Definitions
 * These only affect decorations, NOT core palette colors.
 */
export const SEASON_THEMES: Record<string, SeasonTheme> = {
  spring: {
    id: 'spring',
    label: 'Spring',
    type: 'season',
    icon: '🌸',
    description: 'Fresh blooms and new beginnings. Gentle animations and floral accents.',
    months: [3, 4, 5], // March, April, May
    decorations: seasonDecorations.spring,
  },
  
  summer: {
    id: 'summer',
    label: 'Summer',
    type: 'season',
    icon: '☀️',
    description: 'Bright and vibrant energy. Beach vibes and sunny decorations.',
    months: [6, 7, 8], // June, July, August
    decorations: seasonDecorations.summer,
  },
  
  autumn: {
    id: 'autumn',
    label: 'Autumn',
    type: 'season',
    icon: '🍂',
    description: 'Cozy fall aesthetics. Warm tones and leaf decorations.',
    months: [9, 10, 11], // September, October, November
    decorations: seasonDecorations.autumn,
  },
  
  winter: {
    id: 'winter',
    label: 'Winter',
    type: 'season',
    icon: '❄️',
    description: 'Peaceful winter wonderland. Snow and cozy vibes.',
    months: [12, 1, 2], // December, January, February
    decorations: seasonDecorations.winter,
  },
};

/**
 * Complete Theme Registry
 */
export const THEME_REGISTRY: ThemeRegistry = {
  dominant: DOMINANT_THEMES,
  seasons: SEASON_THEMES,
};

/**
 * Get all dominant themes sorted by priority
 */
export function getDominantThemesSorted(): DominantTheme[] {
  return Object.values(DOMINANT_THEMES).sort((a, b) => b.priority - a.priority);
}

/**
 * Get all season themes
 */
export function getAllSeasonThemes(): SeasonTheme[] {
  return Object.values(SEASON_THEMES);
}

/**
 * Get the natural season for a given date
 */
export function getNaturalSeason(date: Date = new Date()): string {
  const month = date.getMonth() + 1; // getMonth is 0-indexed
  
  for (const [seasonId, season] of Object.entries(SEASON_THEMES)) {
    if (season.months.includes(month)) {
      return seasonId;
    }
  }
  
  return 'winter'; // Fallback
}

/**
 * Get a specific dominant theme by ID
 */
export function getDominantTheme(id: string): DominantTheme | null {
  return DOMINANT_THEMES[id] || null;
}

/**
 * Get a specific season theme by ID
 */
export function getSeasonTheme(id: string): SeasonTheme | null {
  return SEASON_THEMES[id] || null;
}

// Re-export types and dominant themes for convenience
export { DOMINANT_THEMES };
export type { DominantTheme, SeasonTheme, ThemeRegistry };
