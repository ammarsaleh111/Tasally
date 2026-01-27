/**
 * Crossword Engine v2
 * 
 * A real crossword puzzle engine with:
 * - Template-based grid shapes
 * - Automatic slot detection
 * - Word placement with constraint satisfaction
 * - Proper numbering and clue management
 * - Timer tracking with visibility awareness
 * - Full validation
 */

// ============================================================================
// GRID TEMPLATES - 10+ distinct shapes
// ============================================================================

export const GRID_TEMPLATES = [
  {
    id: 'classic-symmetric',
    width: 5,
    height: 5,
    blocks: [
      [false, false, false, false, false],
      [false, true,  false, true,  false],
      [false, false, false, false, false],
      [false, true,  false, true,  false],
      [false, false, false, false, false],
    ],
    name: 'Classic Symmetric'
  },
  {
    id: 'nyt-mini',
    width: 5,
    height: 5,
    blocks: [
      [false, false, false, false, false],
      [false, false, false, true,  true ],
      [false, false, false, false, false],
      [true,  true,  false, false, false],
      [false, false, false, false, false],
    ],
    name: 'NYT Mini Style'
  },
  {
    id: 'cross-shape',
    width: 5,
    height: 5,
    blocks: [
      [true,  true,  false, true,  true ],
      [true,  false, false, false, true ],
      [false, false, false, false, false],
      [true,  false, false, false, true ],
      [true,  true,  false, true,  true ],
    ],
    name: 'Cross Shape'
  },
  {
    id: 'plus-wide',
    width: 5,
    height: 5,
    blocks: [
      [true,  false, false, false, true ],
      [false, false, false, false, false],
      [false, false, false, false, false],
      [false, false, false, false, false],
      [true,  false, false, false, true ],
    ],
    name: 'Plus Wide'
  },
  {
    id: 'diagonal-blocks',
    width: 5,
    height: 5,
    blocks: [
      [false, false, false, false, true ],
      [false, false, false, true,  false],
      [false, false, false, false, false],
      [false, true,  false, false, false],
      [true,  false, false, false, false],
    ],
    name: 'Diagonal Blocks'
  },
  {
    id: 'corner-blocks',
    width: 5,
    height: 5,
    blocks: [
      [true,  false, false, false, true ],
      [false, false, false, false, false],
      [false, false, false, false, false],
      [false, false, false, false, false],
      [true,  false, false, false, true ],
    ],
    name: 'Corner Blocks'
  },
  {
    id: 'center-block',
    width: 5,
    height: 5,
    blocks: [
      [false, false, false, false, false],
      [false, false, false, false, false],
      [false, false, true,  false, false],
      [false, false, false, false, false],
      [false, false, false, false, false],
    ],
    name: 'Center Block'
  },
  {
    id: 'ladder',
    width: 5,
    height: 5,
    blocks: [
      [false, false, false, false, false],
      [false, true,  false, true,  false],
      [false, false, false, false, false],
      [false, true,  false, true,  false],
      [false, false, false, false, false],
    ],
    name: 'Ladder'
  },
  {
    id: 'staircase',
    width: 5,
    height: 5,
    blocks: [
      [false, false, false, false, false],
      [true,  false, false, false, false],
      [true,  true,  false, false, false],
      [false, false, false, false, true ],
      [false, false, false, false, true ],
    ],
    name: 'Staircase'
  },
  {
    id: 'minimal',
    width: 5,
    height: 5,
    blocks: [
      [false, false, false, false, false],
      [false, false, false, false, false],
      [false, false, false, false, false],
      [false, false, false, false, false],
      [false, false, false, false, false],
    ],
    name: 'Open Grid'
  },
  {
    id: 'side-blocks',
    width: 5,
    height: 5,
    blocks: [
      [false, false, false, false, false],
      [true,  false, false, false, true ],
      [false, false, false, false, false],
      [true,  false, false, false, true ],
      [false, false, false, false, false],
    ],
    name: 'Side Blocks'
  }
];

/**
 * Validate that all non-block cells in a template are part of at least one word
 */
export const validateTemplate = (template) => {
  const slots = detectSlotsInternal(template);
  const coveredCells = new Set();
  
  // Mark all cells that are part of a slot
  for (const slot of slots) {
    // Inline getSlotCells logic
    if (slot.direction === 'across') {
      for (let c = slot.col; c < slot.col + slot.length; c++) {
        coveredCells.add(`${slot.row},${c}`);
      }
    } else {
      for (let r = slot.row; r < slot.row + slot.length; r++) {
        coveredCells.add(`${r},${slot.col}`);
      }
    }
  }
  
  // Check that all non-block cells are covered
  const orphanCells = [];
  for (let r = 0; r < template.height; r++) {
    for (let c = 0; c < template.width; c++) {
      if (!template.blocks[r][c] && !coveredCells.has(`${r},${c}`)) {
        orphanCells.push({ row: r, col: c });
      }
    }
  }
  
  return {
    isValid: orphanCells.length === 0,
    orphanCells,
    slotCount: slots.length
  };
};

