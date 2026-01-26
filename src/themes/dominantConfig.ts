/**
 * Dominant Theme Configuration
 * Admin-controlled configuration for special event themes.
 * 
 * To test a dominant theme, set the environment variable:
 * NEXT_PUBLIC_FORCE_DOMINANT_THEME=ramadan|eid|none
 * 
 * In production, themes are activated based on date ranges defined here.
 */

import type { DominantTheme } from './types';
import { dominantTokens } from './tokens/dominantTokens';
import { dominantDecorations } from './tokens/seasonDecorations';

/**
 * Dominant Theme Definitions
 * Priority determines which theme wins if dates overlap (higher = wins)
 */
export const DOMINANT_THEMES: Record<string, DominantTheme> = {
  ramadan: {
    id: 'ramadan',
    label: 'Ramadan',
    type: 'dominant',
    icon: '🌙',
    description: 'A blessed month of reflection, prayer, and community. Special themed puzzles celebrating Islamic heritage.',
    dates: {
      // Ramadan 2026 approximate dates (adjust for actual moon sighting)
      start: '2026-02-17',
      end: '2026-03-18',
    },
    priority: 10,
    banner: {
      title: 'Ramadan Kareem',
      subtitle: 'Special themed puzzles for the holy month',
      icon: '🌙',
      backgroundColor: 'hsl(270 60% 45%)',
      textColor: 'hsl(45 100% 95%)',
      accentColor: 'hsl(45 80% 55%)',
    },
    tokenOverrides: dominantTokens.ramadan,
    decorations: dominantDecorations.ramadan,
    gameContent: {
      wordle: { wordList: 'ramadan', description: 'Islamic terms' },
      trivia: { questionSet: 'ramadan', description: 'Islamic knowledge' },
    },
  },
  
  eid: {
    id: 'eid',
    label: 'Eid Celebration',
    type: 'dominant',
    icon: '🎉',
    description: 'Celebrate Eid with special festive puzzles! A time of joy, gratitude, and togetherness.',
    dates: {
      // Eid al-Fitr 2026 approximate dates
      start: '2026-03-19',
      end: '2026-03-22',
    },
    priority: 15, // Eid takes priority if it overlaps with end of Ramadan
    banner: {
      title: 'Eid Mubarak!',
      subtitle: 'Celebrate with festive puzzles',
      icon: '🎉',
      backgroundColor: 'hsl(160 60% 40%)',
      textColor: 'hsl(45 100% 95%)',
      accentColor: 'hsl(45 80% 55%)',
    },
    tokenOverrides: dominantTokens.eid,
    decorations: dominantDecorations.eid,
    gameContent: {
      wordle: { wordList: 'eid', description: 'Celebration terms' },
      trivia: { questionSet: 'eid', description: 'Eid trivia' },
    },
  },
};

/**
 * Get the forced dominant theme from environment variable (for testing)
 */
export function getForcedDominantTheme(): string | null {
  if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_FORCE_DOMINANT_THEME) {
    const forced = process.env.NEXT_PUBLIC_FORCE_DOMINANT_THEME;
    if (forced === 'none') return null;
    if (forced in DOMINANT_THEMES) return forced;
  }
  return null;
}

/**
 * Check if a forced theme override is active
 */
export function hasForcedTheme(): boolean {
  return typeof process !== 'undefined' && 
    !!process.env?.NEXT_PUBLIC_FORCE_DOMINANT_THEME &&
    process.env.NEXT_PUBLIC_FORCE_DOMINANT_THEME !== 'none';
}
