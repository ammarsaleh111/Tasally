/**
 * Theme Engine - Core Logic
 * Ammar Times 3-Layer Theming System
 * 
 * Provides functions to:
 * - Get/set user theme preferences
 * - Determine active dominant theme
 * - Resolve effective theme from all layers
 * - Apply theme to DOM via CSS variables and data attributes
 */

import type {
  UserThemePrefs,
  AppearanceMode,
  SeasonSkin,
  DominantThemeId,
  EffectiveTheme,
  DominantTokenOverrides,
  SeasonDecorations,
} from './types';
import { DEFAULT_USER_PREFS, THEME_STORAGE_KEYS } from './types';
import { DOMINANT_THEMES, getForcedDominantTheme } from './dominantConfig';
import { SEASON_THEMES, getDominantThemesSorted } from './registry';
import { dominantDecorations, seasonDecorations } from './tokens/seasonDecorations';

// ============================================================================
// USER PREFERENCES
// ============================================================================

/**
 * Get user theme preferences from localStorage
 */
export function getUserThemePrefs(): UserThemePrefs {
  if (typeof window === 'undefined') {
    return DEFAULT_USER_PREFS;
  }
  
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEYS.PREFS);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        appearance: parsed.appearance || DEFAULT_USER_PREFS.appearance,
        season: parsed.season ?? DEFAULT_USER_PREFS.season,
        allowDominant: parsed.allowDominant ?? DEFAULT_USER_PREFS.allowDominant,
      };
    }
  } catch (e) {
    console.warn('Failed to parse theme preferences:', e);
  }
  
  return DEFAULT_USER_PREFS;
}

/**
 * Save user theme preferences to localStorage
 */
export function setUserThemePrefs(prefs: Partial<UserThemePrefs>): UserThemePrefs {
  const current = getUserThemePrefs();
  const updated: UserThemePrefs = {
    ...current,
    ...prefs,
  };
  
  if (typeof window !== 'undefined') {
    localStorage.setItem(THEME_STORAGE_KEYS.PREFS, JSON.stringify(updated));
  }
  
  return updated;
}

/**
 * Reset user preferences to default
 */
export function resetUserThemePrefs(): UserThemePrefs {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(THEME_STORAGE_KEYS.PREFS);
    localStorage.removeItem(THEME_STORAGE_KEYS.BANNER_DISMISSED);
  }
  return DEFAULT_USER_PREFS;
}

/**
 * Set appearance mode (dark/light)
 */
export function setAppearance(mode: AppearanceMode): UserThemePrefs {
  return setUserThemePrefs({ appearance: mode });
}

/**
 * Set season skin
 */
export function setSeasonSkin(season: SeasonSkin): UserThemePrefs {
  return setUserThemePrefs({ season });
}

/**
 * Set whether dominant themes are allowed
 */
export function setAllowDominant(allow: boolean): UserThemePrefs {
  return setUserThemePrefs({ allowDominant: allow });
}

// ============================================================================
// DOMINANT THEME DETECTION
// ============================================================================

/**
 * Server theme settings cache
 * Used to store admin-controlled settings from API
 */
let serverSettingsCache: ServerThemeSettings | null = null;
let serverSettingsLastFetch = 0;
const SERVER_SETTINGS_TTL = 5 * 60 * 1000; // 5 minutes cache

interface ServerThemeSettings {
  activeDominantTheme: string | null;
  useSchedule: boolean;
  ramadanStart: string | null;
  ramadanEnd: string | null;
  eidStart: string | null;
  eidEnd: string | null;
  bannerTitle: string | null;
  bannerSubtitle: string | null;
  bannerEnabled: boolean;
}

/**
 * Fetch theme settings from server
 * Returns cached value if still valid
 */
export async function fetchServerThemeSettings(): Promise<ServerThemeSettings | null> {
  if (typeof window === 'undefined') {
    return null;
  }
  
  const now = Date.now();
  
  // Return cached if still valid
  if (serverSettingsCache && now - serverSettingsLastFetch < SERVER_SETTINGS_TTL) {
    return serverSettingsCache;
  }
  
  try {
    const res = await fetch('/api/theme/settings', {
      cache: 'no-store',
    });
    
    if (!res.ok) {
      console.warn('Failed to fetch theme settings:', res.status);
      return serverSettingsCache; // Return stale cache if available
    }
    
    serverSettingsCache = await res.json();
    serverSettingsLastFetch = now;
    return serverSettingsCache;
  } catch (error) {
    console.warn('Error fetching theme settings:', error);
    return serverSettingsCache; // Return stale cache on error
  }
}

/**
 * Clear server settings cache (call when admin updates settings)
 */
export function clearServerSettingsCache(): void {
  serverSettingsCache = null;
  serverSettingsLastFetch = 0;
}

/**
 * Get the currently active dominant theme based on date and server settings
 * Returns null if no dominant theme is active
 */
