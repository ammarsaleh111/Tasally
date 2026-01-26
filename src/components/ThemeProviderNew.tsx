'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef, startTransition } from 'react';
import type { EffectiveTheme, AppearanceMode, SeasonSkin, UserThemePrefs } from '@/themes/types';
import { DEFAULT_USER_PREFS } from '@/themes/types';
import {
  getUserThemePrefs,
  setUserThemePrefs,
  resetUserThemePrefs,
  resolveEffectiveTheme,
  applyThemeToDOM,
  isBannerDismissed,
  dismissBanner as dismissBannerStorage,
  getDominantThemeCountdown,
} from '@/themes/engine';
import { DOMINANT_THEMES, SEASON_THEMES } from '@/themes/registry';

// ============================================================================
// CONTEXT TYPES
// ============================================================================

interface ThemeContextValue {
  // Current state
  effectiveTheme: EffectiveTheme;
  userPrefs: UserThemePrefs;
  isHydrated: boolean;
  
  // Appearance controls
  appearance: AppearanceMode;
  setAppearance: (mode: AppearanceMode) => void;
  toggleAppearance: () => void;
  
  // Season controls
  season: SeasonSkin;
  setSeason: (season: SeasonSkin) => void;
  
  // Dominant theme controls
  allowDominant: boolean;
  setAllowDominant: (allow: boolean) => void;
  
  // Banner state
  isBannerVisible: boolean;
  dismissBanner: () => void;
  
  // Utilities
  resetToDefault: () => void;
  refreshTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

// ============================================================================
// HELPER: Get initial state from localStorage (client-side only)
// ============================================================================

function getInitialState() {
  if (typeof window === 'undefined') {
    return {
      prefs: DEFAULT_USER_PREFS,
      effective: {
        appearance: 'dark' as const,
        season: null,
        dominantId: null,
        isDominantActive: false,
        isDominantAllowed: true,
        decorations: null,
        tokenOverrides: null,
        banner: null,
      },
      bannerDismissed: false,
    };
  }
  
  const prefs = getUserThemePrefs();
  const effective = resolveEffectiveTheme();
  const bannerDismissed = effective.dominantId ? isBannerDismissed(effective.dominantId) : false;
  
  return { prefs, effective, bannerDismissed };
}

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  // Track if component has mounted (for hydration)
  const hasMounted = useRef(false);
  
  // Initialize with defaults, will hydrate on mount
  const [isHydrated, setIsHydrated] = useState(false);
  const [userPrefs, setUserPrefsState] = useState<UserThemePrefs>(DEFAULT_USER_PREFS);
  const [effectiveTheme, setEffectiveTheme] = useState<EffectiveTheme>({
    appearance: 'dark',
    season: null,
    dominantId: null,
    isDominantActive: false,
    isDominantAllowed: true,
    decorations: null,
    tokenOverrides: null,
    banner: null,
  });
  const [bannerDismissed, setBannerDismissed] = useState(false);

  // ============================================================================
  // HYDRATION & INITIALIZATION
  // ============================================================================
  
  // Hydrate state from localStorage on mount
  useEffect(() => {
    if (hasMounted.current) return;
    hasMounted.current = true;
    
    // Get state from localStorage
    const { prefs, effective, bannerDismissed: dismissed } = getInitialState();
    
    // Apply theme to DOM (external system sync - valid effect usage)
    applyThemeToDOM(effective);
    document.documentElement.style.visibility = 'visible';
    
    // Update React state to match localStorage using startTransition
    // to indicate this is a non-blocking hydration update
    startTransition(() => {
      setUserPrefsState(prefs);
      setEffectiveTheme(effective);
      setBannerDismissed(dismissed);
      setIsHydrated(true);
    });
  }, []);

  // ============================================================================
  // THEME UPDATE FUNCTIONS
  // ============================================================================
  
