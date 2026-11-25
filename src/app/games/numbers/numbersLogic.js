import { getUserStorageKey } from '@/utils/storageKeys';
import { loader as dailyData } from '@/data/all-data/games/numbers';
import { getCairoDateKey } from '@/data/all-data/utils/date';

// Operators
export const OPERATORS = ['+', '-', '×', '÷'];

/**
 * Get daily puzzle based on current date
 */
export const getDailyPuzzle = () => {
  const dateKey = getCairoDateKey();
  const entry = dailyData.getDailyGameData(dateKey);
  return {
    date: dateKey,
    ...entry,
  };
};

/**
 * Evaluate a mathematical expression
 * @param {string} expression - Expression like "100 + 50 × 2"
 * @returns {number|null} - Result or null if invalid
 */
export const evaluateExpression = (expression) => {
  try {
    const normalized = expression
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/\s/g, '');

    if (!/^[0-9+\-*/().]+$/.test(normalized)) {
      return null;
    }

    let index = 0;

    const parseNumber = () => {
      const start = index;
      while (index < normalized.length && /[0-9]/.test(normalized[index])) {
        index++;
      }
      if (start === index) return null;
      return Number(normalized.slice(start, index));
    };

    const parseFactor = () => {
      if (normalized[index] === '(') {
        index++;
        const value = parseExpressionInternal();
        if (value === null || normalized[index] !== ')') return null;
        index++;
        return value;
      }

      if (normalized[index] === '-') {
        index++;
        const value = parseFactor();
        return value === null ? null : -value;
      }

      return parseNumber();
    };

    const parseTerm = () => {
      let value = parseFactor();
      if (value === null) return null;

      while (index < normalized.length) {
        const operator = normalized[index];
        if (operator !== '*' && operator !== '/') break;
        index++;
        const rhs = parseFactor();
        if (rhs === null) return null;

        if (operator === '*') {
          value *= rhs;
        } else {
          if (rhs === 0) return null;
          if (value % rhs !== 0) return null;
          value /= rhs;
        }
      }

      return value;
    };

    const parseExpressionInternal = () => {
      let value = parseTerm();
      if (value === null) return null;

      while (index < normalized.length) {
        const operator = normalized[index];
        if (operator !== '+' && operator !== '-') break;
        index++;
        const rhs = parseTerm();
        if (rhs === null) return null;
        value = operator === '+' ? value + rhs : value - rhs;
      }

      return value;
    };

    const result = parseExpressionInternal();
    if (result === null || index !== normalized.length) return null;
    if (typeof result === 'number' && !isNaN(result) && isFinite(result)) return result;
    return null;
  } catch (error) {
    return null;
  }
};

/**
 * Check if numbers in expression match available numbers (each used at most once)
 * @param {string} expression - Expression like "100 + 50 × 2"
 * @param {number[]} availableNumbers - Numbers that can be used
 * @returns {boolean} - True if valid
 */
export const validateNumbersUsed = (expression, availableNumbers) => {
  // Extract all numbers from expression
  const usedNumbers = expression.match(/\d+/g)?.map(Number) || [];
  
  // Create a copy of available numbers
  const remaining = [...availableNumbers];
  
  // Check each used number
  for (const num of usedNumbers) {
    const index = remaining.indexOf(num);
    if (index === -1) {
      return false; // Number not available or already used
    }
    remaining.splice(index, 1); // Remove from available
  }
  
  return true;
};

/**
 * Check if the expression reaches the target
 * @param {string} expression
 * @param {number} target
 * @param {number[]} availableNumbers
 * @returns {object} - {valid, result, isExact, difference}
 */
export const checkSolution = (expression, target, availableNumbers) => {
  // Check if numbers used are valid
  if (!validateNumbersUsed(expression, availableNumbers)) {
    return {
      valid: false,
      result: null,
      isExact: false,
      difference: null,
      error: 'Invalid numbers used'
    };
  }
  
  // Evaluate the expression
  const result = evaluateExpression(expression);
  
  if (result === null) {
    return {
      valid: false,
      result: null,
      isExact: false,
      difference: null,
      error: 'Invalid expression'
    };
  }
  
  const isExact = result === target;
  const difference = Math.abs(result - target);
  
  return {
    valid: true,
    result,
    isExact,
    difference
  };
};

