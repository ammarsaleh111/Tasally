/**
 * SPELLING BEE — LETTER-PROGRESSIVE HINTS
 * 
 * No descriptions. No "starts with X". Just letters.
 * 
 * Progression:
 *   S _ _ _ _ _
 *   S T _ _ _ _
 *   S T R _ _ _
 *   S T R O _ _
 *   S T R O N _
 *   S T R O N G
 * 
 * Player-aware: skips letters the player already typed.
 * Never repeats. Always moves forward.
 */

import {
  getHintState,
  saveHintState,
  selectWordForNextHint,
  getWordHintLevel
} from './hintEngine';

// ============================================================================
// LETTER PATTERN GENERATOR
// ============================================================================

/**
 * Generate letter pattern with revealed letters
 * @param {string} word - Target word
 * @param {number} revealCount - How many letters to reveal from start
 * @returns {string} - Pattern like "S T R _ _ _"
 */
const generateLetterPattern = (word, revealCount) => {
  const letters = word.toUpperCase().split('');
  const pattern = letters.map((letter, index) => {
    if (index < revealCount) {
      return letter;
    }
    return '_';
  });
  return pattern.join(' ');
};

/**
 * Calculate how many letters player has correctly typed from the start
 * @param {string} word - Target word
 * @param {string} playerInput - What player typed
 * @returns {number} - Count of correct letters from start
 */
const getPlayerProgress = (word, playerInput) => {
  const wordUpper = word.toUpperCase();
  const inputUpper = (playerInput || '').toUpperCase();
  
  let matchCount = 0;
  for (let i = 0; i < Math.min(wordUpper.length, inputUpper.length); i++) {
    if (wordUpper[i] === inputUpper[i]) {
      matchCount++;
    } else {
      break; // Stop at first mismatch
    }
  }
  return matchCount;
};

/**
 * Get next reveal count considering player progress
 * @param {number} currentRevealCount - Letters already revealed by hints
 * @param {number} playerProgress - Letters player has typed correctly
 * @returns {number} - Next reveal target
 */
const getNextRevealCount = (currentRevealCount, playerProgress) => {
  // Reveal at least one more than current max of (hints given, player typed)
  const currentMax = Math.max(currentRevealCount, playerProgress);
  return currentMax + 1;
};

// ============================================================================
// MAIN HINT GENERATOR
// ============================================================================

/**
 * Generate next letter-progressive hint for Spelling Bee
 * @param {string} puzzleId - Unique puzzle identifier
 * @param {string[]} targetWords - All valid words in puzzle
 * @param {string[]} foundWords - Words already found
 * @param {string} playerInput - Current text player has typed (centerLetter param repurposed)
 * @returns {Object} - { pattern, word, revealCount, isComplete, totalHintsUsed }
 */
