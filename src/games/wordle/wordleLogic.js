import { DAILY_WORDS as DAILY_WORDS_JAN } from './wordLists/daily-2026-01';
import { DAILY_WORDS_FEB_2026 } from './wordLists/daily-2026-02';

// Merge January and February words into a single sequential list
const DAILY_WORDS = [...DAILY_WORDS_JAN, ...DAILY_WORDS_FEB_2026].map(word => word.toUpperCase());
const DAILY_WORD_START = Date.UTC(2026, 0, 1); // Jan 1, 2026 UTC midnight
import { ALLOWED_WORDS } from './wordLists/allowedWords';
import { WORDS_4 as RAW_WORDS_4 } from './wordLists/words4';
import { WORDS_6 as RAW_WORDS_6 } from './wordLists/words6';
import { getThemedWordList } from './wordLists/themed';
import { getActiveTheme, getGameTheme } from '@/utils/themeEngine';
import { getUserStorageKey } from '@/utils/storageKeys';

// Constants
export const DEFAULT_WORD_LENGTH = 5;
export const MAX_GUESSES = 6;

/**
 * Word pools filtered and validated by length.
 * This ensures we ONLY use words of the correct length.
 */
const WORDS_BY_LENGTH = {
  4: RAW_WORDS_4.map(w => w.toUpperCase()).filter(w => w.length === 4),
  5: ALLOWED_WORDS.map(w => w.toUpperCase()).filter(w => w.length === 5),
  6: RAW_WORDS_6.map(w => w.toUpperCase()).filter(w => w.length === 6),
};

// Log validation stats in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  console.log('[Wordle] Word pool sizes:', {
    4: WORDS_BY_LENGTH[4].length,
    5: WORDS_BY_LENGTH[5].length,
    6: WORDS_BY_LENGTH[6].length,
  });
}

// Evaluation Status
export const LETTER_STATUS = {
  CORRECT: 'correct',   // Green
  PRESENT: 'present',   // Yellow
  ABSENT: 'absent',     // Gray
};

/**
 * Selects the daily word based on the current date.
 * Currently supports 5-letter only for Daily mode.
 * Uses themed words if a theme is active.
 */
const getDayOffset = (date = new Date()) => {
  // Use UTC date for consistent global puzzle rotation
  const todayUtc = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  const diffDays = Math.floor((todayUtc - DAILY_WORD_START) / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
};

export const getDailyWord = (date = new Date()) => {
  // Check for active theme
  const activeTheme = getActiveTheme();
  const gameTheme = getGameTheme('wordle');
  
  if (activeTheme && gameTheme?.wordList) {
    const themedList = getThemedWordList(gameTheme.wordList);
    if (themedList && themedList.length > 0) {
      const dayIndex = getDayOffset(date);
      const safeIndex = dayIndex % themedList.length;
      return themedList[safeIndex].toUpperCase();
    }
  }
  
  const dayIndex = getDayOffset(date);
  const safeIndex = dayIndex % DAILY_WORDS.length;
  return DAILY_WORDS[safeIndex];
};

/**
 * Selects a random word for Unlimited mode.
 * Strict validation ensures word length always matches request.
 * @param {number} length - The word length (4, 5, or 6)
 * @returns {string} A random word of the specified length
 */
export const getRandomWord = (length = 5) => {
  // Get the word pool for the requested length
  const pool = WORDS_BY_LENGTH[length];
  
  if (!pool || pool.length === 0) {
    console.error(`[Wordle] No words available for length ${length}, falling back to 5-letter`);
    const fallbackPool = WORDS_BY_LENGTH[5];
    const index = Math.floor(Math.random() * fallbackPool.length);
    return fallbackPool[index];
  }

  const index = Math.floor(Math.random() * pool.length);
  const word = pool[index];
  
  // Runtime validation - CRITICAL: Ensure word length matches
  if (word.length !== length) {
    console.warn(`[Wordle] Word "${word}" has wrong length (${word.length} vs ${length}). Picking another.`);
    // Try to find a valid word
    for (let i = 0; i < pool.length; i++) {
      if (pool[i].length === length) {
        return pool[i];
      }
    }
    // Fallback to 5-letter if no valid word found
    console.error(`[Wordle] No valid ${length}-letter words found, using 5-letter word`);
    return getRandomWord(5);
  }
  
  return word;
};

/**
 * Validates a word exists in our dictionary
 */
export const isValidWord = (word) => {
  // Simple check against basic lists first? 
  // Validation is mostly done via the Async tool now, 
  // but this is kept for sync checks if needed.
  return true; 
};

/**
 * Evaluates a guess against the solution
 */
export const evaluateGuess = (guess, solution) => {
  const length = solution.length;
  const guessChars = guess.toUpperCase().split('');
  const solutionChars = solution.toUpperCase().split('');
  const result = new Array(length).fill(LETTER_STATUS.ABSENT);
  
  // Track which solution letters have been "used"
  const solutionUsed = new Array(length).fill(false);

  // 1. Pass: Find Green
  guessChars.forEach((char, i) => {
    if (char === solutionChars[i]) {
      result[i] = LETTER_STATUS.CORRECT;
      solutionUsed[i] = true;
    }
  });

  // 2. Pass: Find Yellow
  guessChars.forEach((char, i) => {
    if (result[i] !== LETTER_STATUS.CORRECT) {
      const foundIndex = solutionChars.findIndex((sChar, sIndex) => {
        return sChar === char && !solutionUsed[sIndex];
      });

      if (foundIndex !== -1) {
        result[i] = LETTER_STATUS.PRESENT;
        solutionUsed[foundIndex] = true;
      }
    }
  });

  return result;
};

/**
 * Load game state from localStorage
 */
export const loadGameState = (mode = 'daily', length = 5) => {
  if (typeof window === 'undefined') return null;
  
  try {
    const key = getUserStorageKey(`wordle_${mode}_${length}_state`);
    const saved = localStorage.getItem(key);
    if (!saved) return null;
    
    const parsed = JSON.parse(saved);
    
    // For daily mode, check date
    if (mode === 'daily') {
        const today = new Date().toDateString();
        if (parsed.date !== today) {
            return null; // Reset for new day
        }
    }
    
    return parsed;
  } catch (e) {
    console.error("Failed to load game state", e);
    return null;
  }
};

/**
 * Save game state to localStorage
 */
export const saveGameState = (guesses, status, solution, mode = 'daily', length = 5) => {
  if (typeof window === 'undefined') return;
  
  const state = {
    date: new Date().toDateString(),
    guesses,
    status, // 'playing', 'won', 'lost'
    solution: mode === 'unlimited' ? solution : undefined // Persist solution for unlimited
  };
  
  const key = getUserStorageKey(`wordle_${mode}_${length}_state`);
  localStorage.setItem(key, JSON.stringify(state));
};
