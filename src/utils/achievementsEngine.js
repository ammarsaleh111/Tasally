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
    description: 'Play all 9 games at least once',
    icon: '🌟',
    category: 'general',
    check: (profile) => {
      return (
        profile.games.wordle.gamesPlayed > 0 &&
        profile.games.connections.gamesPlayed > 0 &&
        profile.games.crossword.gamesPlayed > 0 &&
        profile.games.numbers.gamesPlayed > 0 &&
        profile.games.trivia.gamesPlayed > 0 &&
        profile.games.strands.gamesPlayed > 0 &&
        (profile.games.spelling?.gamesPlayed || 0) > 0 &&
        (profile.games.waffle?.gamesPlayed || 0) > 0 &&
        (profile.games.combinations?.gamesPlayed || 0) > 0
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
        profile.games.trivia.currentStreak >= 7 &&
        profile.games.strands.currentStreak >= 7 &&
        (profile.games.spelling?.currentStreak || 0) >= 7 &&
        (profile.games.waffle?.currentStreak || 0) >= 7 &&
        (profile.games.combinations?.currentStreak || 0) >= 7
      );
    },
  },

  // STRANDS ACHIEVEMENTS
  {
    id: 'strands_first_win',
    name: 'Thread Master',
    description: 'Complete your first Strands puzzle',
    icon: '🧵',
    category: 'strands',
    check: (profile, gameName, result, gameStats) => {
      return gameName === 'strands' && gameStats.gamesWon === 1;
    },
  },
  {
    id: 'strands_no_hints',
    name: 'Pure Solver',
    description: 'Complete Strands without using hints',
    icon: '🧠',
    category: 'strands',
    check: (profile, gameName, result, gameStats) => {
      return gameName === 'strands' && result.win && result.hintsUsed === 0;
    },
  },
  {
    id: 'strands_perfect',
    name: 'Perfect Thread',
    description: 'Complete 10 Strands with no hints',
    icon: '✨',
    category: 'strands',
    check: (profile, gameName, result, gameStats) => {
      return gameName === 'strands' && gameStats.perfectGames >= 10;
    },
  },
  {
    id: 'strands_speed',
    name: 'Lightning Weaver',
    description: 'Complete Strands in under 2 minutes',
    icon: '⚡',
    category: 'strands',
    check: (profile, gameName, result, gameStats) => {
      return gameName === 'strands' && result.win && result.time < 120;
    },
  },

  // GENERAL ACHIEVEMENTS
  {
    id: 'daily_dedication',
    name: 'Daily Dedication',
    description: 'Complete all daily puzzles on the same day',
    icon: '📅',
    category: 'general',
    check: (profile) => {
      // Use UTC date consistent with getTodayString() in profileManager
      const now = new Date();
      const today = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`;
      return (
        profile.games.wordle.lastPlayedDate === today &&
        profile.games.connections.lastPlayedDate === today &&
        profile.games.crossword.lastPlayedDate === today &&
        profile.games.numbers.lastPlayedDate === today &&
        profile.games.trivia.lastPlayedDate === today &&
        profile.games.strands.lastPlayedDate === today &&
        (profile.games.spelling?.lastPlayedDate || '') === today &&
        (profile.games.waffle?.lastPlayedDate || '') === today &&
        (profile.games.combinations?.lastPlayedDate || '') === today
      );
    },
  },

  // SPELLING BEE ACHIEVEMENTS
  {
    id: 'spelling_first_word',
    name: 'First Word',
    description: 'Find your first word in Spelling Bee',
    icon: '🐝',
    category: 'spelling',
    check: (profile, gameName, result, gameStats) => {
      return gameName === 'spelling' && gameStats.totalWords >= 1;
    },
  },
  {
    id: 'spelling_first_pangram',
    name: 'Pangram Master',
    description: 'Find your first pangram',
    icon: '✨',
    category: 'spelling',
    check: (profile, gameName, result, gameStats) => {
      return gameName === 'spelling' && gameStats.totalPangrams >= 1;
    },
  },
  {
    id: 'spelling_genius',
    name: 'Spelling Genius',
    description: 'Reach Genius rank in Spelling Bee',
    icon: '🧠',
    category: 'spelling',
    check: (profile, gameName, result, gameStats) => {
      return gameName === 'spelling' && result && result.rank === 'Genius';
    },
  },
  {
    id: 'spelling_queen_bee',
    name: 'Queen Bee',
    description: 'Find all words in a puzzle',
    icon: '👑',
    category: 'spelling',
    check: (profile, gameName, result, gameStats) => {
      return gameName === 'spelling' && gameStats.queenBeeCount >= 1;
    },
  },
  {
    id: 'spelling_50_words',
    name: 'Word Collector',
    description: 'Find 50 words total in Spelling Bee',
    icon: '📝',
    category: 'spelling',
    check: (profile, gameName, result, gameStats) => {
      return gameName === 'spelling' && gameStats.totalWords >= 50;
    },
  },
  {
    id: 'spelling_100_words',
    name: 'Word Hoarder',
    description: 'Find 100 words total in Spelling Bee',
    icon: '📚',
    category: 'spelling',
    check: (profile, gameName, result, gameStats) => {
      return gameName === 'spelling' && gameStats.totalWords >= 100;
    },
  },
  {
    id: 'spelling_10_pangrams',
    name: 'Pangram Expert',
    description: 'Find 10 pangrams',
    icon: '🌟',
    category: 'spelling',
    check: (profile, gameName, result, gameStats) => {
      return gameName === 'spelling' && gameStats.totalPangrams >= 10;
    },
  },
  {
    id: 'spelling_perfect_week',
    name: 'Perfect Week',
    description: 'Play Spelling Bee for 7 days straight',
    icon: '⭐',
    category: 'spelling',
    check: (profile, gameName, result, gameStats) => {
      return gameName === 'spelling' && gameStats.currentStreak >= 7;
    },
  },
  {
    id: 'spelling_5_queen_bees',
    name: 'Queen Bee Royalty',
    description: 'Complete 5 puzzles perfectly',
    icon: '👸',
    category: 'spelling',
    check: (profile, gameName, result, gameStats) => {
      return gameName === 'spelling' && gameStats.queenBeeCount >= 5;
    },
  },

  // WAFFLE ACHIEVEMENTS
  {
    id: 'waffle_first_win',
    name: 'Waffle Maker',
    description: 'Complete your first Waffle puzzle',
    icon: '🧇',
    category: 'waffle',
    check: (profile, gameName, result, gameStats) => {
      return gameName === 'waffle' && gameStats.gamesWon === 1;
    },
  },
  {
    id: 'waffle_perfect',
    name: 'Perfect Waffle',
    description: 'Solve a Waffle with minimum swaps',
    icon: '⭐',
    category: 'waffle',
    check: (profile, gameName, result, gameStats) => {
      return gameName === 'waffle' && result.win && result.perfect;
    },
  },
  {
    id: 'waffle_10_perfect',
    name: 'Waffle Chef',
    description: 'Achieve 10 perfect Waffle solves',
    icon: '👨‍🍳',
    category: 'waffle',
    check: (profile, gameName, result, gameStats) => {
      return gameName === 'waffle' && (gameStats.perfectSolves || gameStats.perfectGames || 0) >= 10;
    },
  },
  {
    id: 'waffle_50_games',
    name: 'Waffle Expert',
    description: 'Complete 50 Waffle puzzles',
    icon: '🏆',
    category: 'waffle',
    check: (profile, gameName, result, gameStats) => {
      return gameName === 'waffle' && gameStats.gamesPlayed >= 50;
    },
  },
  {
    id: 'waffle_streak_7',
    name: 'Waffle Week',
    description: 'Maintain a 7-day Waffle streak',
    icon: '🔥',
    category: 'waffle',
    check: (profile, gameName, result, gameStats) => {
      return gameName === 'waffle' && gameStats.currentStreak >= 7;
    },
  },

  // COMBINATIONS ACHIEVEMENTS
  {
    id: 'combinations_first_win',
    name: 'Combinator',
    description: 'Reach the target score in Combinations',
    icon: '🧩',
    category: 'combinations',
    check: (profile, gameName, result, gameStats) => {
      return gameName === 'combinations' && gameStats.gamesWon === 1;
    },
  },
  {
    id: 'combinations_3_combo',
    name: 'Triple Threat',
    description: 'Create a 3-fragment word',
    icon: '🔗',
    category: 'combinations',
    check: (profile, gameName, result, gameStats) => {
      return gameName === 'combinations' && (gameStats.maxComboLength || 0) >= 3;
    },
  },
  {
    id: 'combinations_4_combo',
    name: 'Combo King',
    description: 'Create a 4-fragment word',
    icon: '🔥',
    category: 'combinations',
    check: (profile, gameName, result, gameStats) => {
      return gameName === 'combinations' && (gameStats.maxComboLength || 0) >= 4;
    },
  },
  {
    id: 'combinations_5_combo',
    name: 'Master Combinator',
    description: 'Create a 5+ fragment word',
    icon: '👑',
    category: 'combinations',
    check: (profile, gameName, result, gameStats) => {
      return gameName === 'combinations' && (gameStats.maxComboLength || 0) >= 5;
    },
  },
  {
    id: 'combinations_bonus_hunter',
    name: 'Bonus Hunter',
    description: 'Find 10 bonus words total',
    icon: '⭐',
    category: 'combinations',
    check: (profile, gameName, result, gameStats) => {
      return gameName === 'combinations' && (gameStats.totalBonusWords || 0) >= 10;
    },
  },
  {
    id: 'combinations_high_scorer',
    name: 'High Scorer',
    description: 'Score 200+ points in a single game',
    icon: '📊',
    category: 'combinations',
    check: (profile, gameName, result, gameStats) => {
      return gameName === 'combinations' && result.score >= 200;
    },
  },
  {
    id: 'combinations_streak_7',
    name: 'Combination Week',
    description: 'Maintain a 7-day Combinations streak',
    icon: '🔥',
    category: 'combinations',
    check: (profile, gameName, result, gameStats) => {
      return gameName === 'combinations' && gameStats.currentStreak >= 7;
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
        profile.games.trivia.gamesPlayed +
        profile.games.strands.gamesPlayed +
        (profile.games.spelling?.gamesPlayed || 0) +
        (profile.games.waffle?.gamesPlayed || 0) +
        (profile.games.combinations?.gamesPlayed || 0);
      return totalGames >= 1;
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
        profile.games.trivia.gamesPlayed +
        profile.games.strands.gamesPlayed +
        (profile.games.spelling?.gamesPlayed || 0) +
        (profile.games.waffle?.gamesPlayed || 0) +
        (profile.games.combinations?.gamesPlayed || 0);
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
