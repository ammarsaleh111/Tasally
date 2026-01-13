/**
 * Learning Log Engine
 * Tracks words learned across all games with multi-source definitions
 * Uses the new Definition Resolver for reliable, cached definitions
 */

import { secureGetItem, secureSetItem } from './secureStorage';
import { resolveDefinition, validateDefinition } from './definitionResolver';

const LEARNING_LOG_KEY = 'ammarTimes_learningLog';
const DEFINITIONS_CACHE_KEY = 'ammarTimes_definitionsCache';

// Game types that contribute words to the learning log
export const WORD_GAMES = [
  'wordle',
  'connections',
  'strands',
  'crossword',
  'waffle',
  'combinations',
  'spelling',
];

/**
 * Get the learning log from storage
 */
export function getLearningLog() {
  if (typeof window === 'undefined') return { words: [], favorites: [] };
  
  const stored = secureGetItem(LEARNING_LOG_KEY);
  if (stored) {
    return {
      words: stored.words || [],
      favorites: stored.favorites || [],
    };
  }
  
  return { words: [], favorites: [] };
}

/**
 * Save the learning log to storage
 */
export function saveLearningLog(log) {
  if (typeof window === 'undefined') return;
  secureSetItem(LEARNING_LOG_KEY, log);
}

/**
 * Get the definitions cache
 */
function getDefinitionsCache() {
  if (typeof window === 'undefined') return {};
  
  const stored = secureGetItem(DEFINITIONS_CACHE_KEY);
  return stored || {};
}

/**
 * Save to definitions cache
 */
function saveDefinitionsCache(cache) {
  if (typeof window === 'undefined') return;
  secureSetItem(DEFINITIONS_CACHE_KEY, cache);
}

/**
 * Add a word to the learning log
 * @param {string} word - The word to add
 * @param {string} game - The game it came from
 * @param {Object} definition - Optional definition object { text, partOfSpeech }
 */
export function addWordToLog(word, game, definition = null) {
  if (!word || !game) return false;
  
  const normalizedWord = word.toUpperCase().trim();
  const log = getLearningLog();
  
  // Check if word already exists
  const existingIndex = log.words.findIndex(w => w.word === normalizedWord);
  
  if (existingIndex !== -1) {
    // Word exists, add new game source if not already present
    const existing = log.words[existingIndex];
    if (!existing.games.includes(game)) {
      existing.games.push(game);
      existing.lastSeen = new Date().toISOString();
    }
  } else {
    // Add new word
    log.words.push({
      word: normalizedWord,
      games: [game],
      dateAdded: new Date().toISOString(),
      lastSeen: new Date().toISOString(),
      definition: definition?.text || null,
      partOfSpeech: definition?.partOfSpeech || null,
      definitionFetched: !!definition,
    });
  }
  
  saveLearningLog(log);
  return true;
}

/**
 * Add multiple words to the learning log
 * @param {string[]} words - Array of words
 * @param {string} game - The game they came from
 */
export function addWordsToLog(words, game) {
  if (!words || !Array.isArray(words) || !game) return false;
  
  const log = getLearningLog();
  const now = new Date().toISOString();
  
  words.forEach(word => {
    if (!word) return;
    
    const normalizedWord = word.toUpperCase().trim();
    if (!normalizedWord) return;
    
    const existingIndex = log.words.findIndex(w => w.word === normalizedWord);
    
    if (existingIndex !== -1) {
      const existing = log.words[existingIndex];
      if (!existing.games.includes(game)) {
        existing.games.push(game);
      }
      existing.lastSeen = now;
    } else {
      log.words.push({
        word: normalizedWord,
        games: [game],
        dateAdded: now,
        lastSeen: now,
        definition: null,
        partOfSpeech: null,
        definitionFetched: false,
      });
    }
  });
  
  saveLearningLog(log);
  return true;
}

/**
 * Toggle favorite status for a word
 * @param {string} word - The word to toggle
 */
export function toggleFavorite(word) {
  if (!word) return false;
  
  const normalizedWord = word.toUpperCase().trim();
  const log = getLearningLog();
  
  const index = log.favorites.indexOf(normalizedWord);
  if (index === -1) {
    log.favorites.push(normalizedWord);
  } else {
    log.favorites.splice(index, 1);
  }
  
  saveLearningLog(log);
  return log.favorites.includes(normalizedWord);
}

/**
 * Check if a word is favorited
 * @param {string} word - The word to check
 */
export function isFavorite(word) {
  if (!word) return false;
  
  const normalizedWord = word.toUpperCase().trim();
  const log = getLearningLog();
  return log.favorites.includes(normalizedWord);
}

/**
 * Get words filtered by game
 * @param {string|null} game - Game filter (null for all)
 */
export function getWordsByGame(game = null) {
  const log = getLearningLog();
  
  if (!game) {
    return log.words;
  }
  
  return log.words.filter(w => w.games.includes(game));
}

/**
 * Search words in the learning log
 * @param {string} query - Search query
 */
