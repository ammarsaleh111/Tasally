import { isWordInLocalDictionary, addWordToLocalDictionary } from './localDictionary';

const validationCache = new Map();

function normalizeWord(word = '') {
  return word.trim().toLowerCase();
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

export async function validateWordAsync(word) {
  const normalized = normalizeWord(word);
  if (!normalized || !/^[a-z]+$/.test(normalized)) {
    return { valid: false, source: 'input' };
  }

  if (typeof window === 'undefined') {
    return { valid: isWordInLocalDictionary(normalized), source: 'local' };
  }

  if (validationCache.has(normalized)) {
    return { valid: validationCache.get(normalized), source: 'cache' };
  }

  if (isWordInLocalDictionary(normalized)) {
    validationCache.set(normalized, true);
    return { valid: true, source: 'local' };
  }

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
    console.error('[wordValidation] Network error, rejecting word', { word: normalized, error: error.message });
    validationCache.set(normalized, false);
    return { valid: false, source: 'network-error' };
  }
}
