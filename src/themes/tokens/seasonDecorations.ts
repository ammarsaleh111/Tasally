/**
 * Season Skin Decorations
 * These do NOT change the core palette - only decorative elements.
 * Icons, patterns, micro-copy, animation styles.
 */

import type { SeasonDecorations } from '../types';

export const seasonDecorations: Record<string, SeasonDecorations> = {
  spring: {
    backgroundPattern: 'spring-blossoms',
    cornerStickers: ['🌸', '🌷', '🌱', '🦋'],
    iconSet: 'spring',
    animationStyle: 'gentle',
    accentEmoji: '🌸',
    microCopy: {
      greeting: 'Spring into puzzles!',
      successMessage: 'Blooming brilliant!',
      loadingMessage: 'Planting seeds...',
    },
  },
  
  summer: {
    backgroundPattern: 'summer-waves',
    cornerStickers: ['☀️', '🌊', '🏖️', '🍦'],
    iconSet: 'summer',
    animationStyle: 'vibrant',
    accentEmoji: '☀️',
    microCopy: {
      greeting: 'Sizzling puzzles ahead!',
      successMessage: 'Cool victory!',
      loadingMessage: 'Catching rays...',
    },
  },
  
  autumn: {
    backgroundPattern: 'autumn-leaves',
    cornerStickers: ['🍂', '🍁', '🎃', '🌰'],
    iconSet: 'autumn',
    animationStyle: 'cozy',
    accentEmoji: '🍂',
    microCopy: {
      greeting: 'Fall into fun!',
      successMessage: 'Crisp success!',
      loadingMessage: 'Gathering leaves...',
    },
  },
  
  winter: {
    backgroundPattern: 'winter-snow',
    cornerStickers: ['❄️', '⛄', '🎿', '☕'],
    iconSet: 'winter',
    animationStyle: 'gentle',
    accentEmoji: '❄️',
    microCopy: {
      greeting: 'Warm up with puzzles!',
      successMessage: 'Ice cold victory!',
      loadingMessage: 'Brewing hot cocoa...',
    },
  },
} as const;

// Dominant theme decorations
export const dominantDecorations: Record<string, SeasonDecorations> = {
  ramadan: {
    backgroundPattern: 'ramadan-stars',
    cornerStickers: ['🌙', '✨', '🕌', '⭐'],
    iconSet: 'ramadan',
    animationStyle: 'gentle',
    accentEmoji: '🌙',
    microCopy: {
      greeting: 'Ramadan Kareem!',
      successMessage: 'Blessed victory!',
      loadingMessage: 'Under the crescent moon...',
    },
  },
  
  eid: {
    backgroundPattern: 'eid-celebration',
    cornerStickers: ['🎉', '🌙', '✨', '🎊'],
    iconSet: 'eid',
    animationStyle: 'playful',
    accentEmoji: '🎉',
    microCopy: {
      greeting: 'Eid Mubarak!',
      successMessage: 'Celebrate your win!',
      loadingMessage: 'Preparing festivities...',
    },
  },
} as const;
