import { DAILY_WORDS } from './wordLists/daily-2026-01';
import { ALLOWED_WORDS } from './wordLists/allowedWords';
import { WORDS_4 } from './wordLists/words4';
import { WORDS_6 } from './wordLists/words6';

// Constants
export const DEFAULT_WORD_LENGTH = 5;
export const MAX_GUESSES = 6;

// Evaluation Status
export const LETTER_STATUS = {
  CORRECT: 'correct',   // Green
  PRESENT: 'present',   // Yellow
  ABSENT: 'absent',     // Gray
};

/**
 * Selects the daily word based on the current date.
 * Currently supports 5-letter only for Daily mode.
 */
export const getDailyWord = () => {
  const today = new Date();
  const dayIndex = today.getDate() - 1; 
  const safeIndex = dayIndex % DAILY_WORDS.length;
  return DAILY_WORDS[safeIndex].toUpperCase();
};

/**
 * Selects a random word for Unlimited mode
 */
export const getRandomWord = (length = 5) => {
  let list = ALLOWED_WORDS;
  if (length === 4) list = WORDS_4;
  if (length === 6) list = WORDS_6;

  const index = Math.floor(Math.random() * list.length);
  return list[index].toUpperCase();
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
    const key = `wordle_${mode}_${length}_state`;
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
  
  const key = `wordle_${mode}_${length}_state`;
  localStorage.setItem(key, JSON.stringify(state));
};