export function searchWords(query) {
  if (!query) return getLearningLog().words;
  
  const normalizedQuery = query.toUpperCase().trim();
  const log = getLearningLog();
  
  return log.words.filter(w => 
    w.word.includes(normalizedQuery) ||
    (w.definition && w.definition.toLowerCase().includes(query.toLowerCase()))
  );
}

/**
 * Get learning log statistics
 */
export function getLearningLogStats() {
  const log = getLearningLog();
  
  const stats = {
    totalWords: log.words.length,
    favorites: log.favorites.length,
    byGame: {},
    recentWords: [],
    topWords: [],
  };
  
  // Count words by game
  WORD_GAMES.forEach(game => {
    stats.byGame[game] = log.words.filter(w => w.games.includes(game)).length;
  });
  
  // Get 10 most recent words
  stats.recentWords = [...log.words]
    .sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded))
    .slice(0, 10);
  
  // Get words that appear in most games
  stats.topWords = [...log.words]
    .sort((a, b) => b.games.length - a.games.length)
    .slice(0, 10);
  
  return stats;
}

/**
 * Fetch definition using the new Definition Resolver
 * Uses multi-source pipeline with caching and validation
 * @param {string} word - The word to define
 */
export async function fetchDefinition(word) {
  if (!word) return null;
  
  const normalizedWord = word.toUpperCase().trim();
  
  try {
    // Use the new definition resolver
    const definition = await resolveDefinition(normalizedWord, {
      themeAware: true,
      useCache: true,
    });
    
    // Validate the definition
    if (!validateDefinition(definition)) {
      console.warn(`Invalid definition for ${normalizedWord}`);
      return null;
    }
    
    // Update the word in the log with the validated definition
    updateWordDefinition(
      normalizedWord, 
      definition.definition, 
      definition.partOfSpeech,
      definition.example
    );
    
    return {
      definition: definition.definition,
      partOfSpeech: definition.partOfSpeech,
      example: definition.example,
      source: definition.source,
    };
  } catch (error) {
    console.error('Error fetching definition:', error);
    return null;
  }
}

/**
 * Update a word's definition in the log
 * Ensures definitions are permanent and never change once stored
 * @param {string} word - The word to update
 * @param {string} definition - The definition text
 * @param {string} partOfSpeech - Part of speech
 * @param {string} example - Example usage (optional)
 */
export function updateWordDefinition(word, definition, partOfSpeech, example = null) {
  const normalizedWord = word.toUpperCase().trim();
  const log = getLearningLog();
  
  const wordEntry = log.words.find(w => w.word === normalizedWord);
  if (wordEntry) {
    // Only update if no definition exists (preserve first definition)
    if (!wordEntry.definitionFetched || !wordEntry.definition) {
      wordEntry.definition = definition;
      wordEntry.partOfSpeech = partOfSpeech;
      wordEntry.example = example;
      wordEntry.definitionFetched = true;
      wordEntry.definitionTimestamp = new Date().toISOString();
      saveLearningLog(log);
    }
  }
}

/**
 * Batch fetch definitions for words without them
 * @param {number} limit - Maximum number to fetch
 */
export async function batchFetchDefinitions(limit = 5) {
  const log = getLearningLog();
  const wordsWithoutDefinitions = log.words
    .filter(w => !w.definitionFetched)
    .slice(0, limit);
  
  const results = [];
  
  for (const wordEntry of wordsWithoutDefinitions) {
    const result = await fetchDefinition(wordEntry.word);
    if (result) {
      results.push({ word: wordEntry.word, ...result });
    }
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  return results;
}

/**
 * Remove a word from the learning log
 * @param {string} word - The word to remove
 */
export function removeWord(word) {
  if (!word) return false;
  
  const normalizedWord = word.toUpperCase().trim();
  const log = getLearningLog();
  
  const index = log.words.findIndex(w => w.word === normalizedWord);
  if (index !== -1) {
    log.words.splice(index, 1);
    // Also remove from favorites if present
    const favIndex = log.favorites.indexOf(normalizedWord);
    if (favIndex !== -1) {
      log.favorites.splice(favIndex, 1);
    }
    saveLearningLog(log);
    return true;
  }
  
  return false;
}

/**
 * Clear all words from the learning log
 */
export function clearLearningLog() {
  saveLearningLog({ words: [], favorites: [] });
}

/**
 * Export learning log as JSON
 */
export function exportLearningLog() {
  const log = getLearningLog();
  return JSON.stringify(log, null, 2);
}

/**
 * Get words learned on a specific date
 * @param {string} dateString - Date in YYYY-MM-DD format
 */
export function getWordsByDate(dateString) {
  const log = getLearningLog();
  return log.words.filter(w => w.dateAdded.startsWith(dateString));
}

/**
 * Get most frequently encountered words
 * @param {number} limit - Number of words to return
 */
export function getMostFrequentWords(limit = 10) {
  const log = getLearningLog();
  return [...log.words]
    .sort((a, b) => b.games.length - a.games.length)
    .slice(0, limit);
}
