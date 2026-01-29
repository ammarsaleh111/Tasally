/**
 * Learning Log Engine - Redesigned for Daily, Intentional Curation
 * 
 * New Behavior:
 * - Words appear temporarily in "Today" section
 * - Only favorited words persist to "Saved Words"
 * - Non-favorited words expire automatically at end of day
 * - Daily reset ensures fresh start each day
 * 
 * Data Structure:
 * {
 *   lastCleanupDate: "2026-01-14",
 *   today: [WordEntry],
 *   saved: [WordEntry]
 * }
 * 
 * WordEntry = {
 *   word: string
 *   definition: string
 *   date: "YYYY-MM-DD"
 *   game: string
 *   isFavorite: boolean
 * }
 */

import { secureGetItem, secureSetItem } from './secureStorage';
import { getUserStorageKey } from './storageKeys';
import { resolveDefinition, validateDefinition } from './definitionResolver';

const LEARNING_LOG_KEY = 'learningLog_v2';
const DEFINITIONS_CACHE_KEY = 'definitionsCache';
const LAST_CLEANUP_KEY = 'lastCleanup';

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
 * Get today's date as YYYY-MM-DD string
 */
function getTodayDate() {
  return new Date().toISOString().split('T')[0];
}

/**
 * Initialize the learning log with new structure
 */
function initializeLearningLog() {
  return {
    lastCleanupDate: getTodayDate(),
    today: [],
    saved: [],
  };
}

/**
 * Get the learning log from storage
 */
export function getLearningLog() {
  if (typeof window === 'undefined') {
    return initializeLearningLog();
  }

  const stored = secureGetItem(getUserStorageKey(LEARNING_LOG_KEY));
  
  if (!stored) {
    return initializeLearningLog();
  }

  // Ensure structure is valid
  if (!stored.today) stored.today = [];
  if (!stored.saved) stored.saved = [];
  if (!stored.lastCleanupDate) stored.lastCleanupDate = getTodayDate();

  return stored;
}

/**
 * Save the learning log to storage
 */
export function saveLearningLog(log) {
  if (typeof window === 'undefined') return;
  secureSetItem(getUserStorageKey(LEARNING_LOG_KEY), log);
}

/**
 * Perform daily cleanup - remove non-favorited words from previous days
 * This is called automatically when day changes
 */
export function performDailyCleanup() {
  if (typeof window === 'undefined') return false;

  const log = getLearningLog();
  const today = getTodayDate();

  // If already cleaned up today, skip
  if (log.lastCleanupDate === today) {
    return false;
  }

  // Non-favorited words from "today" are discarded, cleanup happens naturally
  // Reset today's section for new day
  log.today = [];
  log.lastCleanupDate = today;

  saveLearningLog(log);
  return true;
}

/**
 * Get the definitions cache
 */
function getDefinitionsCache() {
  if (typeof window === 'undefined') return {};

  const stored = secureGetItem(getUserStorageKey(DEFINITIONS_CACHE_KEY));
  return stored || {};
}

/**
 * Save to definitions cache
 */
function saveDefinitionsCache(cache) {
  if (typeof window === 'undefined') return;
  secureSetItem(getUserStorageKey(DEFINITIONS_CACHE_KEY), cache);
}

/**
 * Add a word to today's learning log (temporary)
 * @param {string} word - The word to add
 * @param {string} game - The game it came from
 * @param {Object} definition - Optional definition object
 */
export function addWordToLog(word, game, definition = null) {
  if (!word || !game) return false;

  // Perform cleanup if needed
  performDailyCleanup();

  const normalizedWord = word.toUpperCase().trim();
  const log = getLearningLog();
  const today = getTodayDate();

  // Check if word already exists in today's section
  const existingIndex = log.today.findIndex(w => w.word === normalizedWord);

  if (existingIndex !== -1) {
    // Word exists, update last seen
    log.today[existingIndex].lastSeen = new Date().toISOString();
  } else {
    // Add new word to today's section
    log.today.push({
      word: normalizedWord,
      definition: definition?.text || null,
      date: today,
      game: game,
      isFavorite: false,
      dateAdded: new Date().toISOString(),
      source: definition?.source || null,
      partOfSpeech: definition?.partOfSpeech || null,
    });
  }

  saveLearningLog(log);
  return true;
}

