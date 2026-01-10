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

  // 2. Check external API with a fast timeout to keep UX snappy
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 400); // hard cap latency

  try {
    const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}` , {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      LOCAL_WORD_SET.add(upperWord); // cache success
      return true;
    }

    if (response.status === 404) {
      return false;
    }

    // Other status: treat as invalid but do not cache
    return false;
  } catch (error) {
    clearTimeout(timeoutId);
    // Timeout or network error: treat as invalid to keep UX deterministic
    return false;
  }
};
