/**
 * Crossword Logic v2
 * 
 * Main API for crossword puzzle generation, validation, and game state management.
 * Uses the crossword engine for core functionality and word dictionary for clues.
 */

import {
  GRID_TEMPLATES,
  getTemplateForDate,
  detectSlots,
  getSlotCells,
  findIntersectingSlots,
  canPlaceWord,
  placeWord,
  validatePuzzle,
  initializeTimer,
  saveTimerState,
  loadTimerState,
  calculateElapsedTime,
  pauseTimer,
  resumeTimer,
  formatTime as formatTimeEngine,
} from './crosswordEngine';
import { getUserStorageKey } from '@/utils/storageKeys';

import {
  WORD_CLUES,
  getWordsByLength,
  getClueForWord,
} from './wordDictionary';

export const GRID_SIZE = 5;

// ============================================================================
// PUZZLE GENERATION
// ============================================================================

/**
 * Shuffle array (Fisher-Yates)
 */
const shuffleArray = (array, seed) => {
  const arr = [...array];
  // Use seeded random for reproducibility
  let m = arr.length;
  const random = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  
  while (m) {
    const i = Math.floor(random() * m--);
    [arr[m], arr[i]] = [arr[i], arr[m]];
  }
  return arr;
};

/**
 * Get a deterministic seed from a date string
 */