/**
 * Add multiple words to today's learning log
 * @param {string[]} words - Array of words
 * @param {string} game - The game they came from
 */
export function addWordsToLog(words, game) {
  if (!words || !Array.isArray(words) || !game) return false;

  // Perform cleanup if needed
  performDailyCleanup();

  const log = getLearningLog();
  const today = getTodayDate();
  const now = new Date().toISOString();

  words.forEach(word => {
    if (!word) return;

    const normalizedWord = word.toUpperCase().trim();
    if (!normalizedWord) return;

    const existingIndex = log.today.findIndex(w => w.word === normalizedWord);

    if (existingIndex === -1) {
      log.today.push({
        word: normalizedWord,
        definition: null,
        date: today,
        game: game,
        isFavorite: false,
        dateAdded: now,
        source: null,
        partOfSpeech: null,
      });
    }
  });

  saveLearningLog(log);
  return true;
}

/**
 * Favorite a word - moves it from today to saved
 * @param {string} word - The word to favorite
 */
export function toggleFavorite(word) {
  if (!word) return false;

  const normalizedWord = word.toUpperCase().trim();
  const log = getLearningLog();

  // Find in today's section
  const todayIndex = log.today.findIndex(w => w.word === normalizedWord);
  // Find in saved section
  const savedIndex = log.saved.findIndex(w => w.word === normalizedWord);

  if (todayIndex !== -1) {
    const wordEntry = log.today[todayIndex];
    
    if (!wordEntry.isFavorite) {
      // Move to saved
      wordEntry.isFavorite = true;
      wordEntry.favoriteDate = new Date().toISOString();
      log.saved.push(log.today.splice(todayIndex, 1)[0]);
    }
  } else if (savedIndex !== -1) {
    const wordEntry = log.saved[savedIndex];
    
    // Remove from saved
    wordEntry.isFavorite = false;
    log.today.push(log.saved.splice(savedIndex, 1)[0]);
  }

  saveLearningLog(log);
  return savedIndex !== -1 || (todayIndex !== -1 && log.saved.some(w => w.word === normalizedWord));
}

/**
 * Check if a word is favorited
 * @param {string} word - The word to check
 */
export function isFavorite(word) {
  if (!word) return false;

  const normalizedWord = word.toUpperCase().trim();
  const log = getLearningLog();
  return log.saved.some(w => w.word === normalizedWord);
}

/**
 * Get today's words (temporary)
 */
export function getTodaysWords() {
  performDailyCleanup();
  const log = getLearningLog();
  return [...log.today];
}

/**
 * Get saved words (permanent, favorited)
 */
export function getSavedWords() {
  const log = getLearningLog();
  return [...log.saved];
}

/**
 * Get all words (today + saved)
 */
export function getAllWords() {
  const log = getLearningLog();
  return [...log.today, ...log.saved];
}

/**
 * Get words filtered by game
 * @param {string|null} game - Game filter (null for all)
 */
export function getWordsByGame(game = null) {
  const log = getLearningLog();
  const allWords = [...log.today, ...log.saved];

  if (!game) {
    return allWords;
  }

  return allWords.filter(w => w.game === game);
}

/**
 * Search words in the learning log
 * @param {string} query - Search query
 * @param {boolean} savedOnly - Only search saved words
 */
export function searchWords(query, savedOnly = false) {
  if (!query) return getAllWords();

  const normalizedQuery = query.toUpperCase().trim();
  const log = getLearningLog();
  const words = savedOnly ? log.saved : [...log.today, ...log.saved];

  return words.filter(w =>
    w.word.includes(normalizedQuery) ||
    (w.definition && w.definition.toLowerCase().includes(query.toLowerCase()))
  );
}

