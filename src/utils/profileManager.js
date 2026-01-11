/**
 * Profile Manager - The Meta-Game Engine
 * Handles player profiles, streaks, stats, and history across all games
 */

import { syncProfile } from '@/utils/backendSync';
import { secureGetItem, secureSetItem } from '@/utils/secureStorage';
import { sanitizeName, sanitizeString } from '@/utils/inputSanitizer';

const PROFILE_KEY = 'ammarTimes_profile';

// Initialize or get user profile
export function getProfile() {
  if (typeof window === 'undefined') return null;
  
  const stored = secureGetItem(PROFILE_KEY);
  if (stored) {
    const profile = stored;
    
    // Sanitize critical fields
    if (profile.name) {
      profile.name = sanitizeName(profile.name);
    }
    if (profile.userId) {
      profile.userId = sanitizeString(profile.userId, 100);
    }
    
    const updated = ensureGameEntries(profile);
    if (updated) {
      saveProfile(profile);
    }
    return profile;
  }
  
  // Create new profile
  const newProfile = {
    userId: generateUserId(),
    name: null, // Will be set by user on first visit
    createdAt: new Date().toISOString(),
    games: {
      wordle: initGameStats(),
      connections: initGameStats(),
      crossword: initGameStats(),
      numbers: initGameStats(),
      trivia: initGameStats(),
      strands: initGameStats(),
      spelling: initSpellingStats(),
    },
    achievements: [],
    settings: {
      remindersEnabled: false,
      lastReminderSent: null,
    },
  };
  
  saveProfile(newProfile);
  return newProfile;
}

function ensureGameEntries(profile) {
  let updated = false;
  if (!profile.games) {
    profile.games = {};
    updated = true;
  }

  const requiredGames = {
    wordle: () => initGameStats(),
    connections: () => initGameStats(),
    crossword: () => initGameStats(),
    numbers: () => initGameStats(),
    trivia: () => initGameStats(),
    strands: () => initGameStats(),
    spelling: () => initSpellingStats(),
  };

  Object.entries(requiredGames).forEach(([key, initializer]) => {
    if (!profile.games[key]) {
      profile.games[key] = initializer();
      updated = true;
    }
  });

  return updated;
}

// Save profile to localStorage (with sanitization)
export function saveProfile(profile) {
  if (typeof window === 'undefined') return;
  
  // Sanitize name before saving
  if (profile.name) {
    profile.name = sanitizeName(profile.name);
  }
  
  secureSetItem(PROFILE_KEY, profile);
  syncProfile(profile);
}

// Check if player has set their name
export function hasSetName() {
  if (typeof window === 'undefined') return false;
  const profile = getProfile();
  return profile && profile.name && profile.name.trim().length > 0;
}

// Get player name (sanitized)
export function getPlayerName() {
  if (typeof window === 'undefined') return null;
  const profile = getProfile();
  return profile && profile.name ? sanitizeName(profile.name) : null;
}

// Initialize game-specific stats
function initGameStats() {
  return {
    gamesPlayed: 0,
    gamesWon: 0,
    currentStreak: 0,
    longestStreak: 0,
    lastPlayedDate: null,
    history: [], // Array of result objects
    // Game-specific stats
    bestTime: null, // For crossword
    averageAttempts: 0, // For wordle, connections
    totalAttempts: 0,
    perfectGames: 0, // Zero mistakes
  };
}

// Initialize Spelling Bee specific stats
function initSpellingStats() {
  return {
    gamesPlayed: 0,
    gamesWon: 0,
    currentStreak: 0,
    longestStreak: 0,
    maxStreak: 0,
    lastPlayedDate: null,
    history: [],
    totalWords: 0,
    totalPangrams: 0,
    totalScore: 0,
    averageScore: 0,
    rankDistribution: {},
    queenBeeCount: 0, // Times reached 100%
  };
}

