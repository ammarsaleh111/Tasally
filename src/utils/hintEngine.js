/**
 * PROGRESSIVE HINT ENGINE
 * 
 * Game-agnostic hint system that:
 * - Tracks hint usage per puzzle
 * - Manages per-word hint progression
 * - Prevents hint repetition
 * - Persists state across sessions
 * - Integrates with stats
 * 
 * Core Principle: A hint is a stateful conversation, not a random message.
 */

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================

/**
 * Hint ladder level for a specific word
 * @typedef {Object} WordHintState
 * @property {string} word - The target word
 * @property {number} currentLevel - Current hint level (0 = no hints given)
 * @property {Object} revealed - What information has been revealed
 */

/**
 * Complete hint state for a puzzle
 * @typedef {Object} PuzzleHintState
 * @property {string} puzzleId - Unique puzzle identifier
 * @property {Object<string, WordHintState>} words - Hint state per word
 * @property {number} totalHintsUsed - Total hints requested
 * @property {number} lastHintTime - Timestamp of last hint
 */

const STORAGE_PREFIX = 'hint_state_';

// ============================================================================
// HINT STATE MANAGEMENT
// ============================================================================

/**
 * Load hint state for a specific puzzle
 * @param {string} puzzleId - Unique puzzle identifier (e.g., "spelling-2026-01-12")
 * @returns {PuzzleHintState|null} - Saved state or null
 */
export const loadHintState = (puzzleId) => {
  if (typeof window === 'undefined') return null;
  
  try {
    const key = STORAGE_PREFIX + puzzleId;
    const saved = localStorage.getItem(key);
    
    if (!saved) return null;
    
    return JSON.parse(saved);
  } catch (error) {
    console.error('Failed to load hint state:', error);
    return null;
  }
};

/**
 * Save hint state for a puzzle
 * @param {string} puzzleId - Unique puzzle identifier
 * @param {PuzzleHintState} state - State to save
 */
