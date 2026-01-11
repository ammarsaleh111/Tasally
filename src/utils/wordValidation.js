import { isWordInLocalDictionary, addWordToLocalDictionary } from './localDictionary';

const validationCache = new Map();

function normalizeWord(word = '') {
  return word.trim().toLowerCase();
}

/**
 * Rapidly filters out obvious garbage strings without dictionary lookup.
 * @param {string} word - The word to check
 * @returns {boolean} - True if the word is plausible English
 */
export function passesGarbageFilter(word) {
  const w = normalizeWord(word);
  if (!w) return false;
  if (w.length < 2) return false; // Basic length check (Wordle usually 5, but generalized)

  // 1. Check for 3+ identical letters in a row (e.g. "dddd", "aaass")
  if (/(.)\1\1/.test(w)) return false;

  // 2. Check for at least one vowel (y is included as vowel-like for this check)
  // "crwth" is valid in some dictionaries but very rare; user rule: "No vowel (a e i o u y)"
  if (!/[aeiouy]/.test(w)) return false;

  // 3. Check for impossible q-u pattern (q not followed by u)
  if (/q(?!u)/.test(w)) return false;

  // 4. Basic charset check (already handled by regex elsewhere but good to be safe)
  if (!/^[a-z]+$/.test(w)) return false;

  return true;
}

export function isWordLocallyKnown(word) {
  const normalized = normalizeWord(word);
  if (!normalized) return false;
  return isWordInLocalDictionary(normalized);
}

export function primeValidationCache(word, result) {
  const normalized = normalizeWord(word);
  if (!normalized) return;
  validationCache.set(normalized, !!result);
  if (result) {
    addWordToLocalDictionary(normalized);
  }
}

/**
 * Validates a word using the 3-layer architecture:
 * 1. Garbage Filter (Instant Reject)
 * 2. Local Dictionary (Instant Accept)
 * 3. Remote API (Provisional Accept -> Async Verify)
 */
export async function validateWordAsync(word) {
  const normalized = normalizeWord(word);
  
  // 1. Garbage Filter
  if (!passesGarbageFilter(normalized)) {
    return { valid: false, source: 'garbage-filter' };
  }

  // 2. Local Dictionary (Server-side context doesn't usually use this client lib in the same way, but keeping check)
  if (typeof window === 'undefined') {
    return { valid: isWordInLocalDictionary(normalized), source: 'local' };
  }

  // Check Cache
  if (validationCache.has(normalized)) {
    return { valid: validationCache.get(normalized), source: 'cache' };
  }

  // Local Dictionary check
  if (isWordInLocalDictionary(normalized)) {
    validationCache.set(normalized, true);
    return { valid: true, source: 'local' };
  }

  // 3. Fallback: Async Validation (Blocks for unknown words)
  try {
    const response = await fetch('/api/word-validation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ word: normalized }),
    });

    if (!response.ok) {
      console.error('[wordValidation] API error', response.status);
      validationCache.set(normalized, false);
      return { valid: false, source: 'api-error' };
    }

    const payload = await response.json();
    validationCache.set(normalized, !!payload.valid);
    if (payload.valid) {
      addWordToLocalDictionary(normalized);
    }
    return { valid: !!payload.valid, source: payload.source || 'remote' };
  } catch (error) {
    console.error('[wordValidation] Network error', error.message);
    validationCache.set(normalized, false);
    return { valid: false, source: 'network-error' };
  }
}
