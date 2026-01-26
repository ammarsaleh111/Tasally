/**
 * Theme System Barrel Export
 * Import all theme-related utilities from this single file
 */

// Types
export type {
  ThemeType,
  AppearanceMode,
  SeasonSkin,
  DominantThemeId,
  ThemeStatus,
  UserThemePrefs,
  ThemeBannerConfig,
  SeasonDecorations,
  DominantTokenOverrides,
  ThemeDefinition,
  DominantTheme,
  SeasonTheme,
  EffectiveTheme,
  ThemeRegistry,
} from './types';

export { THEME_STORAGE_KEYS, DEFAULT_USER_PREFS } from './types';

// Registry
export {
  THEME_REGISTRY,
  SEASON_THEMES,
  DOMINANT_THEMES,
  getDominantThemesSorted,
  getAllSeasonThemes,
  getNaturalSeason,
  getDominantTheme,
  getSeasonTheme,
} from './registry';

// Tokens
export { baseTokens } from './tokens/baseTokens';
export { dominantTokens } from './tokens/dominantTokens';
export { seasonDecorations, dominantDecorations } from './tokens/seasonDecorations';

// Config
export { getForcedDominantTheme, hasForcedTheme } from './dominantConfig';

// Engine
export {
  // User preferences
  getUserThemePrefs,
  setUserThemePrefs,
  resetUserThemePrefs,
  setAppearance,
  setSeasonSkin,
  setAllowDominant,
  
  // Dominant theme detection
  getActiveDominantTheme,
  getDominantThemeStatus,
  getDaysUntil,
  getDominantThemeCountdown,
  
  // Theme resolution
  resolveEffectiveTheme,
  
  // DOM application
  applyThemeToDOM,
  
  // Banner handling
  isBannerDismissed,
  dismissBanner,
  
  // Initialization
  initializeTheme,
  toggleAppearance,
} from './engine';
