/**
 * Achievements Engine
 * Badge definitions and unlock conditions
 */

export const ACHIEVEMENTS = [
  // STREAK ACHIEVEMENTS
  {
    id: 'streak_3',
    name: 'Getting Started',
    description: 'Maintain a 3-day streak in any game',
    icon: '🔥',
    category: 'streak',
    check: (profile, gameName, result, gameStats) => {
      return gameStats.currentStreak >= 3;
    },
  },
  {
    id: 'streak_7',
    name: 'Week Warrior',
    description: 'Maintain a 7-day streak in any game',
    icon: '⭐',
    category: 'streak',
    check: (profile, gameName, result, gameStats) => {
      return gameStats.currentStreak >= 7;
    },
  },
  {
    id: 'streak_10',
    name: '10-Day Streak',
    description: 'Maintain a 10-day streak in any game',
    icon: '🏆',
    category: 'streak',
    check: (profile, gameName, result, gameStats) => {
      return gameStats.currentStreak >= 10;
    },
  },
  {
    id: 'streak_30',
    name: 'Monthly Master',
    description: 'Maintain a 30-day streak in any game',
    icon: '👑',
    category: 'streak',
    check: (profile, gameName, result, gameStats) => {
      return gameStats.currentStreak >= 30;
    },
  },
  {
    id: 'streak_100',
    name: 'Century Club',
    description: 'Maintain a 100-day streak in any game',
    icon: '💯',
    category: 'streak',
    check: (profile, gameName, result, gameStats) => {
      return gameStats.currentStreak >= 100;
    },
  },

  // WORDLE ACHIEVEMENTS
  {
    id: 'wordle_first_win',
    name: 'Word Wizard',
    description: 'Win your first Wordle',
    icon: '📝',
    category: 'wordle',
    check: (profile, gameName, result, gameStats) => {
      return gameName === 'wordle' && gameStats.gamesWon === 1;
    },
  },
  {
    id: 'wordle_pro',
    name: 'Wordle Pro',
    description: 'Win Wordle in 2 tries',
    icon: '🎯',
    category: 'wordle',
    check: (profile, gameName, result, gameStats) => {
      return gameName === 'wordle' && result.win && result.attempts === 2;
    },
  },
  {
    id: 'wordle_genius',
    name: 'Genius',
    description: 'Win Wordle in 1 try',
    icon: '🧠',
    category: 'wordle',
    check: (profile, gameName, result, gameStats) => {
      return gameName === 'wordle' && result.win && result.attempts === 1;
    },
  },
  {
    id: 'wordle_50_wins',
    name: 'Word Master',
    description: 'Win 50 Wordle games',
    icon: '📚',
    category: 'wordle',
    check: (profile, gameName, result, gameStats) => {
      return gameName === 'wordle' && gameStats.gamesWon >= 50;
    },
  },

  // CONNECTIONS ACHIEVEMENTS
  {
    id: 'connections_first_win',
    name: 'Connected',
    description: 'Complete your first Connections puzzle',
    icon: '🔗',
    category: 'connections',
    check: (profile, gameName, result, gameStats) => {
      return gameName === 'connections' && gameStats.gamesWon === 1;
    },
  },
  {
    id: 'connections_perfect',
    name: 'Connections Master',
    description: 'Complete Connections with zero mistakes',
    icon: '✨',
    category: 'connections',
    check: (profile, gameName, result, gameStats) => {
      return gameName === 'connections' && result.win && result.mistakes === 0;
    },
  },
  {
    id: 'connections_flawless_10',
    name: 'Flawless Record',
    description: 'Complete 10 Connections puzzles with zero mistakes',
    icon: '💎',
    category: 'connections',
    check: (profile, gameName, result, gameStats) => {
      return gameName === 'connections' && gameStats.perfectGames >= 10;
    },
  },

  // CROSSWORD ACHIEVEMENTS
  {
    id: 'crossword_first_win',
    name: 'Crossword Novice',
    description: 'Complete your first crossword',
    icon: '📰',
    category: 'crossword',
    check: (profile, gameName, result, gameStats) => {
      return gameName === 'crossword' && gameStats.gamesWon === 1;
    },
  },
  {
    id: 'crossword_speedster',
    name: 'Crossword Speedster',
    description: 'Complete a crossword in under 60 seconds',
    icon: '⚡',
    category: 'crossword',
    check: (profile, gameName, result, gameStats) => {
      return gameName === 'crossword' && result.win && result.time < 60;
    },
  },
  {
    id: 'crossword_lightning',
    name: 'Lightning Fast',
    description: 'Complete a crossword in under 30 seconds',
    icon: '🌩️',
    category: 'crossword',
    check: (profile, gameName, result, gameStats) => {
      return gameName === 'crossword' && result.win && result.time < 30;
    },
  },

  // NUMBERS ACHIEVEMENTS
  {
    id: 'numbers_first_win',
    name: 'Number Cruncher',
    description: 'Solve your first Numbers puzzle',
    icon: '🔢',
    category: 'numbers',
    check: (profile, gameName, result, gameStats) => {
      return gameName === 'numbers' && gameStats.gamesWon === 1;
    },
  },
  {
    id: 'numbers_exact',
    name: 'Exact Match',
    description: 'Hit the exact target in Numbers',
    icon: '🎲',
    category: 'numbers',
    check: (profile, gameName, result, gameStats) => {
      return gameName === 'numbers' && result.exact === true;
    },
  },

  // TRIVIA ACHIEVEMENTS
  {
    id: 'trivia_first_win',
    name: 'Trivia Buff',
    description: 'Complete your first Trivia quiz',
    icon: '🧩',
    category: 'trivia',
    check: (profile, gameName, result, gameStats) => {
      return gameName === 'trivia' && gameStats.gamesPlayed === 1;
    },
  },
  {
    id: 'trivia_perfect',
    name: 'Know-It-All',
    description: 'Score 10/10 on a Trivia quiz',
    icon: '🎓',
    category: 'trivia',
    check: (profile, gameName, result, gameStats) => {
      return gameName === 'trivia' && result.score === 10;
    },
  },

  // CROSS-GAME ACHIEVEMENTS
  {
    id: 'all_games_played',
    name: 'Well Rounded',
    description: 'Play all 5 games at least once',
    icon: '🌟',
    category: 'general',
    check: (profile) => {
      return (
        profile.games.wordle.gamesPlayed > 0 &&
        profile.games.connections.gamesPlayed > 0 &&
        profile.games.crossword.gamesPlayed > 0 &&
        profile.games.numbers.gamesPlayed > 0 &&
        profile.games.trivia.gamesPlayed > 0
      );
    },
  },
  {
    id: 'perfect_week',
    name: 'Perfect Week',
    description: 'Win all games for 7 consecutive days',
    icon: '🏅',
    category: 'general',
    check: (profile) => {
      // Check if all games have at least 7-day streak
      return (
        profile.games.wordle.currentStreak >= 7 &&
        profile.games.connections.currentStreak >= 7 &&
        profile.games.crossword.currentStreak >= 7 &&
        profile.games.numbers.currentStreak >= 7 &&
        profile.games.trivia.currentStreak >= 7
      );
    },
  },
  {
    id: 'daily_dedication',
    name: 'Daily Dedication',
    description: 'Complete all daily puzzles on the same day',
    icon: '📅',
    category: 'general',
    check: (profile) => {
      const today = new Date().toISOString().split('T')[0];
      return (
        profile.games.wordle.lastPlayedDate === today &&
        profile.games.connections.lastPlayedDate === today &&
        profile.games.crossword.lastPlayedDate === today &&
        profile.games.numbers.lastPlayedDate === today &&
        profile.games.trivia.lastPlayedDate === today
      );
    },
  },
  {
    id: 'first_day',
    name: 'Welcome!',
    description: 'Complete your first puzzle on Ammar Times',
    icon: '👋',
    category: 'general',
    check: (profile) => {
      const totalGames =
        profile.games.wordle.gamesPlayed +
        profile.games.connections.gamesPlayed +
        profile.games.crossword.gamesPlayed +
        profile.games.numbers.gamesPlayed +
        profile.games.trivia.gamesPlayed;
      return totalGames === 1;
    },
  },
  {
    id: '100_games',
    name: 'Dedicated Player',
    description: 'Play 100 games total',
    icon: '🎮',
    category: 'general',
    check: (profile) => {
      const totalGames =
        profile.games.wordle.gamesPlayed +
        profile.games.connections.gamesPlayed +
        profile.games.crossword.gamesPlayed +
        profile.games.numbers.gamesPlayed +
        profile.games.trivia.gamesPlayed;
      return totalGames >= 100;
    },
  },
];

// Get achievement by ID
export function getAchievementById(id) {
  return ACHIEVEMENTS.find(a => a.id === id);
}

// Get achievements by category
export function getAchievementsByCategory(category) {
  return ACHIEVEMENTS.filter(a => a.category === category);
}

// Get all achievement categories
export function getCategories() {
  return [...new Set(ACHIEVEMENTS.map(a => a.category))];
}