// Generate unique user ID
function generateUserId() {
  return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Get today's date string (timezone-safe)
export function getTodayString() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

// Record a game result
export function recordGameResult(gameName, result) {
  const profile = getProfile();
  const gameStats = profile.games[gameName];
  const today = getTodayString();
  
  // Check if already played today
  if (gameStats.lastPlayedDate === today) {
    // Update existing result for today
    const todayIndex = gameStats.history.findIndex(h => h.date === today);
    if (todayIndex !== -1) {
      gameStats.history[todayIndex] = result;
    }
  } else {
    // New game played
    gameStats.history.push(result);
    gameStats.gamesPlayed++;
  }
  
  // Update stats
  if (result.win) {
    gameStats.gamesWon++;
    
    // Update streak
    if (gameStats.lastPlayedDate === getYesterdayString()) {
      gameStats.currentStreak++;
    } else if (gameStats.lastPlayedDate !== today) {
      gameStats.currentStreak = 1;
    }
    
    if (gameStats.currentStreak > gameStats.longestStreak) {
      gameStats.longestStreak = gameStats.currentStreak;
    }
  } else {
    // Loss resets streak
    gameStats.currentStreak = 0;
  }
  
  // Update last played date
  gameStats.lastPlayedDate = today;
  
  // Update attempts average
  if (result.attempts !== undefined) {
    gameStats.totalAttempts += result.attempts;
    gameStats.averageAttempts = (gameStats.totalAttempts / gameStats.gamesPlayed).toFixed(2);
  }
  
  // Update best time
  if (result.time !== undefined) {
    if (!gameStats.bestTime || result.time < gameStats.bestTime) {
      gameStats.bestTime = result.time;
    }
  }
  
  // Track perfect games
  if (result.perfect) {
    gameStats.perfectGames++;
  }
  
  saveProfile(profile);
  
  // Check for achievements
  return checkAchievements(profile, gameName, result);
}

// Get yesterday's date string
function getYesterdayString() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
}

// Check if user missed a day (resets streak)
export function checkStreakValidity(gameName) {
  const profile = getProfile();
  const gameStats = profile.games[gameName];
  const today = getTodayString();
  const yesterday = getYesterdayString();
  
  // If last played was not today or yesterday, streak is broken
  if (gameStats.lastPlayedDate && 
      gameStats.lastPlayedDate !== today && 
      gameStats.lastPlayedDate !== yesterday) {
    gameStats.currentStreak = 0;
    saveProfile(profile);
  }
}

// Get game statistics
export function getGameStats(gameName) {
  const profile = getProfile();
  checkStreakValidity(gameName);
  return profile.games[gameName];
}

// Get all statistics
export function getAllStats() {
  const profile = getProfile();
  return {
    wordle: profile.games.wordle,
    connections: profile.games.connections,
    crossword: profile.games.crossword,
    numbers: profile.games.numbers,
    trivia: profile.games.trivia,
    strands: profile.games.strands,
    spelling: profile.games.spelling,
  };
}