const dateToSeed = (dateString) => {
  let hash = 0;
  for (let i = 0; i < dateString.length; i++) {
    const char = dateString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
};

/**
 * Generate a complete crossword puzzle for a given date
 */
export const generatePuzzleForDate = (dateString) => {
  const seed = dateToSeed(dateString);
  const template = getTemplateForDate(dateString);
  const slots = detectSlots(template);
  
  if (slots.length === 0) {
    throw new Error(`No valid slots detected for template ${template.id}`);
  }
  
  const wordsByLength = getWordsByLength();
  const placement = new Map(); // slotId -> word
  const constraints = new Map(); // "row,col" -> letter
  const usedWords = new Set(); // Prevent duplicate words
  
  // Sort slots by number of intersections (most constrained first)
  const slotsWithIntersections = slots.map(slot => ({
    slot,
    intersections: findIntersectingSlots(slot, slots, template).length
  }));
  slotsWithIntersections.sort((a, b) => b.intersections - a.intersections);
  const sortedSlots = slotsWithIntersections.map(s => s.slot);
  
  /**
   * Backtracking solver
   */
  const solve = (slotIndex, currentConstraints, currentUsedWords) => {
    if (slotIndex >= sortedSlots.length) {
      return true; // All slots filled!
    }
    
    const slot = sortedSlots[slotIndex];
    const availableWords = wordsByLength[slot.length] || [];
    
    if (availableWords.length === 0) {
      return false; // No words of this length
    }
    
    // Shuffle words for variety (seeded for determinism)
    const shuffledWords = shuffleArray(availableWords, seed + slotIndex);
    
    for (const word of shuffledWords) {
      // Skip if word already used
      if (currentUsedWords.has(word)) continue;
      
      // Check if word fits constraints
      if (!canPlaceWord(word, slot, currentConstraints, template)) continue;
      
      // Place word
      const newConstraints = placeWord(word, slot, currentConstraints, template);
      const newUsedWords = new Set(currentUsedWords);
      newUsedWords.add(word);
      placement.set(slot.id, word);
      
      // Recurse
      if (solve(slotIndex + 1, newConstraints, newUsedWords)) {
        return true;
      }
      
      // Backtrack
      placement.delete(slot.id);
    }
    
    return false;
  };
  
  // Solve the puzzle
  if (!solve(0, constraints, usedWords)) {
    throw new Error(`Could not generate valid puzzle for date ${dateString}`);
  }
  
  // Build the solution grid
  const solutionGrid = Array(template.height)
    .fill(null)
    .map((_, r) => Array(template.width).fill('').map((_, c) => 
      template.blocks[r][c] ? '' : ''
    ));
  
  // Also build the display grid (showing solution letters and empty for blocks)
  const grid = Array(template.height)
    .fill(null)
    .map((_, r) => Array(template.width).fill('').map((_, c) => 
      template.blocks[r][c] ? '' : ''
    ));
  
  // Fill in the solution
  for (const [slotId, word] of placement) {
    const slot = slots.find(s => s.id === slotId);
    const cells = getSlotCells(slot, template);
    
    for (let i = 0; i < word.length; i++) {
      const cell = cells[i];
      solutionGrid[cell.row][cell.col] = word[i];
      grid[cell.row][cell.col] = word[i];
    }
  }
  
  // Generate clue numbers (computed from slot positions)
  const clueNumbers = Array(template.height)
    .fill(null)
    .map(() => Array(template.width).fill(null));
  
  // Number cells that start words
  let clueNum = 0;
  const numberAssignment = new Map(); // "row,col" -> number
  
  for (let r = 0; r < template.height; r++) {
    for (let c = 0; c < template.width; c++) {
      if (template.blocks[r][c]) continue;
      
      // Check if this cell starts any slot
      const startsSlot = slots.some(s => s.row === r && s.col === c);
      
      if (startsSlot) {
        clueNum++;
        clueNumbers[r][c] = clueNum;
        numberAssignment.set(`${r},${c}`, clueNum);
      }
    }
  }
  
  // Build clue objects
  const usedClues = new Set();
  const acrossClues = [];
  const downClues = [];
  const acrossWords = {};
  const downWords = {};
  
  for (const slot of slots) {
    const word = placement.get(slot.id);
    const num = numberAssignment.get(`${slot.row},${slot.col}`);
    const clue = getClueForWord(word, usedClues);
    usedClues.add(clue);
    
    if (slot.direction === 'across') {
      acrossClues.push({ number: num, clue, word });
      acrossWords[num] = word;
    } else {
      downClues.push({ number: num, clue, word });
      downWords[num] = word;
    }
  }
  
  // Sort clues by number
  acrossClues.sort((a, b) => a.number - b.number);
  downClues.sort((a, b) => a.number - b.number);
  
  // Build across/down clue maps (legacy format support)
  const across = {};
  const down = {};
  
  for (const { number, clue } of acrossClues) {
    across[number] = clue;
  }
  for (const { number, clue } of downClues) {
    down[number] = clue;
  }
  
  return {
    date: dateString,
    grid: grid, // Solution grid (letters filled)
    template: template,
    slots: slots,
    clueNumbers: clueNumbers,
    across: across,
    down: down,
    acrossClues: acrossClues,
    downClues: downClues,
    solution: {
      across: acrossWords,
      down: downWords,
    },
    width: template.width,
    height: template.height,
  };
};

/**
 * Get today's puzzle
 */
export const getTodaysPuzzle = () => {
  const today = new Date();
  const dateString = today.toISOString().split('T')[0];
  
  try {
    return generatePuzzleForDate(dateString);
  } catch (error) {
    console.error('Error generating puzzle:', error);
    // Generate a fallback puzzle for a known working date
    return generatePuzzleForDate('2026-01-01');
  }
};

// ============================================================================
// CLUE & CELL HELPERS
// ============================================================================

/**
 * Get clue number for a cell
 */
export const getClueNumber = (puzzle, row, col) => {
  if (!puzzle.clueNumbers) {
    // Legacy fallback - compute on the fly
    if (puzzle.grid[row][col] === '') return null;
    
    let clueNum = 0;
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (puzzle.grid[r][c] === '') continue;
        
        const startsAcross = c === 0 || puzzle.grid[r][c - 1] === '';
        const startsDown = r === 0 || puzzle.grid[r - 1][c] === '';
        
        if (startsAcross || startsDown) {
          clueNum++;
          if (r === row && c === col) {
            return clueNum;
          }
        }
      }
    }
    return null;
  }
  
  return puzzle.clueNumbers[row][col];
};

/**
 * Get word cells for a given position and direction
 * RESPECTS BLOCK BOUNDARIES
 */
