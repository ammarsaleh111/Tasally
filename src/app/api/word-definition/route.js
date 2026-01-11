import { NextResponse } from 'next/server';

/**
 * API Route for fetching word definitions
 * Uses Wordnik API with server-side caching
 */

// In-memory cache for definitions (persists across requests in the same server instance)
const definitionsCache = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// Wordnik API configuration
const WORDNIK_API_KEY = process.env.WORDNIK_API_KEY || '';
const WORDNIK_BASE_URL = 'https://api.wordnik.com/v4/word.json';

/**
 * Fallback definitions for common words when API is unavailable
 */
const FALLBACK_DEFINITIONS = {
  // Common Wordle words
  'CRANE': { definition: 'A large, tall wading bird with long legs and neck', partOfSpeech: 'noun' },
  'SLATE': { definition: 'A flat piece of rock used for roofing or writing', partOfSpeech: 'noun' },
  'CRATE': { definition: 'A wooden container used for transporting goods', partOfSpeech: 'noun' },
  'TRACE': { definition: 'A mark, object, or indication of something that has passed', partOfSpeech: 'noun' },
  'RAISE': { definition: 'To lift or move to a higher position', partOfSpeech: 'verb' },
  'AUDIO': { definition: 'Sound, especially when recorded, transmitted, or reproduced', partOfSpeech: 'noun' },
  'ADIEU': { definition: 'A goodbye, farewell', partOfSpeech: 'noun' },
  'PIANO': { definition: 'A large keyboard musical instrument', partOfSpeech: 'noun' },
  'HOUSE': { definition: 'A building for human habitation', partOfSpeech: 'noun' },
  'WATER': { definition: 'A colorless liquid essential for life', partOfSpeech: 'noun' },
  'WORLD': { definition: 'The earth, together with all of its countries and peoples', partOfSpeech: 'noun' },
  'LIGHT': { definition: 'The natural agent that stimulates sight', partOfSpeech: 'noun' },
  'POWER': { definition: 'The ability to do something or act in a particular way', partOfSpeech: 'noun' },
  'PLACE': { definition: 'A particular position or point in space', partOfSpeech: 'noun' },
  'POINT': { definition: 'A sharp end or tip', partOfSpeech: 'noun' },
  'THINK': { definition: 'To have a particular opinion, belief, or idea', partOfSpeech: 'verb' },
  'GREAT': { definition: 'Of an extent or intensity considerably above average', partOfSpeech: 'adjective' },
  'SMALL': { definition: 'Of a size that is less than normal or usual', partOfSpeech: 'adjective' },
  'LARGE': { definition: 'Of considerable or relatively great size', partOfSpeech: 'adjective' },
  'QUICK': { definition: 'Moving fast or doing something in a short time', partOfSpeech: 'adjective' },
};

/**
 * Fetch definition from Wordnik API
 */
async function fetchFromWordnik(word) {
  if (!WORDNIK_API_KEY) {
    console.warn('WORDNIK_API_KEY not configured, using fallback definitions');
    return null;
  }

  try {
    const url = `${WORDNIK_BASE_URL}/${encodeURIComponent(word.toLowerCase())}/definitions?limit=1&includeRelated=false&sourceDictionaries=all&useCanonical=false&includeTags=false&api_key=${WORDNIK_API_KEY}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null; // Word not found
      }
      throw new Error(`Wordnik API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data && data.length > 0) {
      return {
        definition: data[0].text || 'Definition not available',
        partOfSpeech: data[0].partOfSpeech || 'unknown',
        source: 'wordnik',
      };
    }

    return null;
  } catch (error) {
    console.error('Wordnik API error:', error);
    return null;
  }
}

/**
 * Fetch definition from Free Dictionary API (no API key required)
 */
async function fetchFromFreeDictionary(word) {
  try {
    const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word.toLowerCase())}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    
    if (data && data.length > 0 && data[0].meanings && data[0].meanings.length > 0) {
      const meaning = data[0].meanings[0];
      const definition = meaning.definitions && meaning.definitions[0];
      
      if (definition) {
        return {
          definition: definition.definition,
          partOfSpeech: meaning.partOfSpeech || 'unknown',
          source: 'freedictionary',
        };
      }
    }

    return null;
  } catch (error) {
    console.error('Free Dictionary API error:', error);
    return null;
  }
}

/**
 * Get definition from cache or fetch from multiple sources
 */
async function getDefinition(word) {
  const normalizedWord = word.toUpperCase().trim();
  
  // Check cache first
  const cached = definitionsCache.get(normalizedWord);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  // Try Wordnik API first (if key is configured)
  const wordnikResult = await fetchFromWordnik(normalizedWord);
  if (wordnikResult) {
    definitionsCache.set(normalizedWord, {
      data: wordnikResult,
      timestamp: Date.now(),
    });
    return wordnikResult;
  }

  // Try Free Dictionary API (no key required)
  const freeDictResult = await fetchFromFreeDictionary(normalizedWord);
  if (freeDictResult) {
    definitionsCache.set(normalizedWord, {
      data: freeDictResult,
      timestamp: Date.now(),
    });
    return freeDictResult;
  }

  // Try fallback definitions
  const fallback = FALLBACK_DEFINITIONS[normalizedWord];
  if (fallback) {
    return {
      ...fallback,
      source: 'fallback',
    };
  }

  // No definition found
  return null;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const word = searchParams.get('word');

    if (!word) {
      return NextResponse.json(
        { error: 'Missing word parameter' },
        { status: 400 }
      );
    }

    const definition = await getDefinition(word);

    if (!definition) {
      return NextResponse.json(
        { 
          word: word.toUpperCase(),
          definition: null,
          partOfSpeech: null,
          found: false 
        },
        { status: 200 }
      );
    }

    return NextResponse.json({
      word: word.toUpperCase(),
      definition: definition.definition,
      partOfSpeech: definition.partOfSpeech,
      source: definition.source,
      found: true,
    });
  } catch (error) {
    console.error('Error in word-definition API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
