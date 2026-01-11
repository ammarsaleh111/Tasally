import { CONNECTIONS_PUZZLES_JAN_2026 } from './puzzles/connections-2026-01';
import { CONNECTIONS_PUZZLES_FEB_2026 } from './puzzles/connections-2026-02';

// Merge January and February puzzles
const ALL_CONNECTIONS_PUZZLES = [...CONNECTIONS_PUZZLES_JAN_2026, ...CONNECTIONS_PUZZLES_FEB_2026];

export const MAX_MISTAKES = 4;
export const WORDS_PER_GROUP = 4;
export const TOTAL_GROUPS = 4;
export const TOTAL_WORDS = 16;

// Group difficulty colors
export const GROUP_COLORS = {
  yellow: { bg: '#f9df6d', text: '#000000', name: 'Straightforward' },
  green: { bg: '#a0c35a', text: '#000000', name: 'Moderate' },
  blue: { bg: '#b0c4ef', text: '#000000', name: 'Tricky' },
  purple: { bg: '#ba81c5', text: '#ffffff', name: 'Challenging' }
};

/**
 * Get today's puzzle
 */
export const getTodaysPuzzle = () => {
  const today = new Date();
  const dateString = today.toISOString().split('T')[0];
  
  // Find puzzle for today
  const puzzle = ALL_CONNECTIONS_PUZZLES.find(p => p.date === dateString);
  
  if (puzzle) {
    return puzzle;
  }
  
  // Fallback to first puzzle if today's not found
  return CONNECTIONS_PUZZLES_JAN_2026[0];
};

/**
 * Shuffle array (Fisher-Yates)
 */
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

/**
 * Get shuffled words for a puzzle
 */
export const getShuffledWords = (puzzle) => {
  return shuffleArray(puzzle.words);
};

/**
 * Check if selected words form a valid group
 * @param {string[]} selectedWords - 4 words selected by user
 * @param {object} puzzle - Current puzzle
 * @returns {object|null} - Group object if valid, null otherwise
 */
export const checkGroup = (selectedWords, puzzle) => {
  if (selectedWords.length !== WORDS_PER_GROUP) {
    return null;
  }
  
  // Check each group
  for (const group of puzzle.groups) {
    const groupWords = group.words.map(w => w.toUpperCase());
    const selectedUpper = selectedWords.map(w => w.toUpperCase());
    
    // Check if all selected words are in this group
    const allMatch = selectedUpper.every(word => groupWords.includes(word));
    
    if (allMatch && selectedUpper.length === groupWords.length) {
      return group;
    }
  }
  
  return null;
};

/**
 * Check if selection is "one away" (3 out of 4 correct)
 */
export const isOneAway = (selectedWords, puzzle) => {
  if (selectedWords.length !== WORDS_PER_GROUP) {
    return false;
  }
  
  for (const group of puzzle.groups) {
    const groupWords = group.words.map(w => w.toUpperCase());
    const selectedUpper = selectedWords.map(w => w.toUpperCase());
    
    const matchCount = selectedUpper.filter(word => groupWords.includes(word)).length;
    
    if (matchCount === 3) {
      return true;
    }
  }
  
  return false;
};

/**
 * Load game state from localStorage
 */
export const loadGameState = () => {
  if (typeof window === 'undefined') return null;
  
  try {
    const saved = localStorage.getItem('connections_state');
    if (!saved) return null;
    
    const state = JSON.parse(saved);
    
    // Check if it's today's puzzle
    const today = new Date().toISOString().split('T')[0];
    if (state.date !== today) {
      return null; // Old puzzle, start fresh
    }
    
    return state;
  } catch (error) {
    console.error('Failed to load game state:', error);
    return null;
  }
};

/**
 * Save game state to localStorage
 */
export const saveGameState = (state) => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem('connections_state', JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save game state:', error);
  }
};

/**
 * Initialize new game state
 */
export const initializeGame = (puzzle) => {
  return {
    date: puzzle.date,
    solvedGroups: [],
    mistakes: 0,
    gameStatus: 'playing', // 'playing' | 'won' | 'lost'
    selectedWords: [],
    shuffledWords: getShuffledWords(puzzle)
  };
};

/**
 * Get default stats structure
 */
export const getDefaultStats = () => {
  return {
    played: 0,
    won: 0,
    currentStreak: 0,
    maxStreak: 0,
    perfectGames: 0, // Games won with 0 mistakes
    lastPlayed: null
  };
};

/**
 * Load stats from localStorage
 */
export const loadStats = () => {
  if (typeof window === 'undefined') return getDefaultStats();
  
  try {
    const saved = localStorage.getItem('ammar-times-connections-stats');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error('Error loading stats:', error);
  }
  return getDefaultStats();
};

/**
 * Save stats to localStorage
 */
export const saveStats = (stats) => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem('ammar-times-connections-stats', JSON.stringify(stats));
  } catch (error) {
    console.error('Error saving stats:', error);
  }
};

/**
 * Update stats after a game
 */
export const updateStats = (currentStats, won, mistakes) => {
  const today = new Date().toISOString().split('T')[0];
  const lastPlayed = currentStats.lastPlayed;
  
  const newStats = {
    played: currentStats.played + 1,
    won: currentStats.won + (won ? 1 : 0),
    perfectGames: currentStats.perfectGames + (won && mistakes === 0 ? 1 : 0),
    lastPlayed: today
  };
  
  // Calculate streak
  if (won) {
    if (lastPlayed === today) {
      // Same day, don't increment
      newStats.currentStreak = currentStats.currentStreak;
    } else {
      newStats.currentStreak = currentStats.currentStreak + 1;
    }
  } else {
    newStats.currentStreak = 0;
  }
  
  newStats.maxStreak = Math.max(currentStats.maxStreak, newStats.currentStreak);
  
  return newStats;
};
