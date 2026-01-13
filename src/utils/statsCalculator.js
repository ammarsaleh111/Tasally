/**
 * Stats Calculator - Centralized statistics calculations
 * 
 * This module provides a single source of truth for all stats calculations
 * across the platform to ensure consistency and correctness.
 * 
 * CRITICAL: Win rate must NEVER exceed 100%
 */

/**
 * Calculate win rate percentage
 * Formula: (wins / gamesPlayed) × 100
 * 
 * @param {number} wins - Number of games won
 * @param {number} gamesPlayed - Total number of games played
 * @returns {number} Win rate as a percentage (0-100), never exceeds 100
 */
export function calculateWinRate(wins, gamesPlayed) {
  // Handle edge cases
  if (typeof wins !== 'number' || typeof gamesPlayed !== 'number') {
    return 0;
  }
  
  if (gamesPlayed <= 0) {
    return 0;
  }
  
  if (wins < 0) {
    wins = 0;
  }
  
  // Wins cannot exceed games played
  if (wins > gamesPlayed) {
    wins = gamesPlayed;
  }
  
  const rate = (wins / gamesPlayed) * 100;
  
  // Ensure we never return NaN, Infinity, or values > 100
  if (!Number.isFinite(rate)) {
    return 0;
  }
  
  // Clamp between 0 and 100
  return Math.max(0, Math.min(100, Math.round(rate)));
}

/**
 * Calculate win rate with decimal precision
 * 
 * @param {number} wins - Number of games won
 * @param {number} gamesPlayed - Total number of games played
 * @param {number} decimals - Number of decimal places (default: 1)
 * @returns {string} Win rate as a formatted string (e.g., "75.5")
 */
export function calculateWinRateDecimal(wins, gamesPlayed, decimals = 1) {
  // Handle edge cases
  if (typeof wins !== 'number' || typeof gamesPlayed !== 'number') {
    return '0.0';
  }
  
  if (gamesPlayed <= 0) {
    return '0.0';
  }
  
  if (wins < 0) {
    wins = 0;
  }
  
  // Wins cannot exceed games played
  if (wins > gamesPlayed) {
    wins = gamesPlayed;
  }
  
  const rate = (wins / gamesPlayed) * 100;
  
  // Ensure we never return NaN, Infinity, or values > 100
  if (!Number.isFinite(rate)) {
    return '0.0';
  }
  
  // Clamp between 0 and 100
  const clampedRate = Math.max(0, Math.min(100, rate));
  return clampedRate.toFixed(decimals);
}

/**
 * Format win rate as a display string with percent sign
 * 
 * @param {number} wins - Number of games won
 * @param {number} gamesPlayed - Total number of games played
 * @returns {string} Formatted win rate (e.g., "75%")
 */
export function formatWinRate(wins, gamesPlayed) {
  return `${calculateWinRate(wins, gamesPlayed)}%`;
}

/**
 * Calculate aggregate stats from multiple game stats
 * 
 * @param {Object} allStats - Object containing stats for all games
 * @returns {Object} Aggregated statistics
 */
export function calculateAggregateStats(allStats) {
  if (!allStats || typeof allStats !== 'object') {
    return {
      totalGames: 0,
      totalWins: 0,
      winRate: 0,
      winRateFormatted: '0%',
    };
  }
  
  let totalGames = 0;
  let totalWins = 0;
  
  Object.values(allStats).forEach(gameStat => {
    if (gameStat && typeof gameStat === 'object') {
      const played = Number(gameStat.gamesPlayed) || 0;
      const won = Number(gameStat.gamesWon) || 0;
      
      // Validate: wins cannot exceed played
      totalGames += played;
      totalWins += Math.min(won, played);
    }
  });
  
  const winRate = calculateWinRate(totalWins, totalGames);
  
  return {
    totalGames,
    totalWins,
    winRate,
    winRateFormatted: `${winRate}%`,
  };
}

/**
 * Validate game stats for sanity
 * Returns corrected stats if invalid
 * 
 * @param {Object} stats - Game statistics object
 * @returns {Object} Validated/corrected stats
 */
export function validateGameStats(stats) {
  if (!stats || typeof stats !== 'object') {
    return {
      gamesPlayed: 0,
      gamesWon: 0,
      currentStreak: 0,
      longestStreak: 0,
    };
  }
  
  const gamesPlayed = Math.max(0, Number(stats.gamesPlayed) || 0);
  const gamesWon = Math.min(gamesPlayed, Math.max(0, Number(stats.gamesWon) || 0));
  const currentStreak = Math.max(0, Number(stats.currentStreak) || 0);
  const longestStreak = Math.max(currentStreak, Math.max(0, Number(stats.longestStreak || stats.maxStreak) || 0));
  
  return {
    ...stats,
    gamesPlayed,
    gamesWon,
    currentStreak,
    longestStreak,
  };
}

/**
 * Get safe game stat value
 * Handles missing/undefined values gracefully
 * 
 * @param {Object} stats - Game stats object
 * @param {string} key - Key to retrieve
 * @param {*} defaultValue - Default value if missing
 * @returns {*} Safe value
 */
export function getSafeStat(stats, key, defaultValue = 0) {
  if (!stats || typeof stats !== 'object') {
    return defaultValue;
  }
  
  const value = stats[key];
  
  if (value === undefined || value === null) {
    return defaultValue;
  }
  
  if (typeof defaultValue === 'number') {
    const numValue = Number(value);
    return Number.isFinite(numValue) ? numValue : defaultValue;
  }
  
  return value;
}
