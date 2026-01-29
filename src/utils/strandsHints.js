/**
 * STRANDS VISUAL HINT ENGINE
 * 
 * NYT-style progressive tile reveal system.
 * 
 * Core principles:
 * - NEVER locks the player
 * - NEVER requires solving other words
 * - NEVER uses text descriptions
 * - ALWAYS reveals real puzzle information
 * - Grid does the talking
 * 
 * Hint behavior:
 * - Maximum 5 hints per puzzle per day
 * - Each hint reveals ONE tile from the CURRENT word
 * - Completes one word fully before moving to next (S → SW → SWE → SWEA → SWEAT...)
 * - Tiles stay revealed permanently (cumulative)
 * - Player-aware: skips tiles player already locked
 */

import { getUserStorageKey } from '@/utils/storageKeys';

const STORAGE_KEY_PREFIX = 'strands_visual_hints_';
const MAX_HINTS_PER_DAY = 5;

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

/**
 * Hint state structure:
 * {
 *   puzzleId: string,
 *   words: {
 *     [wordUppercase]: {
 *       revealedCount: number  // How many tiles revealed for this word
 *     }
 *   },
 *   currentWordIndex: number,  // Index of word currently being revealed
 *   totalHintsUsed: number
 * }
 */

const loadHintState = (puzzleId) => {
  if (typeof window === 'undefined') return null;
  try {
    const key = getUserStorageKey(STORAGE_KEY_PREFIX + puzzleId);
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
};

const saveHintState = (puzzleId, state) => {
  if (typeof window === 'undefined') return;
  try {
    const key = getUserStorageKey(STORAGE_KEY_PREFIX + puzzleId);
    localStorage.setItem(key, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save hint state:', e);
  }
};

const initializeHintState = (puzzleId, wordList) => {
  const words = {};
  wordList.forEach(w => {
    const upper = w.toUpperCase();
    words[upper] = { revealedCount: 0 };
  });
  
  return {
    puzzleId,
    words,
    currentWordIndex: 0,  // Start with first word
    totalHintsUsed: 0
  };
};

const getOrCreateHintState = (puzzleId, wordList) => {
  const saved = loadHintState(puzzleId);
  if (saved && saved.words) {
    // Ensure all words exist in state
    const updated = { ...saved };
    wordList.forEach(w => {
      const upper = w.toUpperCase();
      if (!updated.words[upper]) {
        updated.words[upper] = { revealedCount: 0 };
      }
    });
    return updated;
  }
  return initializeHintState(puzzleId, wordList);
};

// ============================================================================
// HELPERS
// ============================================================================

const normalizeCell = (cell) => {
  if (Array.isArray(cell)) {
    return { row: cell[0], col: cell[1] };
  }
  return { row: cell.row, col: cell.col };
};

/**
 * Find path for a word in the grid using DFS
 */
const findWordPathInGrid = (grid, word, startR, startC, visited = new Set()) => {
  if (word.length === 0) return [];
  if (grid[startR][startC].toUpperCase() !== word[0].toUpperCase()) return null;
  
  if (word.length === 1) {
    return [[startR, startC]];
  }
  
  const serializePos = (r, c) => `${r},${c}`;
  visited.add(serializePos(startR, startC));
  
  const neighbors = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = startR + dr;
      const nc = startC + dc;
      if (nr >= 0 && nr < grid.length && nc >= 0 && nc < grid[0].length) {
        const key = serializePos(nr, nc);
        if (!visited.has(key)) {
          neighbors.push([nr, nc]);
        }
      }
    }
  }
  
  for (const [nr, nc] of neighbors) {
    const newVisited = new Set(visited);
    const subPath = findWordPathInGrid(grid, word.slice(1), nr, nc, newVisited);
    if (subPath) {
      return [[startR, startC], ...subPath];
    }
  }
  
  return null;
};

const getWordPath = (word, wordsData, grid) => {
  if (!word) return null;
  
  // If wordsData contains {word, path} objects, use them
  if (wordsData && Array.isArray(wordsData)) {
    for (const w of wordsData) {
      if (typeof w === 'object' && w.word && w.path) {
        if (w.word.toUpperCase() === word.toUpperCase()) {
          return w.path;
        }
      }
    }
  }
  
  // Otherwise, search the grid for the word
  if (grid && Array.isArray(grid)) {
    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < grid[r].length; c++) {
        if (grid[r][c].toUpperCase() === word[0].toUpperCase()) {
          const path = findWordPathInGrid(grid, word, r, c);
          if (path) return path;
        }
      }
    }
  }
  
  return null;
};

