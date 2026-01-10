import { NUMBERS_PUZZLES } from './puzzles/numbers-2026-01';

// Operators
export const OPERATORS = ['+', '-', '×', '÷'];

/**
 * Get daily puzzle based on current date
 */
export const getDailyPuzzle = () => {
  const today = new Date();
  const dayIndex = today.getDate() - 1;
  const safeIndex = dayIndex % NUMBERS_PUZZLES.length;
  return NUMBERS_PUZZLES[safeIndex];
};

/**
 * Evaluate a mathematical expression
 * @param {string} expression - Expression like "100 + 50 × 2"
 * @returns {number|null} - Result or null if invalid
 */
export const evaluateExpression = (expression) => {
  try {
    // Replace × and ÷ with * and /
    const normalized = expression
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/\s/g, '');
    
    // Security check: only allow numbers, operators, and parentheses
    if (!/^[0-9+\-*/().\s]+$/.test(normalized)) {
      return null;
    }
    
    // Use Function constructor for safe evaluation
    const result = Function('"use strict"; return (' + normalized + ')')();
    
    // Check if result is a valid number
    if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
      return Math.round(result * 100) / 100; // Round to 2 decimal places
    }
    
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
    date: new Date().toISOString().split('T')[0],
    target,
    numbers,
    solution: null // Random puzzles don't have pre-made solutions
  };
};