export function getActiveDominantTheme(now: Date = new Date()): typeof DOMINANT_THEMES[keyof typeof DOMINANT_THEMES] | null {
  // Check for forced theme override (testing)
  const forced = getForcedDominantTheme();
  if (forced && DOMINANT_THEMES[forced]) {
    return DOMINANT_THEMES[forced];
  }
  
  // If we have server settings with manual activation, use that
  if (serverSettingsCache && !serverSettingsCache.useSchedule && serverSettingsCache.activeDominantTheme) {
    return DOMINANT_THEMES[serverSettingsCache.activeDominantTheme] || null;
  }
  
  // Check server-defined date ranges first
  if (serverSettingsCache?.useSchedule) {
    const todayStr = now.toISOString().split('T')[0];
    
    // Check Eid first (higher priority)
    if (serverSettingsCache.eidStart && serverSettingsCache.eidEnd) {
      if (todayStr >= serverSettingsCache.eidStart && todayStr <= serverSettingsCache.eidEnd) {
        return DOMINANT_THEMES.eid || null;
      }
    }
    
    // Check Ramadan
    if (serverSettingsCache.ramadanStart && serverSettingsCache.ramadanEnd) {
      if (todayStr >= serverSettingsCache.ramadanStart && todayStr <= serverSettingsCache.ramadanEnd) {
        return DOMINANT_THEMES.ramadan || null;
      }
    }
  }
  
  // Fallback to config-based detection
  const todayStr = now.toISOString().split('T')[0];
  const sortedThemes = getDominantThemesSorted();
  
  // Find the highest priority theme that's currently active
  for (const theme of sortedThemes) {
    if (todayStr >= theme.dates.start && todayStr <= theme.dates.end) {
      return theme;
    }
  }
  
  return null;
}

/**
 * Get the status of a dominant theme
 */
export function getDominantThemeStatus(
  themeId: string,
  now: Date = new Date()
): 'active' | 'upcoming' | 'ended' {
  const theme = DOMINANT_THEMES[themeId];
  if (!theme) return 'ended';
  
  const todayStr = now.toISOString().split('T')[0];
  
  if (todayStr < theme.dates.start) return 'upcoming';
  if (todayStr > theme.dates.end) return 'ended';
  return 'active';
}

/**
 * Get days until a theme starts or ends
 */
