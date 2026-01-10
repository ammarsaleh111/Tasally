import { ALLOWED_WORDS } from '../games/wordle/wordLists/allowedWords';
import { DAILY_WORDS } from '../games/wordle/wordLists/daily-2026-01';

// Internal list of words for fallback
const LOCAL_WORD_SET = new Set([...ALLOWED_WORDS, ...DAILY_WORDS].map(w => w.toUpperCase()));

/**
 * Validates a word using an external dictionary API.
 * Falls back to local list if API fails or returns error.
 * 
 * @param {string} word - The word to validate
 * @returns {Promise<boolean>} - True if valid, false otherwise
 */
export const validateWordAsync = async (word) => {
  const upperWord = word.toUpperCase();
  
  // 1. Check local list first (instant success)
  // This saves API calls for common valid words we already know
  if (LOCAL_WORD_SET.has(upperWord)) {
    return true;
  }

  // 2. If not in local list, check external API
  try {
    const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
    
    if (response.ok) {
        // API found the word
        // Add to local set for session caching
        LOCAL_WORD_SET.add(upperWord);
        return true;
    } else if (response.status === 404) {
        // API confirmed word does not exist
        return false;
    } else {
        // Other error (server error, rate limit), fallback to strictly local list
        console.warn("Dictionary API error, falling back to local list.");
        return LOCAL_WORD_SET.has(upperWord);
    }
  } catch (error) {
    console.error("Dictionary check failed:", error);
    return LOCAL_WORD_SET.has(upperWord);
  }
};
