import { DAILY_WORDS } from './wordLists/daily-2026-01';
import { ALLOWED_WORDS } from './wordLists/allowedWords';

// Constants
export const WORD_LENGTH = 5;
export const MAX_GUESSES = 6;

// Evaluation Status
export const LETTER_STATUS = {
  CORRECT: 'correct',   // Green
  PRESENT: 'present',   // Yellow
  ABSENT: 'absent',     // Gray
};

/**
 * Selects the daily word based on the current date.
 * Uses a fixed start date epoch to ensure consistency across timezones/devices if we used a simple counter,
 * but here we map day of month to index for simplicity in this monthly file structure.
 */
export const getDailyWord = () => {
  const today = new Date();
  // Ensure we are looking at Jan 2026 for this specific file logic, or genericize it later.
  // For this prototype, we just grab the day of the month index (0-based).
  const dayIndex = today.getDate() - 1; 
  
  // Safe fallback if array is short
  const safeIndex = dayIndex % DAILY_WORDS.length;
  return DAILY_WORDS[safeIndex].toUpperCase();
};

/**
 * Validates a word exists in our dictionary
 */
export const isValidWord = (word) => {
  if (word.length !== WORD_LENGTH) return false;
  // Combine lists for validation
  const allWords = new Set([...DAILY_WORDS, ...ALLOWED_WORDS].map(w => w.toUpperCase()));
  return allWords.has(word.toUpperCase());
};

/**
 * Evaluates a guess against the solution
 * tailored to match exact Wordle logic (handling duplicates correctly)
 */
export const evaluateGuess = (guess, solution) => {
  const guessChars = guess.toUpperCase().split('');
  const solutionChars = solution.toUpperCase().split('');
  const result = new Array(WORD_LENGTH).fill(LETTER_STATUS.ABSENT);
  
  // Track which solution letters have been "used" (matched)
  const solutionUsed = new Array(WORD_LENGTH).fill(false);

  // 1. Pass: Find Green (Correct) first
  guessChars.forEach((char, i) => {
    if (char === solutionChars[i]) {
      result[i] = LETTER_STATUS.CORRECT;
      solutionUsed[i] = true;
    }
  });

  // 2. Pass: Find Yellow (Present) for remaining letters
  guessChars.forEach((char, i) => {
    if (result[i] !== LETTER_STATUS.CORRECT) {
      // Look for this char in solution where it hasn't been used yet
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
export const loadGameState = () => {
  if (typeof window === 'undefined') return null;
  
  try {
    const saved = localStorage.getItem('wordle_daily_state');
    if (!saved) return null;
    
    const parsed = JSON.parse(saved);
    const today = new Date().toDateString();
    
    // Check if it's a new day
    if (parsed.date !== today) {
        return null; // Reset for new day
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
export const saveGameState = (guesses, status) => {
  if (typeof window === 'undefined') return;
  
  const state = {
    date: new Date().toDateString(),
    guesses,
    status, // 'playing', 'won', 'lost'
  };
  
  localStorage.setItem('wordle_daily_state', JSON.stringify(state));
};
