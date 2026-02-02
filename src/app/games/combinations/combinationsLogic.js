/**
 * Combinations Game Logic
 * A fragment-based word construction game where players combine
 * word fragments to form valid English words and reach a target score
 */

import { COMBINATIONS_PUZZLES_JAN_2026 } from './puzzles/combinations-2026-01';
import { COMBINATIONS_PUZZLES_FEB_2026 } from './puzzles/combinations-2026-02';
import { getActiveTheme, getGameTheme } from '@/utils/themeEngine';
import { isWordInLocalDictionary } from '@/utils/localDictionary';
import { getUserStorageKey } from '@/utils/storageKeys';

// Merge all puzzles
const ALL_COMBINATIONS_PUZZLES = [...COMBINATIONS_PUZZLES_JAN_2026, ...COMBINATIONS_PUZZLES_FEB_2026];

// Scoring constants
export const FRAGMENT_BASE_SCORE = 10;
export const CHAIN_MULTIPLIER = 1.5; // Multiplier for each additional fragment
export const BONUS_WORD_SCORE = 25;
export const MIN_WORD_LENGTH = 3;

/**
 * Get today's puzzle
 */
export const getTodaysPuzzle = () => {
  const today = new Date();
  // Use UTC date for consistent global puzzle rotation
  const dateString = today.toISOString().split('T')[0];
  
  // Check for themed puzzle first
  const theme = getGameTheme('combinations');
  if (theme && theme.puzzleSet) {
    const themedPuzzle = getThemedPuzzle(theme.puzzleSet, dateString);
    if (themedPuzzle) return themedPuzzle;
  }
  
  // Find puzzle for today
  const puzzle = ALL_COMBINATIONS_PUZZLES.find(p => p.date === dateString);
  
  if (puzzle) {
    return puzzle;
  }
  
  // Fallback to first puzzle if today's not found
  return COMBINATIONS_PUZZLES_JAN_2026[0];
};

/**
 * Get puzzle by date
 */
export const getPuzzleByDate = (dateString) => {
  return ALL_COMBINATIONS_PUZZLES.find(p => p.date === dateString) || null;
};

/**
 * Get a random puzzle for unlimited mode
 */
export const getRandomPuzzle = () => {
  const randomIndex = Math.floor(Math.random() * ALL_COMBINATIONS_PUZZLES.length);
  return ALL_COMBINATIONS_PUZZLES[randomIndex];
};

/**
 * Get themed puzzle
 */
const getThemedPuzzle = (themeId, dateString) => {
  // Would import themed puzzles here when available
  return null;
};

/**
 * Initialize game state
 */
export const initializeGame = (puzzle) => {
  return {
    date: puzzle.date,
    fragments: puzzle.fragments,
    targetScore: puzzle.targetScore,
    bonusWords: puzzle.bonusWords || [],
    currentSelection: [], // Indices of selected fragments
    score: 0,
    wordsFound: [],
    bonusWordsFound: [],
    maxComboLength: 0,
    gameStatus: 'playing', // 'playing', 'won'
  };
};

/**
 * Calculate score for a word based on fragments used
 */
export const calculateWordScore = (fragmentCount, isBonus = false) => {
  // Base score increases with chain length
  let score = FRAGMENT_BASE_SCORE;
  for (let i = 1; i < fragmentCount; i++) {
    score += Math.floor(FRAGMENT_BASE_SCORE * Math.pow(CHAIN_MULTIPLIER, i));
  }
  
  // Add bonus if it's a bonus word
  if (isBonus) {
    score += BONUS_WORD_SCORE;
  }
  
  return score;
};

/**
 * Build word from selected fragment indices
 */
export const buildWord = (fragments, selection) => {
  return selection.map(idx => fragments[idx]).join('');
};

/**
 * Validate if a word can be formed from consecutive fragment selection
 * and if it's a valid English word
 */
export const validateWord = async (word, fragments, selection) => {
  // Word must be at least minimum length
  if (word.length < MIN_WORD_LENGTH) {
    return { valid: false, reason: 'too-short' };
  }
  
  // Build word from selected fragments
  const builtWord = buildWord(fragments, selection);
  if (builtWord.toLowerCase() !== word.toLowerCase()) {
    return { valid: false, reason: 'mismatch' };
  }
  
  // Check if word is valid (use local dictionary first)
  const isValid = isWordInLocalDictionary(word.toLowerCase());
  
  if (!isValid) {
    // Try API validation as fallback
    try {
      const response = await fetch('/api/word-validation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: word.toLowerCase() }),
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.valid) {
          return { valid: true };
        }
      }
    } catch (error) {
      console.error('Word validation error:', error);
    }
    
    return { valid: false, reason: 'not-a-word' };
  }
  
  return { valid: true };
};

/**
 * Synchronous word validation using local dictionary only
 */
export const validateWordSync = (word) => {
  if (word.length < MIN_WORD_LENGTH) {
    return false;
  }
  return isWordInLocalDictionary(word.toLowerCase());
};

/**
 * Select/deselect a fragment
 */
export const toggleFragment = (gameState, fragmentIndex) => {
  const newSelection = [...gameState.currentSelection];
  const existingIndex = newSelection.indexOf(fragmentIndex);
  
  if (existingIndex !== -1) {
    // Deselect - remove this and all subsequent selections
    newSelection.splice(existingIndex);
  } else {
    // Select - add to end
    newSelection.push(fragmentIndex);
  }
  
  return {
    ...gameState,
    currentSelection: newSelection,
  };
};