/**
 * Internal slot detection for validation (before main detectSlots is defined)
 */
const detectSlotsInternal = (template) => {
  const slots = [];
  let slotId = 1;
  const width = template.width;
  const height = template.height;

  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      if (template.blocks[row][col]) continue;

      const startsAcross = col === 0 || template.blocks[row][col - 1];
      const hasAcrossRightNeighbor = col + 1 < width && !template.blocks[row][col + 1];

      if (startsAcross && hasAcrossRightNeighbor) {
        let length = 1;
        for (let c = col + 1; c < width; c++) {
          if (!template.blocks[row][c]) length++;
          else break;
        }
        if (length >= 2) {
          slots.push({ id: slotId++, direction: 'across', row, col, length, word: '', clue: '' });
        }
      }

      const startsDown = row === 0 || template.blocks[row - 1][col];
      const hasDownBottomNeighbor = row + 1 < height && !template.blocks[row + 1][col];

      if (startsDown && hasDownBottomNeighbor) {
        let length = 1;
        for (let r = row + 1; r < height; r++) {
          if (!template.blocks[r][col]) length++;
          else break;
        }
        if (length >= 2) {
          slots.push({ id: slotId++, direction: 'down', row, col, length, word: '', clue: '' });
        }
      }
    }
  }
  return slots;
};

/**
 * Get a valid template for a specific date
 * Cycles through templates deterministically by date
 * Prefers simpler templates (fewer slots = easier to solve)
 */
export const getTemplateForDate = (dateString) => {
  const date = new Date(dateString);
  const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 86400000);
  
  // Try templates starting from the day's index, prefer simpler ones
  const candidates = [];
  
  for (let i = 0; i < GRID_TEMPLATES.length; i++) {
    const index = (dayOfYear + i) % GRID_TEMPLATES.length;
    const template = GRID_TEMPLATES[index];
    const validation = validateTemplate(template);
    
    if (validation.isValid && validation.slotCount >= 6) {
      candidates.push({ template, slotCount: validation.slotCount });
    }
  }
  
  // Prefer templates with fewer slots (easier to solve)
  if (candidates.length > 0) {
    candidates.sort((a, b) => a.slotCount - b.slotCount);
    return candidates[0].template;
  }
  
  // Fallback to first template
  return GRID_TEMPLATES[0];
};

// ============================================================================
// SLOT DETECTION
// ============================================================================

/**
 * A Slot represents a word position and direction
 * @typedef {Object} Slot
 * @property {number} id - Unique number (shared across/down)
 * @property {'across'|'down'} direction
 * @property {number} row
 * @property {number} col
 * @property {number} length
 * @property {string} word - The actual word placed (once solved)
 * @property {string} clue - The clue for this word
 */

/**
 * Detect all valid word slots from a grid template
 * 
 * A cell starts an Across word if:
 * - It's not a block
 * - Cell to left is a block or off-grid
 * - Cell to right is not a block
 * 
 * A cell starts a Down word if:
 * - It's not a block
 * - Cell above is a block or off-grid
 * - Cell below is not a block
 */
export const detectSlots = (template) => {
  const slots = [];
  let slotId = 1;
  const width = template.width;
  const height = template.height;

  // Scan top-to-bottom, left-to-right
  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      // Skip if this is a block
      if (template.blocks[row][col]) continue;

      // Check for Across slot
      const startsAcross =
        col === 0 || template.blocks[row][col - 1];
      const hasAcrossRightNeighbor =
        col + 1 < width && !template.blocks[row][col + 1];

      if (startsAcross && hasAcrossRightNeighbor) {
        // Count length
        let length = 1;
        for (let c = col + 1; c < width; c++) {
          if (!template.blocks[row][c]) {
            length++;
          } else {
            break;
          }
        }

        if (length >= 2) {
          // Only count words of length 2+
          slots.push({
            id: slotId,
            direction: 'across',
            row,
            col,
            length,
            word: '',
            clue: ''
          });
          slotId++;
        }
      }

      // Check for Down slot
      const startsDown =
        row === 0 || template.blocks[row - 1][col];
      const hasDownBottomNeighbor =
        row + 1 < height && !template.blocks[row + 1][col];

      if (startsDown && hasDownBottomNeighbor) {
        // Count length
        let length = 1;
        for (let r = row + 1; r < height; r++) {
          if (!template.blocks[r][col]) {
            length++;
          } else {
            break;
          }
        }

        if (length >= 2) {
          // Only count words of length 2+
          slots.push({
            id: slotId,
            direction: 'down',
            row,
            col,
            length,
            word: '',
            clue: ''
          });
          slotId++;
        }
      }
    }
  }

  return slots;
};

