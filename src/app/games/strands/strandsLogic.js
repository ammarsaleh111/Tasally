// Pure functions for Strands game logic

export const serializePos = (r, c) => `${r},${c}`;
export const parsePos = (s) => s.split(',').map(Number);

export function isAdjacent(a, b) {
  const [r1, c1] = a;
  const [r2, c2] = b;
  const dr = Math.abs(r1 - r2);
  const dc = Math.abs(c1 - c2);
  return dr <= 1 && dc <= 1 && !(dr === 0 && dc === 0);
}

// Find all possible paths for a word in the grid using DFS
function findWordPath(grid, word, startR, startC, visited = new Set()) {
  if (word.length === 0) return [];
  if (grid[startR][startC].toUpperCase() !== word[0].toUpperCase()) return null;
  
  if (word.length === 1) {
    return [[startR, startC]];
  }
  
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
    const subPath = findWordPath(grid, word.slice(1), nr, nc, newVisited);
    if (subPath) {
      return [[startR, startC], ...subPath];
    }
  }
  
  return null;
}

// Check if a word exists anywhere in the grid
export function canFindWord(grid, word) {
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[r].length; c++) {
      if (grid[r][c].toUpperCase() === word[0].toUpperCase()) {
        const path = findWordPath(grid, word, r, c);
        if (path) return true;
      }
    }
  }
  return false;
}

// Validate entire puzzle
export function validatePuzzle(puzzle) {
  const errors = [];
  
  if (!puzzle.grid || !Array.isArray(puzzle.grid)) {
    errors.push('Invalid grid structure');
    return { valid: false, errors };
  }
  
  // Check all theme words
  for (const word of puzzle.words || []) {
    if (word.length < 4) {
      errors.push(`Word "${word}" is too short (minimum 4 letters)`);
    }
    if (!canFindWord(puzzle.grid, word)) {
      errors.push(`Word "${word}" cannot be found in grid`);
    }
  }
  
  // Check spangram
  if (puzzle.spangram) {
    if (!canFindWord(puzzle.grid, puzzle.spangram)) {
      errors.push(`Spangram "${puzzle.spangram}" cannot be found in grid`);
    }
  }
  
  return { valid: errors.length === 0, errors };
}

export function pathToWord(grid, path) {
  return path.map(([r, c]) => grid[r][c]).join('');
}

export function touchesOppositeSides(path, size) {
  let minR = Infinity, maxR = -Infinity, minC = Infinity, maxC = -Infinity;
  for (const [r, c] of path) {
    if (r < minR) minR = r;
    if (r > maxR) maxR = r;
    if (c < minC) minC = c;
    if (c > maxC) maxC = c;
  }
  const touchesLeftRight = minC === 0 && maxC === size - 1;
  const touchesTopBottom = minR === 0 && maxR === size - 1;
  return touchesLeftRight || touchesTopBottom;
}

export function validateSelection(grid, path, puzzle, foundWordsSet, spangramFound) {
  if (!path || path.length < 2) return { type: 'invalid' };
  // No letter reuse in same word
  const seen = new Set();
  for (const pos of path) {
    const key = serializePos(pos[0], pos[1]);
    if (seen.has(key)) return { type: 'invalid' };
    seen.add(key);
  }

  const word = pathToWord(grid, path).toUpperCase();
  if (word.length < 4) return { type: 'too-short' };

  // Spangram check first so it's not mistaken for a theme word
  if (!spangramFound && word === puzzle.spangram.toUpperCase() && touchesOppositeSides(path, grid.length)) {
    return { type: 'spangram', word, path };
  }

  const inTheme = puzzle.words.map(w => w.toUpperCase());
  if (inTheme.includes(word) && !foundWordsSet.has(word)) {
    return { type: 'word', word, path };
  }

  return { type: 'invalid' };
}

export function getHint(puzzle, foundWordsSet, spangramFound) {
  // Prefer hinting theme words first
  const remaining = puzzle.words.filter(w => !foundWordsSet.has(w.toUpperCase()));
  if (remaining.length > 0) {
    const choice = remaining[Math.floor(Math.random() * remaining.length)];
    return { type: 'word-letter', letter: choice[0].toUpperCase(), wordLength: choice.length };
  }
  if (!spangramFound) {
    // Minimal spangram hint
    return { type: 'spangram-letter', letter: puzzle.spangram[0].toUpperCase() };
  }
  return { type: 'none' };
}

export function loadProgress(dateStr) {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(`strands-${dateStr}`);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export function saveProgress(dateStr, state) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`strands-${dateStr}`, JSON.stringify(state));
}
