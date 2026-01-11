import { NextResponse } from 'next/server';
import { isWordInLocalDictionary, addWordToLocalDictionary } from '@/utils/localDictionary';
import { sanitizeWord, isRateLimited } from '@/utils/inputSanitizer';

const WORDNIK_ENDPOINT = 'https://api.wordnik.com/v4/word.json';
const CACHE = new Map();
const REQUEST_TIMEOUT_MS = 1500;

// Rate limiting: 20 requests per minute per IP
const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_WINDOW = 60000; // 1 minute

function getClientIdentifier(request) {
  // Get IP address from headers (works with proxies)
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : 
             request.headers.get('x-real-ip') || 'unknown';
  return `word-validation:${ip}`;
}

function normalizeWord(raw = '') {
  return raw.trim().toLowerCase();
}

function passesGarbageFilter(word) {
  if (!word || word.length < 2) return false;
  if (/(.)\1\1/.test(word)) return false; // 3 identical chars
  if (!/[aeiouy]/.test(word)) return false; // No vowels
  if (/q(?!u)/.test(word)) return false; // q without u
  return true;
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
    // Sanitize word before using in URL to prevent injection
    const safeWord = encodeURIComponent(word);
    
    const response = await fetchWithTimeout(
      `${WORDNIK_ENDPOINT}/${safeWord}/definitions?limit=1&api_key=${apiKey}`
    );

    if (response.ok) {
      return { valid: true, source: 'wordnik' };
    }

    if (response.status === 404) {
      return { valid: false, source: 'wordnik' };
    }

    return { valid: false, error: `wordnik-${response.status}` };
  } catch (error) {
    // Don't leak error details to client
    return { valid: false, error: 'wordnik-network' };
  }
}

export async function POST(request) {
  // 1. Rate limiting check
  const clientId = getClientIdentifier(request);
  if (isRateLimited(clientId, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW)) {
    return NextResponse.json(
      { valid: false, reason: 'rate-limit-exceeded' }, 
      { status: 429 }
    );
  }

  // 2. Parse and validate request body
  let body;
  try {
    body = await request.json();
  } catch (error) {
    return NextResponse.json(
      { valid: false, reason: 'invalid-json' }, 
      { status: 400 }
    );
  }

  // 3. Sanitize input
  const { word } = body || {};
  const sanitized = sanitizeWord(word);

  // 4. Validate sanitized word
  if (!sanitized || sanitized.length < 2 || sanitized.length > 30) {
    return NextResponse.json(
      { valid: false, reason: 'invalid-input' }, 
      { status: 400 }
    );
  }

  // 5. Final alphabet-only check
  if (!/^[a-z]+$/i.test(sanitized)) {
    return NextResponse.json(
      { valid: false, reason: 'invalid-characters' }, 
      { status: 400 }
    );
  }

  const normalized = normalizeWord(sanitized);

  // 6. Garbage Filter
  if (!passesGarbageFilter(normalized)) {
    return NextResponse.json({ valid: false, source: 'garbage-filter' });
  }

  // 7. Check cache
  if (CACHE.has(normalized)) {
    const cached = CACHE.get(normalized);
    return NextResponse.json({ valid: cached, source: 'cache' });
  }

  // 8. Check local dictionary
  const inLocalDict = isWordInLocalDictionary(normalized);
  
  if (inLocalDict) {
    CACHE.set(normalized, true);
    return NextResponse.json({ valid: true, source: 'local' });
  }

  // 9. Validate with Wordnik (external API)
  let validationResult = await validateWithWordnik(normalized);
  
  if (validationResult.valid) {
    CACHE.set(normalized, true);
    addWordToLocalDictionary(normalized);
    return NextResponse.json({ valid: true, source: validationResult.source });
  }

  if (validationResult.error === 'missing-key') {
    // Don't expose internal error to client
    return NextResponse.json({ valid: false, source: 'unavailable' });
  }

  // 10. Cache negative results too (prevent repeated API calls)
  CACHE.set(normalized, false);
  return NextResponse.json({ valid: false, source: validationResult.source || 'unknown' });
}