export const getNextSpellingBeeHint = (puzzleId, targetWords, foundWords, playerInput = '') => {
  // Validate inputs
  if (!puzzleId || !targetWords || targetWords.length === 0) {
    return {
      pattern: 'No words available',
      hint: 'No words available',
      word: null,
      revealCount: 0,
      isComplete: false,
      totalHintsUsed: 0
    };
  }
  
  // Load hint state
  let hintState = getHintState(puzzleId, targetWords);
  
  // Find unfound words
  const foundSet = new Set((foundWords || []).map(w => w.toUpperCase()));
  const unfoundWords = targetWords.filter(w => !foundSet.has(w.toUpperCase()));
  
  if (unfoundWords.length === 0) {
    return {
      pattern: 'All words found! 🎉',
      hint: 'All words found! 🎉',
      word: null,
      revealCount: 0,
      isComplete: true,
      totalHintsUsed: hintState.totalHintsUsed
    };
  }
  
  // Select word - prefer one matching player input
  let targetWord = null;
  
  // First, check if player input matches start of any unfound word
  if (playerInput && playerInput.length >= 1) {
    const inputUpper = playerInput.toUpperCase();
    const matchingWord = unfoundWords.find(w => 
      w.toUpperCase().startsWith(inputUpper)
    );
    if (matchingWord) {
      targetWord = matchingWord.toUpperCase();
    }
  }
  
  // If no match, use standard selection (prioritizing active hints)
  if (!targetWord) {
     // UPDATED LOGIC: Prioritize currently hinted words over rotating
    // 1. Look for started words (0 < level < max)
    const startedWords = [];
    for (const word of unfoundWords) {
      const currentLevel = getWordHintLevel(hintState, word);
      if (currentLevel > 0 && currentLevel < word.length) {
        startedWords.push({ word, level: currentLevel });
      }
    }
    
    if (startedWords.length > 0) {
      // Continue with the most revealed word
      startedWords.sort((a, b) => b.level - a.level);
      targetWord = startedWords[0].word;
    } else {
      // 2. Pick a fresh word
      targetWord = selectWordForNextHint(hintState, foundWords, 100);
    }
  }
  
  if (!targetWord) {
    return {
      pattern: 'No more hints available',
      hint: 'No more hints available',
      word: null,
      revealCount: 0,
      isComplete: false,
      totalHintsUsed: hintState.totalHintsUsed
    };
  }
  
  // Get current reveal count for this word
  const currentRevealCount = getWordHintLevel(hintState, targetWord);
  
  // Get player progress on this word
  const playerProgress = playerInput ? getPlayerProgress(targetWord, playerInput) : 0;
  
  // Calculate next reveal count
  const nextRevealCount = getNextRevealCount(currentRevealCount, playerProgress);
  
  // Cap at word length
  const finalRevealCount = Math.min(nextRevealCount, targetWord.length);
  
  // Generate pattern
  const pattern = generateLetterPattern(targetWord, finalRevealCount);
  
  // Record hint usage (only if we're revealing new letters beyond current state)
  if (finalRevealCount > currentRevealCount) {
    const newWordState = {
      ...hintState.words[targetWord],
      currentLevel: finalRevealCount
    };
    
    hintState = {
      ...hintState,
      words: {
        ...hintState.words,
        [targetWord]: newWordState
      },
      totalHintsUsed: hintState.totalHintsUsed + 1,
      lastHintTime: Date.now()
    };
    
    saveHintState(puzzleId, hintState);
  }
  
  return {
    pattern,
    hint: pattern, // For compatibility
    word: targetWord,
    revealCount: finalRevealCount,
    isComplete: finalRevealCount >= targetWord.length,
    totalHintsUsed: hintState.totalHintsUsed,
    wordLength: targetWord.length
  };
};

/**
 * Get hint button display for Spelling Bee
 * @param {string} puzzleId - Unique puzzle identifier
 * @param {string[]} targetWords - All valid words
 * @param {string[]} foundWords - Found words
 * @returns {string} - Button text
 */
export const getSpellingBeeHintButtonText = (puzzleId, targetWords, foundWords) => {
  if (!targetWords || targetWords.length === 0) {
    return 'No Hints';
  }
  
  const hintState = getHintState(puzzleId, targetWords);
  const foundSet = new Set((foundWords || []).map(w => w.toUpperCase()));
  const unfoundWords = targetWords.filter(w => !foundSet.has(w.toUpperCase()));
  
  if (unfoundWords.length === 0) {
    return 'All Found!';
  }
  
  // Find the word that would get the next hint
  const maxLevel = Math.max(...unfoundWords.map(w => w.length));
  const nextWord = selectWordForNextHint(hintState, foundWords, maxLevel);
  
  if (!nextWord) {
    return 'No Hints Left';
  }
  
  const currentLevel = getWordHintLevel(hintState, nextWord);
  const wordLength = nextWord.length;
  
  if (currentLevel >= wordLength) {
    return 'Reveal Letter';
  }
  
  return `Reveal Letter (${currentLevel + 1}/${wordLength})`;
};

// ============================================================================
// EXPORTS
// ============================================================================

const spellingBeeHints = {
  getNextSpellingBeeHint,
  getSpellingBeeHintButtonText
};

export default spellingBeeHints;