export const saveHintState = (puzzleId, state) => {
  if (typeof window === 'undefined') return;
  
  try {
    const key = STORAGE_PREFIX + puzzleId;
    localStorage.setItem(key, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save hint state:', error);
  }
};

/**
 * Initialize hint state for a new puzzle
 * @param {string} puzzleId - Unique puzzle identifier
 * @param {string[]} targetWords - All words in the puzzle
 * @returns {PuzzleHintState}
 */
export const initializeHintState = (puzzleId, targetWords) => {
  const words = {};
  
  // Filter out undefined/null/empty values
  const validWords = (targetWords || []).filter(word => 
    word && typeof word === 'string' && word.trim().length > 0
  );
  
  validWords.forEach(word => {
    const upperWord = word.toUpperCase();
    words[upperWord] = {
      word: upperWord,
      currentLevel: 0,
      revealed: {}
    };
  });
  
  return {
    puzzleId,
    words,
    totalHintsUsed: 0,
    lastHintTime: null
  };
};

/**
 * Get or initialize hint state
 * @param {string} puzzleId - Unique puzzle identifier
 * @param {string[]} targetWords - All words in the puzzle
 * @returns {PuzzleHintState}
 */
export const getHintState = (puzzleId, targetWords) => {
  if (!puzzleId || !targetWords || targetWords.length === 0) {
    return initializeHintState(puzzleId, []);
  }
  
  const saved = loadHintState(puzzleId);
  
  if (saved) {
    // Verify all words are present (in case puzzle changed)
    const validWords = targetWords.filter(w => w && typeof w === 'string');
    const hasAllWords = validWords.every(w => 
      saved.words[w.toUpperCase()]
    );
    
    if (hasAllWords) {
      return saved;
    }
  }
  
  // Initialize new state
  return initializeHintState(puzzleId, targetWords);
};

// ============================================================================
// HINT SELECTION LOGIC
// ============================================================================

/**
 * Find the word that needs the next hint
 * Strategy: Distribute hints evenly across unfound words
 * 
 * @param {PuzzleHintState} hintState - Current hint state
 * @param {string[]} foundWords - Words already found by player
 * @param {number} maxLevel - Maximum hint level for the game
 * @returns {string|null} - Word to give hint for, or null if all exhausted
 */
export const selectWordForNextHint = (hintState, foundWords, maxLevel) => {
  const foundSet = new Set(foundWords.map(w => w.toUpperCase()));
  
  // Get unfound words with their hint levels
  const unfoundWords = Object.values(hintState.words)
    .filter(wordState => !foundSet.has(wordState.word));
    // Note: Do NOT filter maxLevel here because maxLevel might vary per word type
  
  if (unfoundWords.length === 0) {
    return null; // All words found
  }
  
  // POLICY CHANGE: Prioritize currently hinted words over new ones
  // We want to finish revealing one word before starting another
  
  // 1. First look for words that are started but not finished (0 < level < max)
  // For uniform maxLevel systems:
  const startedWords = unfoundWords.filter(ws => 
    ws.currentLevel > 0 && ws.currentLevel < (typeof maxLevel === 'number' ? maxLevel : 100)
  );
  
  if (startedWords.length > 0) {
    // Return the one with highest level (most progress) or just the first one
    startedWords.sort((a, b) => b.currentLevel - a.currentLevel);
    return startedWords[0].word;
  }
  
  // 2. If no started words, pick a fresh word (level 0)
  const freshWords = unfoundWords.filter(ws => ws.currentLevel === 0);
  
  if (freshWords.length > 0) {
    // Sort alphabetically or randomized
    freshWords.sort((a, b) => a.word.localeCompare(b.word));
    return freshWords[0].word;
  }
  
  // 3. Fallback: partially revealed words that might have been filtered by approximate maxLevel
  // Just return any unfound word that isn't fully exhausted if applicable
  return unfoundWords[0].word;
};

/**
 * Record that a hint was used
 * @param {PuzzleHintState} hintState - Current state
 * @param {string} word - Word the hint was for
 * @returns {PuzzleHintState} - Updated state
 */
export const recordHintUsage = (hintState, word) => {
  const wordKey = word.toUpperCase();
  
  if (!hintState.words[wordKey]) {
    console.warn(`Word "${word}" not found in hint state`);
    return hintState;
  }
  
  return {
    ...hintState,
    words: {
      ...hintState.words,
      [wordKey]: {
        ...hintState.words[wordKey],
        currentLevel: hintState.words[wordKey].currentLevel + 1
      }
    },
    totalHintsUsed: hintState.totalHintsUsed + 1,
    lastHintTime: Date.now()
  };
};

/**
 * Get hint level for a specific word
 * @param {PuzzleHintState} hintState - Current state
 * @param {string} word - Target word
 * @returns {number} - Current hint level (0 = no hints)
 */
export const getWordHintLevel = (hintState, word) => {
  const wordKey = word.toUpperCase();
  return hintState.words[wordKey]?.currentLevel || 0;
};

/**
 * Mark specific information as revealed for a word
 * @param {PuzzleHintState} hintState - Current state
 * @param {string} word - Target word
 * @param {string} key - What was revealed (e.g., 'firstLetter', 'length')
 * @returns {PuzzleHintState} - Updated state
 */
export const markRevealed = (hintState, word, key) => {
  const wordKey = word.toUpperCase();
  
  if (!hintState.words[wordKey]) {
    return hintState;
  }
  
  return {
    ...hintState,
    words: {
      ...hintState.words,
      [wordKey]: {
        ...hintState.words[wordKey],
        revealed: {
          ...hintState.words[wordKey].revealed,
          [key]: true
        }
      }
    }
  };
};

/**
 * Check if specific information was already revealed
 * @param {PuzzleHintState} hintState - Current state
 * @param {string} word - Target word
 * @param {string} key - What to check
 * @returns {boolean}
 */
export const isRevealed = (hintState, word, key) => {
  const wordKey = word.toUpperCase();
  return hintState.words[wordKey]?.revealed[key] || false;
};

// ============================================================================
// HINT QUALITY CALCULATION
// ============================================================================

/**
 * Calculate hint penalty for stats/scoring
 * More hints = higher penalty
 * 
 * @param {number} hintsUsed - Total hints used in puzzle
 * @param {number} totalWords - Total words in puzzle
 * @returns {number} - Penalty percentage (0-100)
 */
export const calculateHintPenalty = (hintsUsed, totalWords) => {
  if (hintsUsed === 0) return 0;
  if (totalWords === 0) return 100;
  
  // Each hint is ~5% penalty, capped at 50%
  const basePenalty = Math.min(hintsUsed * 5, 50);
  
  // Scale by ratio to total words
  const ratio = hintsUsed / totalWords;
  const scaledPenalty = basePenalty * Math.min(ratio, 1);
  
  return Math.round(scaledPenalty);
};

/**
 * Get hint usage quality rating
 * @param {number} hintsUsed - Total hints used
 * @param {number} totalWords - Total words in puzzle
 * @returns {string} - Rating: "Perfect", "Great", "Good", "Fair", "Heavy"
 */
export const getHintUsageRating = (hintsUsed, totalWords) => {
  if (hintsUsed === 0) return 'Perfect';
  
  const ratio = hintsUsed / totalWords;
  
  if (ratio < 0.1) return 'Great';
  if (ratio < 0.25) return 'Good';
  if (ratio < 0.5) return 'Fair';
  return 'Heavy';
};

// ============================================================================
// HINT DISTRIBUTION ANALYTICS
// ============================================================================

/**
 * Get summary of hint usage for a puzzle
 * @param {PuzzleHintState} hintState - Current state
 * @returns {Object} - Usage statistics
 */
export const getHintUsageSummary = (hintState) => {
  const wordStates = Object.values(hintState.words);
  
  const totalWords = wordStates.length;
  const wordsWithHints = wordStates.filter(w => w.currentLevel > 0).length;
  const avgHintLevel = wordStates.reduce((sum, w) => sum + w.currentLevel, 0) / totalWords;
  
  const levelDistribution = {};
  wordStates.forEach(w => {
    levelDistribution[w.currentLevel] = (levelDistribution[w.currentLevel] || 0) + 1;
  });
  
  return {
    totalHintsUsed: hintState.totalHintsUsed,
    totalWords,
    wordsWithHints,
    wordsWithoutHints: totalWords - wordsWithHints,
    avgHintLevel: avgHintLevel.toFixed(2),
    levelDistribution,
    penalty: calculateHintPenalty(hintState.totalHintsUsed, totalWords),
    rating: getHintUsageRating(hintState.totalHintsUsed, totalWords)
  };
};

// ============================================================================
// EXPORTS
// ============================================================================

const hintEngine = {
  // State management
  loadHintState,
  saveHintState,
  initializeHintState,
  getHintState,
  
  // Hint selection
  selectWordForNextHint,
  recordHintUsage,
  getWordHintLevel,
  markRevealed,
  isRevealed,
  
  // Analytics
  calculateHintPenalty,
  getHintUsageRating,
  getHintUsageSummary
};

export default hintEngine;