/**
 * Clear current selection
 */
export const clearSelection = (gameState) => {
  return {
    ...gameState,
    currentSelection: [],
  };
};

/**
 * Submit current word
 */
export const submitWord = (gameState, puzzle) => {
  const { fragments, currentSelection, wordsFound, bonusWordsFound, score } = gameState;
  
  if (currentSelection.length === 0) {
    return { ...gameState, error: 'No fragments selected' };
  }
  
  const word = buildWord(fragments, currentSelection).toLowerCase();
  
  // Check if word was already found
  if (wordsFound.includes(word)) {
    return { ...gameState, error: 'Word already found', currentSelection: [] };
  }
  
  // Validate word
  if (!validateWordSync(word)) {
    return { ...gameState, error: 'Not a valid word', currentSelection: [] };
  }
  
  // Check if it's a bonus word
  const isBonus = puzzle.bonusWords.map(w => w.toLowerCase()).includes(word);
  
  // Calculate score
  const wordScore = calculateWordScore(currentSelection.length, isBonus);
  const newScore = score + wordScore;
  
  // Update words found
  const newWordsFound = [...wordsFound, word];
  const newBonusWordsFound = isBonus 
    ? [...bonusWordsFound, word] 
    : bonusWordsFound;
  
  // Update max combo length
  const newMaxCombo = Math.max(gameState.maxComboLength, currentSelection.length);
  
  // Check if target reached
  const targetReached = newScore >= puzzle.targetScore;
  
  return {
    ...gameState,
    score: newScore,
    wordsFound: newWordsFound,
    bonusWordsFound: newBonusWordsFound,
    maxComboLength: newMaxCombo,
    currentSelection: [],
    gameStatus: targetReached ? 'won' : 'playing',
    lastWordScore: wordScore,
    lastWord: word,
    error: null,
  };
};

/**
 * Get all possible words from fragments (for hint system)
 */
export const findPossibleWords = (fragments) => {
  const possibleWords = new Set();
  
  // Generate all combinations of 2+ consecutive fragments
  const generateCombinations = (current, startIdx) => {
    const word = current.join('').toLowerCase();
    if (word.length >= MIN_WORD_LENGTH && validateWordSync(word)) {
      possibleWords.add(word);
    }
    
    // Try adding more fragments
    for (let i = startIdx; i < fragments.length; i++) {
      generateCombinations([...current, fragments[i]], i + 1);
    }
  };
  
  for (let i = 0; i < fragments.length; i++) {
    generateCombinations([fragments[i]], i + 1);
  }
  
  return Array.from(possibleWords);
};

/**
 * Generate share text for the game result
 */
export const generateShareText = (gameState, puzzle) => {
  const lines = ['The Daily Thread – Combinations'];
  
  lines.push(`Score: ${gameState.score}`);
  
  if (gameState.maxComboLength >= 4) {
    lines.push(`🔥 ${gameState.maxComboLength}-fragment combo`);
  }
  
  if (gameState.bonusWordsFound.length > 0) {
    lines.push(`⭐ ${gameState.bonusWordsFound.length} bonus word${gameState.bonusWordsFound.length > 1 ? 's' : ''}`);
  }
  
  lines.push(`Words: ${gameState.wordsFound.length}`);
  
  return lines.join('\n');
};

// Local storage functions
const STORAGE_KEY = 'combinationsGameState';
const STATS_KEY = 'combinationsStats';

export const loadGameState = () => {
  if (typeof window === 'undefined') return null;
  try {
    const saved = localStorage.getItem(getUserStorageKey(STORAGE_KEY));
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
};

export const saveGameState = (state) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(getUserStorageKey(STORAGE_KEY), JSON.stringify(state));
  } catch {
    // Ignore storage errors
  }
};

export const loadStats = () => {
  if (typeof window === 'undefined') return getDefaultStats();
  try {
    const saved = localStorage.getItem(getUserStorageKey(STATS_KEY));
    return saved ? JSON.parse(saved) : getDefaultStats();
  } catch {
    return getDefaultStats();
  }
};

export const saveStats = (stats) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(getUserStorageKey(STATS_KEY), JSON.stringify(stats));
  } catch {
    // Ignore storage errors
  }
};

export const getDefaultStats = () => ({
  gamesPlayed: 0,
  gamesWon: 0,
  currentStreak: 0,
  longestStreak: 0,
  totalScore: 0,
  averageScore: 0,
  maxComboLength: 0,
  totalBonusWords: 0,
  lastPlayedDate: null,
});

export const updateStats = (stats, won, score, maxCombo, bonusWords) => {
  const today = new Date().toISOString().split('T')[0];
  const newStats = { ...stats };
  
  newStats.gamesPlayed++;
  newStats.totalScore += score;
  newStats.averageScore = Math.round(newStats.totalScore / newStats.gamesPlayed);
  newStats.maxComboLength = Math.max(newStats.maxComboLength, maxCombo);
  newStats.totalBonusWords += bonusWords;
  
  if (won) {
    newStats.gamesWon++;
    
    // Update streak
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    if (newStats.lastPlayedDate === yesterdayStr) {
      newStats.currentStreak++;
    } else if (newStats.lastPlayedDate !== today) {
      newStats.currentStreak = 1;
    }
    
    if (newStats.currentStreak > newStats.longestStreak) {
      newStats.longestStreak = newStats.currentStreak;
    }
  } else {
    newStats.currentStreak = 0;
  }
  
  newStats.lastPlayedDate = today;
  
  return newStats;
};