// ============================================================================
// WORD MATCHING & LETTER CONSTRAINTS
// ============================================================================

/**
 * Get all cells that a slot occupies
 */
export const getSlotCells = (slot, template) => {
  const cells = [];
  const width = template.width;
  const height = template.height;

  if (slot.direction === 'across') {
    for (let c = slot.col; c < slot.col + slot.length; c++) {
      if (c < width) {
        cells.push({ row: slot.row, col: c });
      }
    }
  } else {
    // down
    for (let r = slot.row; r < slot.row + slot.length; r++) {
      if (r < height) {
        cells.push({ row: r, col: slot.col });
      }
    }
  }

  return cells;
};

/**
 * Find all slots that intersect with a given slot
 */
export const findIntersectingSlots = (slot, allSlots, template) => {
  const slotCells = getSlotCells(slot, template);
  const intersecting = [];

  for (const otherSlot of allSlots) {
    if (otherSlot.id === slot.id) continue;

    const otherCells = getSlotCells(otherSlot, template);

    // Find common cells
    for (const cell of slotCells) {
      for (const otherCell of otherCells) {
        if (cell.row === otherCell.row && cell.col === otherCell.col) {
          intersecting.push({
            slot: otherSlot,
            slotCellIndex: slotCells.indexOf(cell),
            otherCellIndex: otherCells.indexOf(otherCell)
          });
          break;
        }
      }
    }
  }

  return intersecting;
};

/**
 * Check if a word can be placed in a slot given current constraints
 * STRICT validation - word length MUST match slot length exactly
 * constraints is a Map of (row, col) => letter
 */
export const canPlaceWord = (word, slot, constraints, template) => {
  // CRITICAL: Strict length check
  if (!word || word.length === 0) return false;
  if (word.length !== slot.length) return false;
  
  const cells = getSlotCells(slot, template);

  // Check each letter against constraints
  for (let i = 0; i < word.length; i++) {
    const cell = cells[i];
    if (!cell) return false; // Safety check
    
    const key = `${cell.row},${cell.col}`;

    if (constraints.has(key)) {
      const existingLetter = constraints.get(key);
      if (existingLetter !== word[i]) {
        return false;
      }
    }
  }

  return true;
};

/**
 * Place a word in constraints map
 * Assumes word has already passed canPlaceWord validation
 */
export const placeWord = (word, slot, constraints, template) => {
  const cells = getSlotCells(slot, template);
  const newConstraints = new Map(constraints);

  for (let i = 0; i < word.length; i++) {
    const cell = cells[i];
    const key = `${cell.row},${cell.col}`;
    newConstraints.set(key, word[i]);
  }

  return newConstraints;
};

// ============================================================================
// WORD PLACEMENT ENGINE
// ============================================================================

/**
 * Load a dictionary of words organized by length
 * Returns: { 3: ['THE', 'AND', ...], 4: ['WORD', 'TIME', ...], ... }
 */
