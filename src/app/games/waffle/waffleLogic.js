/**
 * Waffle Game Logic
 * A letter-swap puzzle where players rearrange letters to form valid words
 * in rows and columns of a 5x5 grid
 */

import { WAFFLE_PUZZLES_JAN_2026 } from './puzzles/waffle-2026-01';
import { WAFFLE_PUZZLES_FEB_2026 } from './puzzles/waffle-2026-02';
import { getActiveTheme, getGameTheme } from '@/utils/themeEngine';
import { getUserStorageKey } from '@/utils/storageKeys';

// Merge all puzzles
const ALL_WAFFLE_PUZZLES = [...WAFFLE_PUZZLES_JAN_2026, ...WAFFLE_PUZZLES_FEB_2026];

// Game constants
export const GRID_SIZE = 5;
export const DEFAULT_MAX_MOVES = 15;

// Cell types - for the waffle pattern
export const CELL_TYPES = {
  LETTER: 'letter',
  EMPTY: 'empty',
};

// Cell states for coloring
export const CELL_STATES = {
  CORRECT: 'correct',     // Green - correct letter & position
  PRESENT: 'present',     // Yellow - letter belongs in row/column but wrong cell
  ABSENT: 'absent',       // Gray - letter not in that word line
};

/**
 * Get the waffle grid pattern (which cells have letters)
 * Standard waffle has a cross pattern with empty corners
 */
export const getWafflePattern = () => {
  return [
    [true, true, true, true, true],
    [true, false, true, false, true],
    [true, true, true, true, true],
    [true, false, true, false, true],
    [true, true, true, true, true],
  ];
};

/**
 * Get today's puzzle
 */
export const getTodaysPuzzle = () => {
  const today = new Date();
  const dateString = today.toISOString().split('T')[0];
  
  // Check for themed puzzle first
  const theme = getGameTheme('waffle');
  if (theme && theme.puzzleSet) {
    const themedPuzzle = getThemedPuzzle(theme.puzzleSet, dateString);
    if (themedPuzzle) return themedPuzzle;
  }
  
  // Find puzzle for today
  const puzzle = ALL_WAFFLE_PUZZLES.find(p => p.date === dateString);
  
  if (puzzle) {
    return puzzle;
  }
  
  // Fallback to first puzzle if today's not found
  return WAFFLE_PUZZLES_JAN_2026[0];
};

/**
 * Get puzzle by date (for unlimited mode)
 */
export const getPuzzleByDate = (dateString) => {
  return ALL_WAFFLE_PUZZLES.find(p => p.date === dateString) || null;
};

/**
 * Get a random puzzle for unlimited mode
 */
export const getRandomPuzzle = () => {
  const randomIndex = Math.floor(Math.random() * ALL_WAFFLE_PUZZLES.length);
  return ALL_WAFFLE_PUZZLES[randomIndex];
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
  const pattern = getWafflePattern();
  
  // Deep copy the initial grid
  const currentGrid = puzzle.grid.map(row => [...row]);
  
  // Calculate initial cell states
  const cellStates = calculateCellStates(currentGrid, puzzle.solution, pattern);
  
  return {
    date: puzzle.date,
    currentGrid,
    solution: puzzle.solution,
    maxMoves: puzzle.maxMoves || DEFAULT_MAX_MOVES,
    movesUsed: 0,
    selectedCell: null,
    cellStates,
    gameStatus: 'playing', // 'playing', 'won', 'lost'
    swapHistory: [],
    pattern,
  };
};

/**
 * Calculate cell states based on current grid vs solution
 */
export const calculateCellStates = (currentGrid, solution, pattern) => {
  const states = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null));
  
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      if (!pattern[row][col]) {
        states[row][col] = null; // Empty cell
        continue;
      }
      
      const currentLetter = currentGrid[row][col];
      const solutionLetter = solution[row][col];
      
      if (currentLetter === solutionLetter) {
        states[row][col] = CELL_STATES.CORRECT;
      } else {
        // Check if letter belongs in this row or column
        const belongsInRow = solution[row].includes(currentLetter);
        const belongsInCol = solution.map(r => r[col]).includes(currentLetter);
        
        if (belongsInRow || belongsInCol) {
          states[row][col] = CELL_STATES.PRESENT;
        } else {
          states[row][col] = CELL_STATES.ABSENT;
        }
      }
    }
  }
  
  return states;
};

/**
 * Check if a cell can be selected (not empty and not already correct)
 */
export const canSelectCell = (gameState, row, col) => {
  if (gameState.gameStatus !== 'playing') return false;
  if (!gameState.pattern[row][col]) return false;
  
  // Allow selecting correct cells too, in case player wants to swap
  return true;
};

/**
 * Check if two cells can be swapped
 */