const extractWordStrings = (wordsData) => {
  return wordsData.map(w => {
    if (typeof w === 'string') return w;
    if (w && typeof w === 'object' && w.word) return w.word;
    return null;
  }).filter(Boolean);
};

// ============================================================================
// MAIN HINT ENGINE
// ============================================================================

/**
 * Get the next hint using round-robin distribution
 * 
 * @param {string} puzzleId - Unique puzzle identifier
 * @param {Array} wordsData - Array of {word, path} objects
 * @param {Array} foundWords - Found words (strings or {word} objects)
 * @param {Set|Array} lockedCells - Cells already locked by player
 * @returns {Object} - { allHintedTiles, newTile, totalHintsUsed }
 */
export const getNextStrandsHint = (puzzleId, wordsData, foundWords = [], grid = null) => {
  // Validate
  if (!puzzleId || !wordsData || wordsData.length === 0) {
    return { allHintedTiles: [], newTile: null, totalHintsUsed: 0 };
  }
  
  const wordStrings = extractWordStrings(wordsData);
  if (wordStrings.length === 0) {
    return { allHintedTiles: [], newTile: null, totalHintsUsed: 0 };
  }
  
  // Get found words as uppercase set
  const foundSet = new Set(
    (foundWords || []).map(fw => 
      (typeof fw === 'string' ? fw : fw?.word || '').toUpperCase()
    ).filter(Boolean)
  );
  
  // Get unfound words in original order
  const unfoundWords = wordStrings.filter(w => !foundSet.has(w.toUpperCase()));
  
  if (unfoundWords.length === 0) {
    // All words found - return existing hints
    const state = getOrCreateHintState(puzzleId, wordStrings);
    return {
      allHintedTiles: getAllHintedTilesInternal(state, wordsData, foundSet, grid),
      newTile: null,
      totalHintsUsed: state.totalHintsUsed
    };
  }
  
  // Load/create state
  let state = getOrCreateHintState(puzzleId, wordStrings);
  
  // Check hint limit (5 per day)
  if (state.totalHintsUsed >= MAX_HINTS_PER_DAY) {
    return {
      allHintedTiles: getAllHintedTilesInternal(state, wordsData, foundSet, grid),
      newTile: null,
      totalHintsUsed: state.totalHintsUsed,
      maxReached: true
    };
  }
  
  // ONE WORD AT A TIME: Find current word being revealed
  const numUnfound = unfoundWords.length;
  let targetWord = null;
  let targetWordIndex = state.currentWordIndex || 0;
  
  // Find next word that can receive a hint (not fully revealed)
  // Start from currentWordIndex, move forward if current is complete
  for (let i = 0; i < numUnfound; i++) {
    const idx = (targetWordIndex + i) % numUnfound;
    const word = unfoundWords[idx];
    const wordUpper = word.toUpperCase();
    const path = getWordPath(word, wordsData, grid);
    
    if (!path) continue;
    
    const revealed = state.words[wordUpper]?.revealedCount || 0;
    
    // Can still reveal more tiles?
    if (revealed < path.length) {
      targetWord = word;
      targetWordIndex = idx;
      break;
    }
  }
  
  // No more hints available
  if (!targetWord) {
    return {
      allHintedTiles: getAllHintedTilesInternal(state, wordsData, foundSet),
      newTile: null,
      totalHintsUsed: state.totalHintsUsed
    };
  }
  
  // Get the path for target word
  const targetPath = getWordPath(targetWord, wordsData, grid);
  const targetUpper = targetWord.toUpperCase();
  const currentRevealed = state.words[targetUpper]?.revealedCount || 0;
  
  // Reveal next tile
  const nextTileIndex = currentRevealed;
  const nextCell = normalizeCell(targetPath[nextTileIndex]);
  const newTile = {
    row: nextCell.row,
    col: nextCell.col,
    letter: targetWord[nextTileIndex]?.toUpperCase() || '?'
  };
  
  // Update state
  state = {
    ...state,
    words: {
      ...state.words,
      [targetUpper]: {
        revealedCount: currentRevealed + 1
      }
    },
    // If word is now complete, move to next word
    currentWordIndex: (currentRevealed + 1 >= targetPath.length) 
      ? (targetWordIndex + 1) % numUnfound 
      : targetWordIndex,
    totalHintsUsed: state.totalHintsUsed + 1
  };
  
  // Persist
  saveHintState(puzzleId, state);
  
  // Return all hinted tiles (cumulative)
  return {
    allHintedTiles: getAllHintedTilesInternal(state, wordsData, foundSet, grid),
    newTile,
    totalHintsUsed: state.totalHintsUsed
  };
};