export const getWordCells = (puzzle, row, col, direction) => {
  const cells = [];
  const template = puzzle.template;
  const width = puzzle.width || GRID_SIZE;
  const height = puzzle.height || GRID_SIZE;
  
  // Helper to check if cell is a block
  const isBlock = (r, c) => {
    if (template) {
      return template.blocks[r]?.[c] ?? true;
    }
    return puzzle.grid[r]?.[c] === '';
  };
  
  if (direction === 'across') {
    // Find start of word (go left until block or edge)
    let startCol = col;
    while (startCol > 0 && !isBlock(row, startCol - 1)) {
      startCol--;
    }
    
    // Collect all cells until block or edge
    let c = startCol;
    while (c < width && !isBlock(row, c)) {
      cells.push({ row, col: c });
      c++;
    }
  } else {
    // Find start of word (go up until block or edge)
    let startRow = row;
    while (startRow > 0 && !isBlock(startRow - 1, col)) {
      startRow--;
    }
    
    // Collect all cells until block or edge
    let r = startRow;
    while (r < height && !isBlock(r, col)) {
      cells.push({ row: r, col });
      r++;
    }
  }
  
  return cells;
};

/**
 * Get next cell in current word (respects blocks)
 */
export const getNextCell = (puzzle, row, col, direction) => {
  const cells = getWordCells(puzzle, row, col, direction);
  const currentIndex = cells.findIndex(c => c.row === row && c.col === col);
  
  // If not at end of word, move to next cell
  if (currentIndex >= 0 && currentIndex < cells.length - 1) {
    return {
      row: cells[currentIndex + 1].row,
      col: cells[currentIndex + 1].col,
      direction
    };
  }
  
  // At end of word - stay in place (let UI handle word completion)
  return { row, col, direction };
};

/**
 * Get previous cell in current word
 */
export const getPreviousCell = (puzzle, row, col, direction) => {
  const cells = getWordCells(puzzle, row, col, direction);
  const currentIndex = cells.findIndex(c => c.row === row && c.col === col);
  
  if (currentIndex > 0) {
    return {
      row: cells[currentIndex - 1].row,
      col: cells[currentIndex - 1].col,
      direction
    };
  }
  
  return { row, col, direction };
};

// ============================================================================
// PUZZLE CHECKING
// ============================================================================

/**
 * Check if puzzle is complete and correct
 */
export const checkPuzzle = (puzzle, userGrid) => {
  const template = puzzle.template;
  const height = puzzle.height || GRID_SIZE;
  const width = puzzle.width || GRID_SIZE;
  
  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      // Skip blocks
      if (template && template.blocks[r][c]) continue;
      if (puzzle.grid[r][c] === '') continue;
      
      // Check letter
      const expected = puzzle.grid[r][c].toUpperCase();
      const actual = (userGrid[r][c] || '').toUpperCase();
      
      if (expected !== actual) {
        return false;
      }
    }
  }
  return true;
};

/**
 * Check if grid is fully filled (all non-block cells have letters)
 */
export const isGridComplete = (puzzle, userGrid) => {
  const template = puzzle.template;
  const height = puzzle.height || GRID_SIZE;
  const width = puzzle.width || GRID_SIZE;
  
  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      // Skip blocks
      if (template && template.blocks[r][c]) continue;
      if (puzzle.grid[r][c] === '') continue;
      
      // Check if cell is filled
      if (!userGrid[r][c]) {
        return false;
      }
    }
  }
  return true;
};

// ============================================================================
// GAME STATE MANAGEMENT
// ============================================================================

const STORAGE_KEY = 'crossword_state_v2';
const TIMER_KEY_PREFIX = 'crossword_timer_v2_';

/**
 * Load game state from localStorage
 */
export const loadGameState = () => {
  if (typeof window === 'undefined') return null;
  
  try {
    const saved = localStorage.getItem(getUserStorageKey(STORAGE_KEY));
    if (!saved) return null;
    
    const state = JSON.parse(saved);
    const today = new Date().toISOString().split('T')[0];
    
    // Only return if it's today's puzzle
    if (state.date !== today) {
      return null;
    }
    
    return state;
  } catch (error) {
    console.error('Failed to load crossword state:', error);
    return null;
  }
};

/**
 * Save game state to localStorage
 */
export const saveGameState = (state) => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(getUserStorageKey(STORAGE_KEY), JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save crossword state:', error);
  }
};