const loadWordDictionary = () => {
  // In production, load from your word list file
  // For now, return a reasonable set
  const words = {
    2: ['IS', 'AT', 'TO', 'IN', 'ON', 'OR', 'AS', 'BE', 'BY', 'DO', 'GO', 'IT', 'ME', 'MY', 'NO', 'OF', 'UP', 'US', 'WE', 'AM'],
    3: ['THE', 'AND', 'FOR', 'ARE', 'BUT', 'NOT', 'YOU', 'CAN', 'HER', 'WAS', 'ONE', 'OUR', 'OUT', 'HAS', 'HIS', 'HOW', 'ITS', 'MAY', 'OLD', 'SEE', 'SHE', 'USE', 'DAY', 'GET', 'HIM', 'MAN', 'NEW', 'NOW', 'SUN', 'WAY', 'WHO', 'BOY', 'CAR', 'EAR', 'FAR', 'FUN', 'GOD', 'KEY', 'LEG', 'LET', 'RUN', 'SAY', 'TWO', 'YES'],
    4: ['THAT', 'WITH', 'HAVE', 'THIS', 'WILL', 'YOUR', 'FROM', 'THEY', 'BEEN', 'MORE', 'WHEN', 'MAKE', 'LIKE', 'WORD', 'TIME', 'VERY', 'JUST', 'KNOW', 'TAKE', 'GOOD', 'MUCH', 'SOME', 'WELL', 'ONLY', 'COME', 'MADE', 'FIND', 'OVER', 'SUCH', 'EVEN', 'YEAR', 'LONG', 'HERE', 'DOWN', 'HOME', 'WORK', 'BACK', 'CALL', 'HAND', 'HIGH', 'KEEP', 'LAST', 'LIFE', 'LOVE', 'OPEN', 'SAME', 'STOP', 'WANT', 'ABLE', 'NEED', 'SHOW', 'TELL', 'TURN', 'TYPE'],
    5: ['THERE', 'ABOUT', 'WOULD', 'WHICH', 'THEIR', 'THESE', 'COULD', 'OTHER', 'THINK', 'FIRST', 'AFTER', 'GREAT', 'WHILE', 'RIGHT', 'SMALL', 'PLACE', 'THOSE', 'THREE', 'WATER', 'WORLD', 'WHERE', 'YEARS', 'BEING', 'MIGHT', 'EVERY', 'HOUSE', 'NEVER', 'UNDER', 'FOUND', 'GOING', 'POINT', 'STILL', 'MAKES', 'MUSIC', 'OFTEN', 'SMILE', 'HOUSE', 'NIGHT', 'LIGHT', 'SIGHT', 'SOUND', 'SWEET', 'THING', 'WHOLE', 'HEART'],
  };

  return words;
};

/**
 * Solve puzzle using backtracking with constraint satisfaction
 * Returns placement map: slotId => word
 */
export const solvePuzzle = (slots, template, wordDictionary) => {
  const dictionary = wordDictionary || loadWordDictionary();
  const placement = new Map();
  const constraints = new Map();

  const backtrack = (slotIndex) => {
    if (slotIndex === slots.length) {
      // All slots filled!
      return true;
    }

    const slot = slots[slotIndex];
    const possibleWords = dictionary[slot.length] || [];

    // Try each word
    for (const word of possibleWords) {
      if (canPlaceWord(word, slot, constraints, template)) {
        // Place word
        placement.set(slot.id, word);
        const newConstraints = placeWord(word, slot, constraints, template);

        // Save old constraints for backtracking
        const oldConstraints = new Map(constraints);
        Object.assign(constraints, Object.fromEntries(newConstraints));

        // Recursively try to fill remaining slots
        if (backtrack(slotIndex + 1)) {
          return true;
        }

        // Backtrack
        placement.delete(slot.id);
        Object.assign(constraints, Object.fromEntries(oldConstraints));
      }
    }

    return false;
  };

  if (backtrack(0)) {
    return placement;
  }

  return null; // No solution found
};

// ============================================================================
// GRID GENERATION
// ============================================================================

/**
 * Generate a complete crossword puzzle
 * Returns: { grid, slots, template, placement, ... }
 */
export const generatePuzzle = (dateString) => {
  const template = getTemplateForDate(dateString);
  const slots = detectSlots(template);

  if (slots.length === 0) {
    throw new Error(`No valid slots detected for template ${template.id}`);
  }

  const dictionary = loadWordDictionary();
  const placement = solvePuzzle(slots, template, dictionary);

  if (!placement) {
    throw new Error(`Could not solve puzzle for template ${template.id}`);
  }

  // Build solution grid
  const solutionGrid = Array(template.height)
    .fill(null)
    .map(() => Array(template.width).fill(''));

  for (const [slotId, word] of placement) {
    const slot = slots.find(s => s.id === slotId);
    const cells = getSlotCells(slot, template);

    for (let i = 0; i < word.length; i++) {
      const cell = cells[i];
      solutionGrid[cell.row][cell.col] = word[i];
    }
  }

  // Create user display grid (blocks shown as "", open cells shown as "")
  const displayGrid = Array(template.height)
    .fill(null)
    .map(() => Array(template.width).fill(''));

  for (let r = 0; r < template.height; r++) {
    for (let c = 0; c < template.width; c++) {
      if (template.blocks[r][c]) {
        displayGrid[r][c] = '■'; // Block indicator
      }
    }
  }

  return {
    date: dateString,
    template: template,
    slots: slots,
    placement: placement,
    solutionGrid: solutionGrid,
    displayGrid: displayGrid,
    width: template.width,
    height: template.height,
  };
};

// ============================================================================
// PUZZLE VALIDATION
// ============================================================================

/**
 * Validate a generated puzzle - STRICT validation
 * Ensures word length ALWAYS matches slot length
 */