/**
 * Get all currently hinted tiles (for display on load)
 */
const getAllHintedTilesInternal = (state, wordsData, foundSet, grid) => {
  const tiles = [];
  
  for (const [wordUpper, wordState] of Object.entries(state.words)) {
    // Skip found words
    if (foundSet.has(wordUpper)) continue;
    
    const revealed = wordState.revealedCount || 0;
    if (revealed === 0) continue;
    
    // Find the word or get its path
    let wordPath = null;
    let actualWord = wordUpper;
    
    const wordData = wordsData.find(w => 
      (typeof w === 'object' && w.word?.toUpperCase() === wordUpper) ||
      (typeof w === 'string' && w.toUpperCase() === wordUpper)
    );
    
    if (typeof wordData === 'object' && wordData.path) {
      wordPath = wordData.path;
      actualWord = wordData.word;
    } else if (typeof wordData === 'string' || wordUpper) {
      wordPath = getWordPath(wordUpper, wordsData, grid);
      actualWord = typeof wordData === 'string' ? wordData : wordUpper;
    }
    
    if (!wordPath) continue;
    
    // Add revealed tiles
    for (let i = 0; i < Math.min(revealed, wordPath.length); i++) {
      const cell = normalizeCell(wordPath[i]);
      tiles.push({
        row: cell.row,
        col: cell.col,
        letter: actualWord[i]?.toUpperCase() || '?'
      });
    }
  }
  
  return tiles;
};

/**
 * Get all hinted tiles for initial display
 */
export const getAllHintedTiles = (puzzleId, wordsData, foundWords = [], grid = null) => {
  if (!puzzleId || !wordsData || wordsData.length === 0) return [];
  
  const wordStrings = extractWordStrings(wordsData);
  if (wordStrings.length === 0) return [];
  
  const state = getOrCreateHintState(puzzleId, wordStrings);
  
  const foundSet = new Set(
    (foundWords || []).map(fw => 
      (typeof fw === 'string' ? fw : fw?.word || '').toUpperCase()
    ).filter(Boolean)
  );
  
  return getAllHintedTilesInternal(state, wordsData, foundSet, grid);
};

/**
 * Get hint count for display
 */
export const getStrandsHintCount = (puzzleId, wordsData) => {
  if (!puzzleId || !wordsData) return 0;
  
  const wordStrings = extractWordStrings(wordsData);
  const state = getOrCreateHintState(puzzleId, wordStrings);
  
  return state.totalHintsUsed || 0;
};

/**
 * Get button text - simple, no locking
 */
export const getStrandsHintButtonText = (puzzleId, wordsData, foundWords = [], grid = null) => {
  if (!wordsData || wordsData.length === 0) return 'Hint';
  
  const wordStrings = extractWordStrings(wordsData);
  const state = getOrCreateHintState(puzzleId, wordStrings);
  
  const foundSet = new Set(
    (foundWords || []).map(fw => 
      (typeof fw === 'string' ? fw : fw?.word || '').toUpperCase()
    ).filter(Boolean)
  );
  
  // Check if any hints remain
  const unfoundWords = wordStrings.filter(w => !foundSet.has(w.toUpperCase()));
  
  let totalAvailable = 0;
  let totalRevealed = 0;
  
  for (const word of unfoundWords) {
    const path = getWordPath(word, wordsData, grid);
    if (path) {
      totalAvailable += path.length;
      totalRevealed += state.words[word.toUpperCase()]?.revealedCount || 0;
    }
  }
  
  if (totalRevealed >= totalAvailable) {
    return 'All Revealed';
  }
  
  const count = state.totalHintsUsed || 0;
  if (count >= MAX_HINTS_PER_DAY) {
    return `Hint Limit (${MAX_HINTS_PER_DAY}/${MAX_HINTS_PER_DAY})`;
  }
  return count > 0 ? `Hint (${count}/${MAX_HINTS_PER_DAY})` : 'Hint';
};

/**
 * Reset hints for a puzzle
 */
export const resetStrandsHints = (puzzleId) => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(getUserStorageKey(STORAGE_KEY_PREFIX + puzzleId));
};

// ============================================================================
// EXPORTS
// ============================================================================

const strandsHints = {
  getNextStrandsHint,
  getAllHintedTiles,
  getStrandsHintCount,
  getStrandsHintButtonText,
  resetStrandsHints
};

export default strandsHints;