  const refreshTheme = useCallback(() => {
    const prefs = getUserThemePrefs();
    const resolved = resolveEffectiveTheme();
    
    applyThemeToDOM(resolved);
    setUserPrefsState(prefs);
    setEffectiveTheme(resolved);
    
    if (resolved.dominantId) {
      setBannerDismissed(isBannerDismissed(resolved.dominantId));
    } else {
      setBannerDismissed(false);
    }
  }, []);
  
  const updatePrefs = useCallback((updates: Partial<UserThemePrefs>) => {
    const newPrefs = setUserThemePrefs(updates);
    setUserPrefsState(newPrefs);
    
    const resolved = resolveEffectiveTheme();
    setEffectiveTheme(resolved);
    applyThemeToDOM(resolved);
    
    if (resolved.dominantId) {
      setBannerDismissed(isBannerDismissed(resolved.dominantId));
    }
  }, []);
  
  // Appearance controls
  const setAppearance = useCallback((mode: AppearanceMode) => {
    updatePrefs({ appearance: mode });
  }, [updatePrefs]);
  
  const toggleAppearance = useCallback(() => {
    const newMode: AppearanceMode = userPrefs.appearance === 'dark' ? 'light' : 'dark';
    setAppearance(newMode);
  }, [userPrefs.appearance, setAppearance]);
  
  // Season controls
  const setSeason = useCallback((season: SeasonSkin) => {
    updatePrefs({ season });
  }, [updatePrefs]);
  
  // Dominant theme controls
  const setAllowDominant = useCallback((allow: boolean) => {
    updatePrefs({ allowDominant: allow });
  }, [updatePrefs]);
  
  // Banner controls
  const dismissBannerHandler = useCallback(() => {
    if (effectiveTheme.dominantId) {
      dismissBannerStorage(effectiveTheme.dominantId);
      setBannerDismissed(true);
    }
  }, [effectiveTheme.dominantId]);
  
  // Reset
  const resetToDefault = useCallback(() => {
    resetUserThemePrefs();
    refreshTheme();
  }, [refreshTheme]);

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================
  
  const isBannerVisible = useMemo(() => {
    return (
      effectiveTheme.isDominantActive &&
      effectiveTheme.isDominantAllowed &&
      effectiveTheme.banner !== null &&
      !bannerDismissed
    );
  }, [effectiveTheme, bannerDismissed]);

  // ============================================================================
  // CONTEXT VALUE
  // ============================================================================
  
  const contextValue = useMemo<ThemeContextValue>(() => ({
    effectiveTheme,
    userPrefs,
    isHydrated,
    
    appearance: userPrefs.appearance,
    setAppearance,
    toggleAppearance,
    
    season: userPrefs.season,
    setSeason,
    
    allowDominant: userPrefs.allowDominant,
    setAllowDominant,
    
    isBannerVisible,
    dismissBanner: dismissBannerHandler,
    
    resetToDefault,
    refreshTheme,
  }), [
    effectiveTheme,
    userPrefs,
    isHydrated,
    setAppearance,
    toggleAppearance,
    setSeason,
    setAllowDominant,
    isBannerVisible,
    dismissBannerHandler,
    resetToDefault,
    refreshTheme,
  ]);

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

// ============================================================================
// HOOK
// ============================================================================

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  
  return context;
}

// ============================================================================
// ADDITIONAL HOOKS
// ============================================================================

/**
 * Hook to get information about a specific dominant theme
 */
export function useDominantThemeInfo(themeId: string) {
  const theme = DOMINANT_THEMES[themeId];
  const countdown = getDominantThemeCountdown(themeId);
  
  return {
    theme,
    countdown,
    isActive: countdown.status === 'active',
    isUpcoming: countdown.status === 'upcoming',
    isEnded: countdown.status === 'ended',
  };
}

/**
 * Hook to get all available themes
 */
export function useAvailableThemes() {
  return {
    dominant: Object.values(DOMINANT_THEMES),
    seasons: Object.values(SEASON_THEMES),
  };
}

export default ThemeProvider;