/**
 * Get learning log statistics
 */
export function getLearningLogStats() {
  const log = getLearningLog();
  const allWords = [...log.today, ...log.saved];

  const stats = {
    todaysWords: log.today.length,
    savedWords: log.saved.length,
    totalWords: allWords.length,
    favorites: log.saved.length, // Number of favorited/saved words
    byGame: {},
  };

  // Count words by game
  WORD_GAMES.forEach(game => {
    stats.byGame[game] = allWords.filter(w => w.game === game).length;
  });

  return stats;
}

/**
 * Fetch definition using the new Definition Resolver
 * @param {string} word - The word to define
 */
export async function fetchDefinition(word) {
  if (!word) return null;

  const normalizedWord = word.toUpperCase().trim();

  try {
    const definition = await resolveDefinition(normalizedWord, {
      themeAware: true,
      useCache: true,
    });

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
 * @param {string} word - The word to update
 * @param {string} definition - The definition text
 * @param {string} partOfSpeech - Part of speech
 * @param {string} example - Example usage (optional)
 */
export function updateWordDefinition(word, definition, partOfSpeech, example = null) {
  const normalizedWord = word.toUpperCase().trim();
  const log = getLearningLog();

  // Check in today's section
  const todayEntry = log.today.find(w => w.word === normalizedWord);
  if (todayEntry && !todayEntry.definition) {
    todayEntry.definition = definition;
    todayEntry.partOfSpeech = partOfSpeech;
    todayEntry.example = example;
    saveLearningLog(log);
    return;
  }

  // Check in saved section
  const savedEntry = log.saved.find(w => w.word === normalizedWord);
  if (savedEntry && !savedEntry.definition) {
    savedEntry.definition = definition;
    savedEntry.partOfSpeech = partOfSpeech;
    savedEntry.example = example;
    saveLearningLog(log);
  }
}

/**
 * Batch fetch definitions for words without them
 * @param {number} limit - Maximum number to fetch
 * @param {boolean} savedOnly - Only fetch for saved words
 */
export async function batchFetchDefinitions(limit = 5, savedOnly = false) {
  const log = getLearningLog();
  const allWords = savedOnly ? log.saved : [...log.today, ...log.saved];
  const wordsWithoutDefinitions = allWords
    .filter(w => !w.definition)
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

  // Try to remove from today
  const todayIndex = log.today.findIndex(w => w.word === normalizedWord);
  if (todayIndex !== -1) {
    log.today.splice(todayIndex, 1);
    saveLearningLog(log);
    return true;
  }

  // Try to remove from saved
  const savedIndex = log.saved.findIndex(w => w.word === normalizedWord);
  if (savedIndex !== -1) {
    log.saved.splice(savedIndex, 1);
    saveLearningLog(log);
    return true;
  }

  return false;
}

/**
 * Clear all words from the learning log
 */
export function clearLearningLog() {
  saveLearningLog(initializeLearningLog());
}

/**
 * Clear only today's non-favorited words (manual cleanup option)
 */
export function clearTodaysWords() {
  const log = getLearningLog();
  log.today = [];
  saveLearningLog(log);
}

/**
 * Export learning log as JSON
 */
export function exportLearningLog() {
  const log = getLearningLog();
  return JSON.stringify(log, null, 2);
}

/**
 * Get most frequently encountered words
 * @param {number} limit - Number of words to return
 */
export function getMostFrequentWords(limit = 10) {
  const log = getLearningLog();
  const allWords = [...log.today, ...log.saved];
  // Since we now track by game (not multiple games), sort by isFavorite
  return allWords
    .sort((a, b) => {
      if (a.isFavorite !== b.isFavorite) return b.isFavorite - a.isFavorite;
      return new Date(b.dateAdded) - new Date(a.dateAdded);
    })
    .slice(0, limit);
}