export const validatePuzzle = (puzzle) => {
  const errors = [];

  // Check all slots have words
  for (const slot of puzzle.slots) {
    if (!puzzle.placement.has(slot.id)) {
      errors.push(`Slot ${slot.id} (${slot.direction}) has no word`);
      continue;
    }
    
    // CRITICAL: Verify word length matches slot length exactly
    const word = puzzle.placement.get(slot.id);
    if (word.length !== slot.length) {
      errors.push(
        `SLOT-FIT ERROR: Slot ${slot.id} (${slot.direction}) ` +
        `has length ${slot.length} but word "${word}" has length ${word.length}`
      );
    }
  }

  // Check for conflicts
  const grid = Array(puzzle.height)
    .fill(null)
    .map(() => Array(puzzle.width).fill(''));

  for (const [slotId, word] of puzzle.placement) {
    const slot = puzzle.slots.find(s => s.id === slotId);
    if (!slot) {
      errors.push(`Word "${word}" references unknown slot ${slotId}`);
      continue;
    }
    
    const cells = getSlotCells(slot, puzzle.template);
    
    // Verify cells match word length
    if (cells.length !== word.length) {
      errors.push(
        `CELL-MISMATCH: Slot ${slot.id} has ${cells.length} cells but word "${word}" has ${word.length} letters`
      );
      continue;
    }

    for (let i = 0; i < word.length; i++) {
      const cell = cells[i];
      if (grid[cell.row][cell.col] && grid[cell.row][cell.col] !== word[i]) {
        errors.push(
          `Conflict at (${cell.row}, ${cell.col}): ` +
          `${grid[cell.row][cell.col]} vs ${word[i]}`
        );
      }
      grid[cell.row][cell.col] = word[i];
    }
  }

  // Check minimum across/down counts
  const acrossCount = puzzle.slots.filter(s => s.direction === 'across').length;
  const downCount = puzzle.slots.filter(s => s.direction === 'down').length;

  if (acrossCount < 3) {
    errors.push(`Too few across words: ${acrossCount}`);
  }
  if (downCount < 3) {
    errors.push(`Too few down words: ${downCount}`);
  }

  // Check for 1-letter words (shouldn't exist in slots, but be safe)
  for (const slot of puzzle.slots) {
    if (slot.length === 1) {
      errors.push(`Found 1-letter slot: ${slot.id}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors: errors
  };
};

// ============================================================================
// TIMER MANAGEMENT
// ============================================================================

/**
 * Timer state: tracks elapsed time across play sessions
 * Pauses when page loses focus
 */

export const initializeTimer = () => {
  return {
    sessionStartTime: Date.now(),
    totalElapsedSeconds: 0,
    isPaused: false,
    lastResumeTime: Date.now(),
  };
};

/**
 * Save timer state to localStorage
 */
export const saveTimerState = (puzzleDate, timerState) => {
  if (typeof window === 'undefined') return;

  try {
    const key = `crossword-timer-${puzzleDate}`;
    localStorage.setItem(key, JSON.stringify(timerState));
  } catch (error) {
    console.error('Failed to save timer state:', error);
  }
};

/**
 * Load timer state from localStorage
 */
export const loadTimerState = (puzzleDate) => {
  if (typeof window === 'undefined') return null;

  try {
    const key = `crossword-timer-${puzzleDate}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error('Failed to load timer state:', error);
  }

  return null;
};

/**
 * Calculate current elapsed time
 * Accounts for pauses and multiple sessions
 */
export const calculateElapsedTime = (timerState) => {
  if (!timerState) return 0;

  let elapsed = timerState.totalElapsedSeconds;

  if (!timerState.isPaused) {
    const now = Date.now();
    const currentSessionElapsed = Math.floor((now - timerState.lastResumeTime) / 1000);
    elapsed += currentSessionElapsed;
  }

  return elapsed;
};

/**
 * Pause the timer (called on visibility change)
 */
export const pauseTimer = (timerState) => {
  if (!timerState || timerState.isPaused) return timerState;

  const now = Date.now();
  const sessionElapsed = Math.floor((now - timerState.lastResumeTime) / 1000);

  return {
    ...timerState,
    totalElapsedSeconds: timerState.totalElapsedSeconds + sessionElapsed,
    isPaused: true,
    lastResumeTime: now
  };
};

/**
 * Resume the timer (called on visibility return)
 */
export const resumeTimer = (timerState) => {
  if (!timerState || !timerState.isPaused) return timerState;

  return {
    ...timerState,
    isPaused: false,
    lastResumeTime: Date.now()
  };
};

// ============================================================================
// FORMAT UTILITIES
// ============================================================================

/**
 * Format seconds to MM:SS
 */
export const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};