/**
 * Initialize game state for a puzzle
 */
export const initializeGame = (puzzle) => {
  const height = puzzle.height || GRID_SIZE;
  const width = puzzle.width || GRID_SIZE;
  
  // Create empty user grid
  const userGrid = Array(height)
    .fill(null)
    .map(() => Array(width).fill(''));
  
  // Find first non-block cell
  let startRow = 0, startCol = 0;
  outer: for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      const isBlock = puzzle.template 
        ? puzzle.template.blocks[r][c]
        : puzzle.grid[r][c] === '';
      
      if (!isBlock) {
        startRow = r;
        startCol = c;
        break outer;
      }
    }
  }
  
  // Initialize timer
  const timer = initializeTimer();
  saveTimerState(puzzle.date, timer);
  
  return {
    date: puzzle.date,
    userGrid,
    activeCell: { row: startRow, col: startCol },
    direction: 'across',
    timerState: timer,
    isSolved: false,
    endTime: null,
  };
};

// ============================================================================
// TIMER MANAGEMENT (Re-exports with state integration)
// ============================================================================

export {
  initializeTimer,
  calculateElapsedTime,
  formatTime as formatTimeEngine,
} from './crosswordEngine';

/**
 * Format time (seconds to MM:SS)
 */
export const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Load timer state for today's puzzle
 */
export const loadPuzzleTimer = (puzzleDate) => {
  return loadTimerState(puzzleDate);
};

/**
 * Save timer state for today's puzzle
 */
export const savePuzzleTimer = (puzzleDate, timerState) => {
  saveTimerState(puzzleDate, timerState);
};

/**
 * Pause the puzzle timer
 */
export const pausePuzzleTimer = (timerState, puzzleDate) => {
  const newState = pauseTimer(timerState);
  if (puzzleDate) {
    saveTimerState(puzzleDate, newState);
  }
  return newState;
};

/**
 * Resume the puzzle timer
 */
export const resumePuzzleTimer = (timerState, puzzleDate) => {
  const newState = resumeTimer(timerState);
  if (puzzleDate) {
    saveTimerState(puzzleDate, newState);
  }
  return newState;
};

// ============================================================================
// STATS (Legacy compatibility)
// ============================================================================

export const getDefaultStats = () => ({
  played: 0,
  won: 0,
  currentStreak: 0,
  maxStreak: 0,
  averageTime: 0,
  bestTime: 0,
  lastPlayed: null
});

export const loadStats = () => {
  if (typeof window === 'undefined') return getDefaultStats();
  
  try {
    const saved = localStorage.getItem(getUserStorageKey('ammar-times-crossword-stats'));
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error('Error loading stats:', error);
  }
  return getDefaultStats();
};

export const saveStats = (stats) => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(getUserStorageKey('ammar-times-crossword-stats'), JSON.stringify(stats));
  } catch (error) {
    console.error('Error saving stats:', error);
  }
};

export const updateStats = (currentStats, won, timeInSeconds) => {
  const today = new Date().toISOString().split('T')[0];
  const lastPlayed = currentStats.lastPlayed;
  
  const newStats = {
    played: currentStats.played + 1,
    won: currentStats.won + (won ? 1 : 0),
    lastPlayed: today
  };
  
  if (won) {
    if (lastPlayed === today) {
      newStats.currentStreak = currentStats.currentStreak;
    } else {
      newStats.currentStreak = currentStats.currentStreak + 1;
    }
  } else {
    newStats.currentStreak = 0;
  }
  
  newStats.maxStreak = Math.max(currentStats.maxStreak, newStats.currentStreak);
  
  if (won) {
    const totalTime = (currentStats.averageTime * currentStats.won) + timeInSeconds;
    newStats.averageTime = Math.round(totalTime / newStats.won);
    newStats.bestTime = currentStats.bestTime === 0 
      ? timeInSeconds 
      : Math.min(currentStats.bestTime, timeInSeconds);
  } else {
    newStats.averageTime = currentStats.averageTime;
    newStats.bestTime = currentStats.bestTime;
  }
  
  return newStats;
};