// Save game to profile (Simplified version for Spelling Bee)
export function saveGameToProfile(gameName, data) {
  const profile = getProfile();
  const today = getTodayString();
  
  if (gameName === 'spelling') {
    const gameStats = profile.games.spelling;
    
    // Check if already played today
    const existingIndex = gameStats.history.findIndex(h => h.date === today);
    if (existingIndex !== -1) {
      // Update existing
      gameStats.history[existingIndex] = { date: today, ...data.stats };
    } else {
      // Add new
      gameStats.history.push({ date: today, ...data.stats });
      gameStats.gamesPlayed++;
    }
    
    // Update cumulative stats - Recalculate from history to prevent double counting
    gameStats.totalWords = gameStats.history.reduce((sum, h) => sum + (h.wordsFound || 0), 0);
    gameStats.totalPangrams = gameStats.history.reduce((sum, h) => sum + (h.pangramsFound || 0), 0);
    gameStats.totalScore = gameStats.history.reduce((sum, h) => sum + (h.score || 0), 0);
    
    if (gameStats.gamesPlayed > 0) {
      gameStats.averageScore = gameStats.totalScore / gameStats.gamesPlayed;
    }

    // Update rank distribution - Recalculate
    const distribution = {};
    gameStats.history.forEach(h => {
      if (h.rank) {
        distribution[h.rank] = (distribution[h.rank] || 0) + 1;
      }
    });
    gameStats.rankDistribution = distribution;
    
    // Check Queen Bee (100% completion)
    const completeGames = gameStats.history.filter(h => h.isComplete).length;
    gameStats.queenBeeCount = completeGames;
    // For Spelling Bee, we might consider a "win" as essentially any game played, 
    // or maybe reaching Genius, but for now let's keep gamesWon = gamesPlayed 
    // or maybe just track Queen Bees. 
    // The previous code did gameStats.gamesWon++ if isComplete.
    // Let's set gamesWon to count of 'Genius' rank or higher?
    // For consistency with other games, let's say "Win" is reaching Genius.
    // But for now, let's just stick to recalculating based on IsComplete (Queen Bee) 
    // or arguably reaching Genius.
    // Let's stick to Queen Bee = Win for this specific counter if that's what was intended.
    gameStats.gamesWon = completeGames;
    
    // Update streak
    if (gameStats.lastPlayedDate === getYesterdayString()) {
      gameStats.currentStreak++;
    } else if (gameStats.lastPlayedDate !== today) {
      gameStats.currentStreak = 1;
    }
    
    if (gameStats.currentStreak > gameStats.maxStreak) {
      gameStats.maxStreak = gameStats.currentStreak;
    }
    if (gameStats.currentStreak > gameStats.longestStreak) {
      gameStats.longestStreak = gameStats.currentStreak;
    }
    
    gameStats.lastPlayedDate = today;
    
    saveProfile(profile);
  }
}

// Check and unlock achievements
function checkAchievements(profile, gameName, result) {
  const newAchievements = [];
  const gameStats = profile.games[gameName];
  
  // Import achievements dynamically to avoid circular dependency
  const achievements = require('./achievementsEngine').ACHIEVEMENTS;
  
  achievements.forEach(achievement => {
    // Skip if already unlocked
    if (profile.achievements.some(a => a.id === achievement.id)) {
      return;
    }
    
    // Check unlock condition
    if (achievement.check(profile, gameName, result, gameStats)) {
      const unlockedAchievement = {
        id: achievement.id,
        unlockedAt: new Date().toISOString(),
        game: gameName,
      };
      profile.achievements.push(unlockedAchievement);
      newAchievements.push(achievement);
    }
  });
  
  if (newAchievements.length > 0) {
    saveProfile(profile);
  }
  
  return newAchievements;
}

// Get history for date range
export function getHistoryForDateRange(gameName, days = 7) {
  const profile = getProfile();
  const gameStats = profile.games[gameName];
  
  const today = new Date();
  const results = [];
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    
    const result = gameStats.history.find(h => h.date === dateString);
    results.push({
      date: dateString,
      result: result || null,
    });
  }
  
  return results;
}

// Check if played today
export function hasPlayedToday(gameName) {
  const profile = getProfile();
  const gameStats = profile.games[gameName];
  const today = getTodayString();
  return gameStats.lastPlayedDate === today;
}

// Get time until next puzzle
export function getTimeUntilNextPuzzle() {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  
  const diff = tomorrow - now;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  
  return { hours, minutes, seconds, totalMs: diff };
}

// Update settings
export function updateSettings(newSettings) {
  const profile = getProfile();
  profile.settings = { ...profile.settings, ...newSettings };
  saveProfile(profile);
}

// Get total achievements unlocked
export function getAchievementCount() {
  const profile = getProfile();
  return profile.achievements.length;
}

// Get all unlocked achievements
export function getUnlockedAchievements() {
  const profile = getProfile();
  return profile.achievements;
}
