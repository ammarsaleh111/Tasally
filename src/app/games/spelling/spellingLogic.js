/**
 * Spelling Bee Game Logic
 * Word formation game with center letter requirement
 */

import { isWordInLocalDictionary } from '@/utils/localDictionary';

/**
 * Rank thresholds as percentage of max possible score
 */
export const RANK_TIERS = [
  { name: 'Beginner', threshold: 0, color: '#9ca3af' },
  { name: 'Good', threshold: 0.02, color: '#60a5fa' },
  { name: 'Solid', threshold: 0.05, color: '#34d399' },
  { name: 'Nice', threshold: 0.08, color: '#fbbf24' },
  { name: 'Great', threshold: 0.15, color: '#fb923c' },
  { name: 'Amazing', threshold: 0.25, color: '#f87171' },
  { name: 'Genius', threshold: 0.50, color: '#a78bfa' },
  { name: 'Queen Bee', threshold: 0.70, color: '#fbbf24' }
];

/**
 * Calculate points for a word
 */
export function calculateWordPoints(word, isPangram) {
  const length = word.length;
  let points = 0;
  
  if (length === 4) {
    points = 1;
  } else {
    points = length;
  }
  
  // Pangram bonus
  if (isPangram) {
    points += 7;
  }
  
  return points;
}

/**
 * Check if word is a pangram (uses all 7 letters)
 */
export function isPangram(word, allLetters) {
  const uniqueLetters = new Set(word.toUpperCase().split(''));
  return allLetters.every(letter => uniqueLetters.has(letter));
}

/**
 * Validate a word submission
 */
export function validateWord(word, centerLetter, allowedLetters, validWords, foundWords) {
  const upperWord = word.toUpperCase();
  
  // Check minimum length
  if (word.length < 4) {
    return { valid: false, message: 'Too short (minimum 4 letters)' };
  }
  
  // Check if already found
  if (foundWords.includes(upperWord)) {
    return { valid: false, message: 'Already found!' };
  }
  
  // Check if contains center letter
  if (!upperWord.includes(centerLetter.toUpperCase())) {
    return { valid: false, message: 'Missing center letter' };
  }
  
  // Check if uses only allowed letters
  const wordLetters = upperWord.split('');
  const allowed = allowedLetters.map(l => l.toUpperCase());
  const invalidLetter = wordLetters.find(l => !allowed.includes(l));
  if (invalidLetter) {
    return { valid: false, message: `Invalid letter: ${invalidLetter}` };
  }
  
  // Check if word is in valid word list
  if (!validWords.includes(upperWord)) {
    if (!isWordInLocalDictionary(word)) {
      return { valid: false, message: 'Not a valid English word' };
    }
    return { valid: false, message: 'Valid word, but not in today\'s list' };
  }
  
  return { valid: true, message: 'Good!' };
}

/**
 * Calculate maximum possible score
 */
export function calculateMaxScore(validWords, allLetters) {
  return validWords.reduce((total, word) => {
    const points = calculateWordPoints(word, isPangram(word, allLetters));
    return total + points;
  }, 0);
}

/**
 * Get current rank based on score
 */
export function getCurrentRank(score, maxScore) {
  const percentage = maxScore > 0 ? score / maxScore : 0;
  
  // Find highest rank achieved
  for (let i = RANK_TIERS.length - 1; i >= 0; i--) {
    if (percentage >= RANK_TIERS[i].threshold) {
      return {
        ...RANK_TIERS[i],
        percentage,
        nextRank: i < RANK_TIERS.length - 1 ? RANK_TIERS[i + 1] : null
      };
    }
  }
  
  return {
    ...RANK_TIERS[0],
    percentage,
    nextRank: RANK_TIERS[1]
  };
}

/**
 * Shuffle array (Fisher-Yates)
 */
export function shuffleLetters(letters) {
  const arr = [...letters];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Get hint - first letter of unfound word
 */
export function getHint(validWords, foundWords) {
  const unfound = validWords.filter(word => !foundWords.includes(word));
  if (unfound.length === 0) return null;
  
  const randomWord = unfound[Math.floor(Math.random() * unfound.length)];
  return randomWord[0];
}

/**
 * Get words grouped by starting letter
 */
export function getWordsByFirstLetter(words) {
  const grouped = {};
  words.forEach(word => {
    const firstLetter = word[0];
    if (!grouped[firstLetter]) {
      grouped[firstLetter] = [];
    }
    grouped[firstLetter].push(word);
  });
  return grouped;
}

/**
 * Calculate game statistics
 */
export function calculateStats(foundWords, validWords, allLetters, score, maxScore) {
  const pangramCount = foundWords.filter(word => isPangram(word, allLetters)).length;
  const totalPangrams = validWords.filter(word => isPangram(word, allLetters)).length;
  const rank = getCurrentRank(score, maxScore);
  
  return {
    wordsFound: foundWords.length,
    totalWords: validWords.length,
    pangramsFound: pangramCount,
    totalPangrams,
    score,
    maxScore,
    percentage: maxScore > 0 ? Math.round((score / maxScore) * 100) : 0,
    rank: rank.name,
    isComplete: foundWords.length === validWords.length
  };
}

/**
 * Generate share text
 */
export function generateShareText(stats, date) {
  const emoji = stats.pangramsFound > 0 ? '🐝' : '🔤';
  const rank = stats.rank === 'Queen Bee' ? '👑' : stats.rank;
  
  return `Ammar Times Spelling Bee
${emoji} Score: ${stats.score}/${stats.maxScore}
Rank: ${rank}
Words: ${stats.wordsFound}/${stats.totalWords}
${stats.pangramsFound > 0 ? `Pangram${stats.pangramsFound > 1 ? 's' : ''} found! ✨` : ''}

Play at ammartimes.com`;
}
