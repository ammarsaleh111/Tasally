/**
 * Profile Manager - The Meta-Game Engine
 * Handles player profiles, streaks, stats, and history across all games
 */

const PROFILE_KEY = 'ammarTimes_profile';

// Initialize or get user profile
export function getProfile() {
  if (typeof window === 'undefined') return null;
  
  const stored = localStorage.getItem(PROFILE_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  
  // Create new profile
  const newProfile = {
    userId: generateUserId(),
    createdAt: new Date().toISOString(),
    games: {
      wordle: initGameStats(),
      connections: initGameStats(),
      crossword: initGameStats(),
      numbers: initGameStats(),
      trivia: initGameStats(),
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

// Save profile to localStorage
export function saveProfile(profile) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
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
  };
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