export const canSwap = (gameState, cell1, cell2) => {
  if (!cell1 || !cell2) return false;
  if (gameState.gameStatus !== 'playing') return false;
  if (gameState.movesUsed >= gameState.maxMoves) return false;
  
  // Both cells must be letter cells
  if (!gameState.pattern[cell1.row][cell1.col]) return false;
  if (!gameState.pattern[cell2.row][cell2.col]) return false;
  
  // Can't swap with itself
  if (cell1.row === cell2.row && cell1.col === cell2.col) return false;
  
  return true;
};

/**
 * Perform a swap between two cells
 */
export const performSwap = (gameState, cell1, cell2) => {
  if (!canSwap(gameState, cell1, cell2)) {
    return { ...gameState, selectedCell: null };
  }
  
  // Create new grid with swapped letters
  const newGrid = gameState.currentGrid.map(row => [...row]);
  const temp = newGrid[cell1.row][cell1.col];
  newGrid[cell1.row][cell1.col] = newGrid[cell2.row][cell2.col];
  newGrid[cell2.row][cell2.col] = temp;
  
  // Calculate new cell states
  const newCellStates = calculateCellStates(newGrid, gameState.solution, gameState.pattern);
  
  // Check if puzzle is solved
  const isSolved = checkSolution(newGrid, gameState.solution, gameState.pattern);
  
  // Update moves and check for loss
  const newMovesUsed = gameState.movesUsed + 1;
  const isLost = !isSolved && newMovesUsed >= gameState.maxMoves;
  
  return {
    ...gameState,
    currentGrid: newGrid,
    cellStates: newCellStates,
    movesUsed: newMovesUsed,
    selectedCell: null,
    gameStatus: isSolved ? 'won' : (isLost ? 'lost' : 'playing'),
    swapHistory: [...gameState.swapHistory, { cell1, cell2 }],
  };
};

/**
 * Check if the grid matches the solution
 */
export const checkSolution = (currentGrid, solution, pattern) => {
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      if (!pattern[row][col]) continue;
      if (currentGrid[row][col] !== solution[row][col]) {
        return false;
      }
    }
  }
  return true;
};

/**
 * Get the words formed in the current grid
 */
export const getGridWords = (grid, pattern) => {
  const words = { rows: [], cols: [] };
  
  // Get horizontal words (rows 0, 2, 4)
  [0, 2, 4].forEach(row => {
    words.rows.push(grid[row].filter((_, col) => pattern[row][col]).join(''));
  });
  
  // Get vertical words (cols 0, 2, 4)
  [0, 2, 4].forEach(col => {
    const word = grid.map((row, rowIdx) => pattern[rowIdx][col] ? row[col] : '').join('');
    words.cols.push(word);
  });
  
  return words;
};

/**
 * Calculate minimum moves required (theoretical perfect solve)
 */
export const calculateMinimumMoves = (puzzle) => {
  let misplacedCount = 0;
  const pattern = getWafflePattern();
  
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      if (!pattern[row][col]) continue;
      if (puzzle.grid[row][col] !== puzzle.solution[row][col]) {
        misplacedCount++;
      }
    }
  }
  
  // Each swap fixes at most 2 letters
  return Math.ceil(misplacedCount / 2);
};

/**
 * Check if this is a perfect solve
 */
export const isPerfectSolve = (gameState, puzzle) => {
  const minMoves = calculateMinimumMoves(puzzle);
  return gameState.gameStatus === 'won' && gameState.movesUsed <= minMoves;
};

/**
 * Generate share text for the game result
 */
export const generateShareText = (gameState, puzzle) => {
  const lines = ['The Daily Thread – Waffle'];
  
  // Generate emoji grid showing final state
  const emojiGrid = [];
  for (let row = 0; row < GRID_SIZE; row++) {
    let rowEmoji = '';
    for (let col = 0; col < GRID_SIZE; col++) {
      if (!gameState.pattern[row][col]) {
        rowEmoji += '⬜';
      } else {
        switch (gameState.cellStates[row][col]) {
          case CELL_STATES.CORRECT:
            rowEmoji += '🟩';
            break;
          case CELL_STATES.PRESENT:
            rowEmoji += '🟨';
            break;
          default:
            rowEmoji += '⬛';
        }
      }
    }
    emojiGrid.push(rowEmoji);
  }
  
  lines.push(emojiGrid.join('\n'));
  lines.push(`Moves: ${gameState.movesUsed}/${gameState.maxMoves}`);
  
  if (isPerfectSolve(gameState, puzzle)) {
    lines.push('⭐ Perfect!');
  }
  
  return lines.join('\n');
};

// Local storage functions
const STORAGE_KEY = 'waffleGameState';
const STATS_KEY = 'waffleStats';

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
  totalSwaps: 0,
  perfectSolves: 0,
  lastPlayedDate: null,
});

export const updateStats = (stats, won, swaps, isPerfect) => {
  const today = new Date().toISOString().split('T')[0];
  const newStats = { ...stats };
  
  newStats.gamesPlayed++;
  newStats.totalSwaps += swaps;
  
  if (won) {
    newStats.gamesWon++;
    if (isPerfect) {
      newStats.perfectSolves++;
    }
    
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
