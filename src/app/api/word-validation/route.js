import { NextResponse } from 'next/server';
import { isWordInLocalDictionary, addWordToLocalDictionary } from '@/utils/localDictionary';

const WORDNIK_ENDPOINT = 'https://api.wordnik.com/v4/word.json';
const DATAMUSE_ENDPOINT = 'https://api.datamuse.com/words';
const CACHE = new Map();
const REQUEST_TIMEOUT_MS = 1500;

function normalizeWord(raw = '') {
  return raw.trim().toLowerCase();
}

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeout);
  }
}

async function validateWithWordnik(word) {
  const apiKey = process.env.WORDNIK_API_KEY;
  if (!apiKey) return { valid: false, error: 'missing-key' };

  try {
    const response = await fetchWithTimeout(
      `${WORDNIK_ENDPOINT}/${encodeURIComponent(word)}/definitions?limit=1&api_key=${apiKey}`
    );

    if (response.ok) {
      return { valid: true, source: 'wordnik' };
    }

    if (response.status === 404) {
      return { valid: false, source: 'wordnik' };
    }

    return { valid: false, error: `wordnik-${response.status}` };
  } catch (error) {
    return { valid: false, error: 'wordnik-network', details: error.message };
  }
}

async function validateWithDatamuse(word) {
  try {
    // Request strict match by using max=1 and checking result
    const response = await fetchWithTimeout(
      `${DATAMUSE_ENDPOINT}?sp=${encodeURIComponent(word)}&max=1`
    );

    if (!response.ok) {
      return { valid: false, error: `datamuse-${response.status}` };
    }

    const data = await response.json();
    // Datamuse 'sp' can return partial matches or corrections (e.g., "ddddd" -> "dddd")
    // We must ensure strict equality.
    if (Array.isArray(data) && data.length > 0) {
      const bestMatch = data[0].word.toLowerCase();
      if (bestMatch === word.toLowerCase()) {
         return { valid: true, source: 'datamuse' };
      }
    }
    
    return { valid: false, source: 'datamuse' };
  } catch (error) {
    return { valid: false, error: 'datamuse-network', details: error.message };
  }
}

export async function POST(request) {
  const { word } = await request.json().catch(() => ({ word: '' }));
  const normalized = normalizeWord(word);

  console.log('[word-validation] Validating word:', normalized);

  if (!normalized || !/^[a-z]+$/i.test(normalized)) {
    console.log('[word-validation] Invalid input:', normalized);
    return NextResponse.json({ valid: false, reason: 'invalid-input' }, { status: 400 });
  }

  if (CACHE.has(normalized)) {
    const cached = CACHE.get(normalized);
    console.log('[word-validation] Cache hit:', normalized, '→', cached);
    return NextResponse.json({ valid: cached, source: 'cache' });
  }

  const inLocalDict = isWordInLocalDictionary(normalized);
  console.log('[word-validation] Local dictionary check:', normalized, '→', inLocalDict);
  
  if (inLocalDict) {
    CACHE.set(normalized, true);
    return NextResponse.json({ valid: true, source: 'local' });
  }

  let validationResult = await validateWithWordnik(normalized);
  console.log('[word-validation] Wordnik result:', validationResult);
  
  if (validationResult.valid) {
    CACHE.set(normalized, true);
    addWordToLocalDictionary(normalized);
    return NextResponse.json({ valid: true, source: validationResult.source });
  }

  if (validationResult.error === 'missing-key') {
    console.log('[word-validation] Wordnik API key missing, trying Datamuse');
  }

  const datamuseResult = await validateWithDatamuse(normalized);
  console.log('[word-validation] Datamuse result:', datamuseResult);
  
  if (datamuseResult.valid) {
    CACHE.set(normalized, true);
    addWordToLocalDictionary(normalized);
    return NextResponse.json({ valid: true, source: datamuseResult.source });
  }

  console.log('[word-validation] Word NOT found, rejecting:', normalized);
  CACHE.set(normalized, false);
  return NextResponse.json({ valid: false, source: 'remote' });
}
