import { CROSSWORD_PUZZLES_JAN_2026 } from './puzzles/crossword-2026-01';

export const GRID_SIZE = 5;

/**
 * Get today's puzzle
 */
export const getTodaysPuzzle = () => {
  const today = new Date();
  const dateString = today.toISOString().split('T')[0];
  
  const puzzle = CROSSWORD_PUZZLES_JAN_2026.find(p => p.date === dateString);
  
  if (puzzle) {
    return puzzle;
  }
  
  // Fallback to first puzzle
  return CROSSWORD_PUZZLES_JAN_2026[0];
};

/**
 * Get clue number for a cell
 */
export const getClueNumber = (puzzle, row, col) => {
  // Check if this cell starts a word
  const cell = puzzle.grid[row][col];
  if (cell === "") return null;
  
  // Check across
  const startsAcross = col === 0 || puzzle.grid[row][col - 1] === "";
  // Check down
  const startsDown = row === 0 || puzzle.grid[row - 1][col] === "";
  
  if (!startsAcross && !startsDown) return null;
  
  // Find the clue number by counting from top-left
  let clueNum = 0;
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (puzzle.grid[r][c] === "") continue;
      
      const isAcrossStart = c === 0 || puzzle.grid[r][c - 1] === "";
      const isDownStart = r === 0 || puzzle.grid[r - 1][c] === "";
      
      if (isAcrossStart || isDownStart) {
        clueNum++;
        if (r === row && c === col) {
          return clueNum;
        }
      }
    }
  }
  
  return null;
};

/**
 * Get word cells for a given position and direction
 */
export const getWordCells = (puzzle, row, col, direction) => {
  const cells = [];
  
  if (direction === 'across') {
    // Find start of word
    let startCol = col;
    while (startCol > 0 && puzzle.grid[row][startCol - 1] !== "") {
      startCol--;
    }
    
    // Collect all cells in word
    let c = startCol;
    while (c < GRID_SIZE && puzzle.grid[row][c] !== "") {
      cells.push({ row, col: c });
      c++;
    }
  } else {
    // Find start of word
    let startRow = row;
    while (startRow > 0 && puzzle.grid[startRow - 1][col] !== "") {
      startRow--;
    }
    
    // Collect all cells in word
    let r = startRow;
    while (r < GRID_SIZE && puzzle.grid[r][col] !== "") {
      cells.push({ row: r, col });
      r++;
    }
  }
  
  return cells;
};

/**
 * Get next cell in current direction
 */
export const getNextCell = (puzzle, row, col, direction) => {
  if (direction === 'across') {
    // Try next cell in row
    if (col + 1 < GRID_SIZE && puzzle.grid[row][col + 1] !== "") {
      return { row, col: col + 1, direction };
    }
    // End of word, try next row
    for (let r = row + 1; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (puzzle.grid[r][c] !== "") {
          return { row: r, col: c, direction: 'across' };
        }
      }
    }
  } else {
    // Try next cell in column
    if (row + 1 < GRID_SIZE && puzzle.grid[row + 1][col] !== "") {
      return { row: row + 1, col, direction };
    }
    // End of word, try next column
    for (let c = col + 1; c < GRID_SIZE; c++) {
      for (let r = 0; r < GRID_SIZE; r++) {
        if (puzzle.grid[r][c] !== "") {
          return { row: r, col: c, direction: 'down' };
        }
      }
    }
  }
  
  // Wrap to beginning
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (puzzle.grid[r][c] !== "") {
        return { row: r, col: c, direction: 'across' };
      }
    }
  }
  
  return { row, col, direction };
};

/**
 * Check if puzzle is complete and correct
 */
export const checkPuzzle = (puzzle, userGrid) => {
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (puzzle.grid[r][c] !== "") {
        if (puzzle.grid[r][c].toUpperCase() !== (userGrid[r][c] || "").toUpperCase()) {
          return false;
        }
      }
    }
  }
  return true;
};

/**
 * Check if grid is fully filled
 */
export const isGridComplete = (puzzle, userGrid) => {
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (puzzle.grid[r][c] !== "" && !userGrid[r][c]) {
        return false;
      }
    }
  }
  return true;
};

/**
 * Load game state
 */
export const loadGameState = () => {
  if (typeof window === 'undefined') return null;
  
  try {
    const saved = localStorage.getItem('crossword_state');
    if (!saved) return null;
    
    const state = JSON.parse(saved);
    const today = new Date().toISOString().split('T')[0];
    
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
 * Save game state
 */
export const saveGameState = (state) => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem('crossword_state', JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save crossword state:', error);
  }
};

/**
 * Initialize game state
 */
export const initializeGame = (puzzle) => {
  // Create empty grid
  const userGrid = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(""));
  
  return {
    date: puzzle.date,
    userGrid,
    activeCell: { row: 0, col: 0 },
    direction: 'across',
    startTime: Date.now(),
    endTime: null,
    isSolved: false
  };
};