/**
 * Calculate two numbers with an operator
 * @param {number} a
 * @param {number} b
 * @param {string} operator
 * @returns {number|null}
 */
export const calculate = (a, b, operator) => {
  switch (operator) {
    case '+':
      return a + b;
    case '-':
      return a - b;
    case '×':
      return a * b;
    case '÷':
      if (b === 0) return null;
      if (a % b !== 0) return null;
      return a / b;
    default:
      return null;
  }
};

/**
 * Format expression for display
 * @param {Array} steps - Array of {operation, result}
 * @returns {string}
 */
export const formatExpression = (steps) => {
  return steps.map(step => step.operation).join(' → ');
};

/**
 * Get hint for the puzzle (shows first step of solution)
 * @param {object} puzzle
 * @returns {string}
 */
export const getHint = (puzzle) => {
  if (!puzzle.solution) return "Try combining the larger numbers first!";
  
  // Extract first operation from solution
  const firstOp = puzzle.solution.split(/[→,]/)[0] || puzzle.solution.substring(0, 20);
  return `Hint: Try starting with ${firstOp}...`;
};

/**
 * Generate random puzzle
 * @returns {object}
 */
export const generateRandomPuzzle = () => {
  // Small numbers (1-10)
  const small = Array.from({ length: 4 }, () => Math.floor(Math.random() * 10) + 1);
  
  // Large numbers (25, 50, 75, 100)
  const largeOptions = [25, 50, 75, 100];
  const large = Array.from({ length: 2 }, () => 
    largeOptions[Math.floor(Math.random() * largeOptions.length)]
  );
  
  const numbers = [...small, ...large];
  const target = Math.floor(Math.random() * 900) + 100; // 100-999
  
  return {
    date: getCairoDateKey(),
    target,
    numbers,
    solution: null // Random puzzles don't have pre-made solutions
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
    averageSteps: 0,
    perfectSolves: 0,
    lastPlayed: null
  };
};

/**
 * Load stats from localStorage
 */
export const loadStats = () => {
  if (typeof window === 'undefined') return getDefaultStats();
  
  try {
    const saved = localStorage.getItem(getUserStorageKey('tasally-numbers-stats'));
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
    localStorage.setItem(getUserStorageKey('tasally-numbers-stats'), JSON.stringify(stats));
  } catch (error) {
    console.error('Error saving stats:', error);
  }
};

/**
 * Update stats after a game
 */
export const updateStats = (currentStats, won, steps) => {
  const today = getCairoDateKey();
  const lastPlayed = currentStats.lastPlayed;
  const [year, month, day] = today.split('-').map(Number);
  const yesterdayDate = new Date(Date.UTC(year, month - 1, day));
  yesterdayDate.setUTCDate(yesterdayDate.getUTCDate() - 1);
  const yesterday = yesterdayDate.toISOString().split('T')[0];
  
  const newStats = {
    played: currentStats.played + 1,
    won: currentStats.won + (won ? 1 : 0),
    perfectSolves: currentStats.perfectSolves + (won && steps <= 3 ? 1 : 0),
    lastPlayed: today
  };
  
  // Calculate streak
  if (won) {
    if (lastPlayed === today) {
      // Same day, don't increment
      newStats.currentStreak = currentStats.currentStreak;
    } else if (lastPlayed === yesterday) {
      newStats.currentStreak = currentStats.currentStreak + 1;
    } else {
      newStats.currentStreak = 1;
    }
  } else {
    newStats.currentStreak = 0;
  }
  
  newStats.maxStreak = Math.max(currentStats.maxStreak, newStats.currentStreak);
  
  // Calculate average steps
  const totalWinningSteps = (currentStats.averageSteps * currentStats.won) + (won ? steps : 0);
  newStats.averageSteps = newStats.won > 0 ? Math.round(totalWinningSteps / newStats.won) : 0;
  
  return newStats;
};