export function getDaysUntil(dateStr: string, now: Date = new Date()): number {
  const targetDate = new Date(dateStr);
  const diffTime = targetDate.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Get countdown info for a dominant theme
 */
export function getDominantThemeCountdown(
  themeId: string,
  now: Date = new Date()
): { status: 'active' | 'upcoming' | 'ended'; daysRemaining: number; label: string } {
  const theme = DOMINANT_THEMES[themeId];
  if (!theme) {
    return { status: 'ended', daysRemaining: 0, label: 'Ended' };
  }
  
  const status = getDominantThemeStatus(themeId, now);
  
  if (status === 'upcoming') {
    const days = getDaysUntil(theme.dates.start, now);
    return {
      status: 'upcoming',
      daysRemaining: days,
      label: days === 1 ? 'Starts tomorrow' : `Starts in ${days} days`,
    };
  }
  
  if (status === 'active') {
    const days = getDaysUntil(theme.dates.end, now);
    return {
      status: 'active',
      daysRemaining: days,
      label: days === 0 ? 'Ends today' : days === 1 ? 'Ends tomorrow' : `${days} days remaining`,
    };
  }
  
  return { status: 'ended', daysRemaining: 0, label: 'Ended' };
}

// ============================================================================
// EFFECTIVE THEME RESOLUTION
// ============================================================================

/**
 * Resolve the effective theme from all layers
 * This is the main function that determines what theme to apply
 */
export function resolveEffectiveTheme(now: Date = new Date()): EffectiveTheme {
  const userPrefs = getUserThemePrefs();
  const activeDominant = getActiveDominantTheme(now);
  
  // Determine if dominant theme should be applied
  const isDominantActive = activeDominant !== null;
  const isDominantAllowed = userPrefs.allowDominant;
  const shouldApplyDominant = isDominantActive && isDominantAllowed;
  
  // Base result
  const result: EffectiveTheme = {
    appearance: userPrefs.appearance,
    season: userPrefs.season,
    dominantId: shouldApplyDominant ? (activeDominant.id as DominantThemeId) : null,
    isDominantActive,
    isDominantAllowed,
    decorations: null,
    tokenOverrides: null,
    banner: null,
  };
  
  // Apply dominant theme if allowed and active
  if (shouldApplyDominant && activeDominant) {
    result.decorations = dominantDecorations[activeDominant.id] || null;
    result.tokenOverrides = activeDominant.tokenOverrides[userPrefs.appearance];
    
    // Use server custom banner text if available
    const customTitle = serverSettingsCache?.bannerTitle;
    const customSubtitle = serverSettingsCache?.bannerSubtitle;
    const bannerEnabled = serverSettingsCache?.bannerEnabled ?? true;
    
    result.banner = bannerEnabled ? {
      ...activeDominant.banner,
      title: customTitle || activeDominant.banner.title,
      subtitle: customSubtitle || activeDominant.banner.subtitle,
      endDate: activeDominant.dates.end,
    } : null;
  } else if (userPrefs.season) {
    // Apply season decorations if no dominant theme
    result.decorations = seasonDecorations[userPrefs.season] || null;
  }
  
  return result;
}

/**
 * Async version that fetches server settings first
 * Use this on initial page load to ensure server settings are considered
 */
export async function resolveEffectiveThemeAsync(now: Date = new Date()): Promise<EffectiveTheme> {
  // Fetch server settings if not cached
  await fetchServerThemeSettings();
  
  // Now resolve with server settings in cache
  return resolveEffectiveTheme(now);
}

// ============================================================================
// DOM APPLICATION
// ============================================================================

/**
 * Apply the effective theme to the DOM
 * Sets CSS variables and data attributes
 */
export function applyThemeToDOM(effectiveTheme: EffectiveTheme): void {
  if (typeof document === 'undefined') return;
  
  const root = document.documentElement;
  
  // Apply appearance mode (dark/light)
  root.setAttribute('data-theme', effectiveTheme.appearance);
  root.classList.toggle('dark', effectiveTheme.appearance === 'dark');
  root.classList.toggle('light', effectiveTheme.appearance === 'light');
  
  // Apply season skin
  root.setAttribute('data-season', effectiveTheme.season || 'none');
  
  // Apply dominant theme
  root.setAttribute('data-dominant', effectiveTheme.dominantId || 'none');
  
  // Apply token overrides for dominant themes
  if (effectiveTheme.tokenOverrides) {
    applyTokenOverrides(effectiveTheme.tokenOverrides);
  } else {
    clearTokenOverrides();
  }
}

/**
 * Apply dominant theme token overrides as CSS variables
 */
function applyTokenOverrides(tokens: DominantTokenOverrides): void {
  const root = document.documentElement;
  
  // Map token keys to CSS variable names
  const tokenMap: Record<keyof DominantTokenOverrides, string> = {
    accent: '--dominant-accent',
    accentForeground: '--dominant-accent-foreground',
    surface: '--dominant-surface',
    border: '--dominant-border',
    success: '--dominant-success',
    gameAccent: '--dominant-game-accent',
  };
  
  for (const [key, value] of Object.entries(tokens)) {
    if (value && tokenMap[key as keyof DominantTokenOverrides]) {
      root.style.setProperty(tokenMap[key as keyof DominantTokenOverrides], value);
    }
  }
  
  // Set flag indicating dominant overrides are active
  root.style.setProperty('--dominant-active', '1');
}

/**
 * Clear dominant theme token overrides
 */
function clearTokenOverrides(): void {
  const root = document.documentElement;
  
  const tokenVars = [
    '--dominant-accent',
    '--dominant-accent-foreground',
    '--dominant-surface',
    '--dominant-border',
    '--dominant-success',
    '--dominant-game-accent',
    '--dominant-active',
  ];
  
  tokenVars.forEach(varName => {
    root.style.removeProperty(varName);
  });
}

// ============================================================================
// BANNER DISMISS HANDLING
// ============================================================================

/**
 * Check if the theme banner has been dismissed for the current dominant theme
 */
export function isBannerDismissed(themeId: string): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEYS.BANNER_DISMISSED);
    if (stored) {
      const data = JSON.parse(stored);
      if (data.themeId === themeId) {
        // Check if dismissal is still valid (same day)
        const dismissedDate = new Date(data.dismissedAt).toDateString();
        const today = new Date().toDateString();
        return dismissedDate === today;
      }
    }
  } catch (e) {
    console.warn('Failed to check banner dismissal:', e);
  }
  
  return false;
}

/**
 * Dismiss the theme banner for the current session/day
 */
export function dismissBanner(themeId: string): void {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem(THEME_STORAGE_KEYS.BANNER_DISMISSED, JSON.stringify({
    themeId,
    dismissedAt: new Date().toISOString(),
  }));
}

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize the theme system
 * Call this on app load to hydrate theme state
 */
export function initializeTheme(): EffectiveTheme {
  const effectiveTheme = resolveEffectiveTheme();
  applyThemeToDOM(effectiveTheme);
  return effectiveTheme;
}

/**
 * Async version that fetches server settings first
 * Use this for initial page load
 */
export async function initializeThemeAsync(): Promise<EffectiveTheme> {
  const effectiveTheme = await resolveEffectiveThemeAsync();
  applyThemeToDOM(effectiveTheme);
  return effectiveTheme;
}

/**
 * Toggle appearance mode
 */
export function toggleAppearance(): EffectiveTheme {
  const prefs = getUserThemePrefs();
  const newMode: AppearanceMode = prefs.appearance === 'dark' ? 'light' : 'dark';
  setAppearance(newMode);
  return initializeTheme();
}

// ============================================================================
// EXPORTS FOR BACKWARD COMPATIBILITY
// ============================================================================

// Re-export legacy functions that may be used elsewhere
export { DOMINANT_THEMES } from './dominantConfig';
export { SEASON_THEMES, THEME_REGISTRY, getDominantTheme, getSeasonTheme } from './registry';
