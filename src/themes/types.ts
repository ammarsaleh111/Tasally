/**
 * Theme System Type Definitions
 * Ammar Times - 3-Layer Theming Architecture
 */

// Theme types
export type ThemeType = 'dominant' | 'season';
export type AppearanceMode = 'dark' | 'light';
export type SeasonSkin = 'spring' | 'summer' | 'autumn' | 'winter' | null;
export type DominantThemeId = 'ramadan' | 'eid' | null;

// Theme status for display
export type ThemeStatus = 'active' | 'upcoming' | 'ended';

// User preferences stored in localStorage
export interface UserThemePrefs {
  appearance: AppearanceMode;
  season: SeasonSkin;
  allowDominant: boolean;
}

// Banner configuration
export interface ThemeBannerConfig {
  title: string;
  subtitle: string;
  icon: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
}

// Decorative elements for season skins
export interface SeasonDecorations {
  backgroundPattern?: string;
  cornerStickers?: string[];
  iconSet?: string;
  animationStyle?: 'gentle' | 'playful' | 'cozy' | 'vibrant';
  accentEmoji?: string;
  microCopy?: {
    greeting?: string;
    successMessage?: string;
    loadingMessage?: string;
  };
}

// Token overrides for dominant themes
export interface DominantTokenOverrides {
  accent: string;
  accentForeground: string;
  surface?: string;
  border?: string;
  success?: string;
  // Specific game color overrides
  gameAccent?: string;
}

// Base theme definition
export interface ThemeDefinition {
  id: string;
  label: string;
  type: ThemeType;
  icon: string;
  description: string;
}

// Dominant theme definition
export interface DominantTheme extends ThemeDefinition {
  type: 'dominant';
  dates: {
    start: string; // ISO date
    end: string;   // ISO date
  };
  priority: number; // Higher = takes precedence in overlaps
  banner: ThemeBannerConfig;
  tokenOverrides: {
    dark: DominantTokenOverrides;
    light: DominantTokenOverrides;
  };
  decorations: SeasonDecorations;
  // Game-specific themed content references
  gameContent?: {
    wordle?: { wordList: string; description: string };
    trivia?: { questionSet: string; description: string };
    connections?: { puzzleSet: string; description: string };
  };
}

// Season skin definition
export interface SeasonTheme extends ThemeDefinition {
  type: 'season';
  months: number[]; // Which months this season naturally covers (1-12)
  decorations: SeasonDecorations;
  // Season skins do NOT have token overrides - they only affect decorations
}

// Resolved effective theme - output of the theme engine
export interface EffectiveTheme {
  appearance: AppearanceMode;
  season: SeasonSkin;
  dominantId: DominantThemeId;
  isDominantActive: boolean;
  isDominantAllowed: boolean;
  decorations: SeasonDecorations | null;
  tokenOverrides: DominantTokenOverrides | null;
  banner: (ThemeBannerConfig & { endDate: string }) | null;
}

// Theme registry structure
export interface ThemeRegistry {
  dominant: Record<string, DominantTheme>;
  seasons: Record<string, SeasonTheme>;
}

// localStorage keys
export const THEME_STORAGE_KEYS = {
  PREFS: 'ammar-theme-prefs',
  BANNER_DISMISSED: 'ammar-theme-banner-dismissed',
} as const;

// Default user preferences
export const DEFAULT_USER_PREFS: UserThemePrefs = {
  appearance: 'dark',
  season: null,
  allowDominant: true,
};
