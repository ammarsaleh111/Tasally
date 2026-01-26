/**
 * Dominant Theme Token Overrides
 * These override accent/surface colors when a dominant theme is active.
 * Must pass contrast checks for accessibility.
 */

import type { DominantTokenOverrides } from '../types';

export const dominantTokens: Record<string, { dark: DominantTokenOverrides; light: DominantTokenOverrides }> = {
  ramadan: {
    dark: {
      // Deep purple/gold palette for Ramadan
      accent: '270 60% 45%',           // Deep purple
      accentForeground: '45 100% 95%', // Warm cream
      surface: '270 40% 15%',          // Dark purple tint
      border: '270 30% 25%',           // Subtle purple border
      success: '270 50% 50%',          // Purple success
      gameAccent: '45 80% 55%',        // Gold for game elements
    },
    light: {
      accent: '270 55% 55%',           // Lighter purple
      accentForeground: '0 0% 100%',   // White
      surface: '270 30% 97%',          // Very light purple tint
      border: '270 25% 85%',           // Subtle purple border
      success: '270 50% 50%',          // Purple success
      gameAccent: '45 75% 50%',        // Gold for game elements
    },
  },
  
  eid: {
    dark: {
      // Emerald green/gold palette for Eid
      accent: '160 60% 40%',           // Emerald green
      accentForeground: '45 100% 95%', // Warm cream
      surface: '160 40% 12%',          // Dark green tint
      border: '160 30% 22%',           // Subtle green border
      success: '160 55% 45%',          // Emerald success
      gameAccent: '45 80% 55%',        // Gold for game elements
    },
    light: {
      accent: '160 55% 45%',           // Lighter emerald
      accentForeground: '0 0% 100%',   // White
      surface: '160 25% 97%',          // Very light green tint
      border: '160 20% 85%',           // Subtle green border
      success: '160 55% 50%',          // Emerald success
      gameAccent: '45 75% 50%',        // Gold for game elements
    },
  },
} as const;
