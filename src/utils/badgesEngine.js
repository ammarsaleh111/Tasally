/**
 * Badges Catalog
 * Normalized badge metadata layered on top of ACHIEVEMENTS definitions.
 */

import { ACHIEVEMENTS } from '@/utils/achievementsEngine';

const BADGE_METADATA = {
  streak_3: {
    category: 'Streaks',
    requirementType: 'streak',
    requirement: {
      type: 'streak',
      metric: 'currentStreak',
      target: 3,
      scope: 'any',
      aggregation: 'max',
    },
    rarity: 'common',
  },
  streak_7: {
    category: 'Streaks',
    requirementType: 'streak',
    requirement: {
      type: 'streak',
      metric: 'currentStreak',
      target: 7,
      scope: 'any',
      aggregation: 'max',
    },
    rarity: 'common',
  },
  streak_10: {
    category: 'Streaks',
    requirementType: 'streak',
    requirement: {
      type: 'streak',
      metric: 'currentStreak',
      target: 10,
      scope: 'any',
      aggregation: 'max',
    },
    rarity: 'rare',
  },
  streak_30: {
    category: 'Streaks',
    requirementType: 'streak',
    requirement: {
      type: 'streak',
      metric: 'currentStreak',
      target: 30,
      scope: 'any',
      aggregation: 'max',
    },
    rarity: 'epic',
  },
  streak_100: {
    category: 'Streaks',
    requirementType: 'streak',
    requirement: {
      type: 'streak',
      metric: 'currentStreak',
      target: 100,
      scope: 'any',
      aggregation: 'max',
    },
    rarity: 'epic',
  },
  wordle_first_win: {
    category: 'Wins',
    requirementType: 'cumulative',
    requirement: {
      type: 'cumulative',
      metric: 'gamesWon',
      target: 1,
      scope: 'wordle',
    },
    rarity: 'common',
  },
  wordle_pro: {
    category: 'Speed',
    requirementType: 'threshold',
    requirement: {
      type: 'threshold',
      metric: 'bestAttempts',
      target: 2,
      scope: 'wordle',
      comparison: 'lte',
    },
    rarity: 'rare',
  },
  wordle_genius: {
    category: 'Speed',
    requirementType: 'threshold',
    requirement: {
      type: 'threshold',
      metric: 'bestAttempts',
      target: 1,
      scope: 'wordle',
      comparison: 'lte',
    },
    rarity: 'epic',
  },
  wordle_50_wins: {
    category: 'Wins',
    requirementType: 'cumulative',
    requirement: {
      type: 'cumulative',
      metric: 'gamesWon',
      target: 50,
      scope: 'wordle',
    },
    rarity: 'rare',
  },
  connections_first_win: {
    category: 'Wins',
    requirementType: 'cumulative',
    requirement: {
      type: 'cumulative',
      metric: 'gamesWon',
      target: 1,
      scope: 'connections',
    },
    rarity: 'common',
  },
  connections_perfect: {
    category: 'Special',
    requirementType: 'cumulative',
    requirement: {
      type: 'cumulative',
      metric: 'perfectGames',
      target: 1,
      scope: 'connections',
    },
    rarity: 'rare',
  },
  connections_flawless_10: {
    category: 'Special',
    requirementType: 'cumulative',
    requirement: {
      type: 'cumulative',
      metric: 'perfectGames',
      target: 10,
      scope: 'connections',
    },
    rarity: 'epic',
  },
  crossword_first_win: {
    category: 'Wins',
    requirementType: 'cumulative',
    requirement: {
      type: 'cumulative',
      metric: 'gamesWon',
      target: 1,
      scope: 'crossword',
    },
    rarity: 'common',
  },
  crossword_speedster: {
    category: 'Speed',
    requirementType: 'threshold',
    requirement: {
      type: 'threshold',
      metric: 'bestTime',
      target: 60,
      scope: 'crossword',
      comparison: 'lte',
    },
    rarity: 'rare',
  },
  crossword_lightning: {
    category: 'Speed',
    requirementType: 'threshold',
    requirement: {
      type: 'threshold',
      metric: 'bestTime',
      target: 30,
      scope: 'crossword',
      comparison: 'lte',
    },
    rarity: 'epic',
  },
  numbers_first_win: {
    category: 'Wins',
    requirementType: 'cumulative',
    requirement: {
      type: 'cumulative',
      metric: 'gamesWon',
      target: 1,
      scope: 'numbers',
    },
    rarity: 'common',
  },
  numbers_exact: {
    category: 'Special',
    requirementType: 'threshold',
    requirement: {
      type: 'threshold',
      metric: 'exactHits',
      target: 1,
      scope: 'numbers',
    },
    rarity: 'rare',
  },
  trivia_first_win: {
    category: 'Participation',
    requirementType: 'cumulative',
    requirement: {
      type: 'cumulative',
      metric: 'gamesPlayed',
      target: 1,
      scope: 'trivia',
    },
    rarity: 'common',
  },
  trivia_perfect: {
    category: 'Special',
    requirementType: 'threshold',
    requirement: {
      type: 'threshold',
      metric: 'maxScore',
      target: 10,
      scope: 'trivia',
      comparison: 'gte',
    },
    rarity: 'rare',
  },
  all_games_played: {
    category: 'Participation',
    requirementType: 'cumulative',
    requirement: {
      type: 'cumulative',
      metric: 'gamesPlayed',
      target: 9,
      scope: 'all',
      aggregation: 'count',
      countThreshold: 1,
    },
    rarity: 'rare',
  },
  perfect_week: {
    category: 'Streaks',
    requirementType: 'streak',
    requirement: {
      type: 'streak',
      metric: 'currentStreak',
      target: 7,
      scope: ['wordle', 'connections', 'crossword', 'numbers', 'trivia'],
      aggregation: 'min',
    },
    rarity: 'epic',
  },
  strands_first_win: {
    category: 'Wins',
    requirementType: 'cumulative',
    requirement: {
      type: 'cumulative',
      metric: 'gamesWon',
      target: 1,
      scope: 'strands',
    },
    rarity: 'common',
  },
  strands_no_hints: {
    category: 'Special',
    requirementType: 'threshold',
    requirement: {
      type: 'threshold',
      metric: 'noHintWins',
      target: 1,
      scope: 'strands',
    },
    rarity: 'rare',
  },
  strands_perfect: {
    category: 'Special',
    requirementType: 'cumulative',
    requirement: {
      type: 'cumulative',
      metric: 'perfectGames',
      target: 10,
      scope: 'strands',
    },
    rarity: 'epic',
  },
  strands_speed: {
    category: 'Speed',
    requirementType: 'threshold',
    requirement: {
      type: 'threshold',
      metric: 'bestTime',
      target: 120,
      scope: 'strands',
      comparison: 'lte',
    },
    rarity: 'rare',
  },
  daily_dedication: {
    category: 'Daily',
    requirementType: 'daily',
    requirement: {
      type: 'daily',
      metric: 'gamesPlayedToday',
      target: 6,
      scope: ['wordle', 'connections', 'crossword', 'numbers', 'trivia', 'strands'],
      aggregation: 'count',
      countThreshold: 1,
    },
    rarity: 'rare',
  },
  spelling_first_word: {
    category: 'Participation',
    requirementType: 'cumulative',
    requirement: {
      type: 'cumulative',
      metric: 'totalWords',
      target: 1,
      scope: 'spelling',
    },
    rarity: 'common',
  },
  spelling_first_pangram: {
    category: 'Special',
    requirementType: 'cumulative',
    requirement: {
      type: 'cumulative',
      metric: 'totalPangrams',
      target: 1,
      scope: 'spelling',
    },
    rarity: 'rare',
  },
  spelling_genius: {
    category: 'Special',
    requirementType: 'threshold',
    requirement: {
      type: 'threshold',
      metric: 'rankGenius',
      target: 1,
      scope: 'spelling',
    },
    rarity: 'rare',
  },
  spelling_queen_bee: {
    category: 'Special',
    requirementType: 'cumulative',
    requirement: {
      type: 'cumulative',
      metric: 'queenBeeCount',
      target: 1,
      scope: 'spelling',
    },
    rarity: 'epic',
  },
  spelling_50_words: {
    category: 'Participation',
    requirementType: 'cumulative',
    requirement: {
      type: 'cumulative',
      metric: 'totalWords',
      target: 50,
      scope: 'spelling',
    },
    rarity: 'rare',
  },
  spelling_100_words: {
    category: 'Participation',
    requirementType: 'cumulative',
    requirement: {
      type: 'cumulative',
      metric: 'totalWords',
      target: 100,
      scope: 'spelling',
    },
    rarity: 'epic',
  },
  spelling_10_pangrams: {
    category: 'Special',
    requirementType: 'cumulative',
    requirement: {
      type: 'cumulative',
      metric: 'totalPangrams',
      target: 10,
      scope: 'spelling',
    },
    rarity: 'epic',
  },
  spelling_perfect_week: {
    category: 'Streaks',
    requirementType: 'streak',
    requirement: {
      type: 'streak',
      metric: 'currentStreak',
      target: 7,
      scope: 'spelling',
    },
    rarity: 'rare',
  },
  spelling_5_queen_bees: {
    category: 'Special',
    requirementType: 'cumulative',
    requirement: {
      type: 'cumulative',
      metric: 'queenBeeCount',
      target: 5,
      scope: 'spelling',
    },
    rarity: 'epic',
  },
  waffle_first_win: {
    category: 'Wins',
    requirementType: 'cumulative',
    requirement: {
      type: 'cumulative',
      metric: 'gamesWon',
      target: 1,
      scope: 'waffle',
    },
    rarity: 'common',
  },
  waffle_perfect: {
    category: 'Special',
    requirementType: 'cumulative',
    requirement: {
      type: 'cumulative',
      metric: 'perfectGames',
      target: 1,
      scope: 'waffle',
    },
    rarity: 'rare',
  },
  waffle_10_perfect: {
    category: 'Special',
    requirementType: 'cumulative',
    requirement: {
      type: 'cumulative',
      metric: 'perfectGames',
      target: 10,
      scope: 'waffle',
    },
    rarity: 'epic',
  },
  waffle_50_games: {
    category: 'Participation',
    requirementType: 'cumulative',
    requirement: {
      type: 'cumulative',
      metric: 'gamesPlayed',
      target: 50,
      scope: 'waffle',
    },
    rarity: 'rare',
  },
  waffle_streak_7: {
    category: 'Streaks',
    requirementType: 'streak',
    requirement: {
      type: 'streak',
      metric: 'currentStreak',
      target: 7,
      scope: 'waffle',
    },
    rarity: 'rare',
  },
  combinations_first_win: {
    category: 'Wins',
    requirementType: 'cumulative',
    requirement: {
      type: 'cumulative',
      metric: 'gamesWon',
      target: 1,
      scope: 'combinations',
    },
    rarity: 'common',
  },
  combinations_3_combo: {
    category: 'Special',
    requirementType: 'threshold',
    requirement: {
      type: 'threshold',
      metric: 'maxComboLength',
      target: 3,
      scope: 'combinations',
      comparison: 'gte',
    },
    rarity: 'common',
  },
  combinations_4_combo: {
    category: 'Special',
    requirementType: 'threshold',
    requirement: {
      type: 'threshold',
      metric: 'maxComboLength',
      target: 4,
      scope: 'combinations',
      comparison: 'gte',
    },
    rarity: 'rare',
  },
  combinations_5_combo: {
    category: 'Special',
    requirementType: 'threshold',
    requirement: {
      type: 'threshold',
      metric: 'maxComboLength',
      target: 5,
      scope: 'combinations',
      comparison: 'gte',
    },
    rarity: 'epic',
  },
  combinations_bonus_hunter: {
    category: 'Special',
    requirementType: 'cumulative',
    requirement: {
      type: 'cumulative',
      metric: 'totalBonusWords',
      target: 10,
      scope: 'combinations',
    },
    rarity: 'rare',
  },
  combinations_high_scorer: {
    category: 'Special',
    requirementType: 'threshold',
    requirement: {
      type: 'threshold',
      metric: 'maxScore',
      target: 200,
      scope: 'combinations',
      comparison: 'gte',
    },
    rarity: 'rare',
  },
  combinations_streak_7: {
    category: 'Streaks',
    requirementType: 'streak',
    requirement: {
      type: 'streak',
      metric: 'currentStreak',
      target: 7,
      scope: 'combinations',
    },
    rarity: 'rare',
  },
  first_day: {
    category: 'Participation',
    requirementType: 'cumulative',
    requirement: {
      type: 'cumulative',
      metric: 'gamesPlayed',
      target: 1,
      scope: ['wordle', 'connections', 'crossword', 'numbers', 'trivia', 'strands', 'spelling'],
      aggregation: 'sum',
    },
    rarity: 'common',
  },
  '100_games': {
    category: 'Participation',
    requirementType: 'cumulative',
    requirement: {
      type: 'cumulative',
      metric: 'gamesPlayed',
      target: 100,
      scope: 'all',
      aggregation: 'sum',
    },
    rarity: 'epic',
  },
};

const DEFAULT_META = {
  category: 'Special',
  requirementType: 'event',
  requirement: {
    type: 'event',
    metric: 'event',
    target: 1,
  },
  rarity: 'common',
};

export const BADGES = ACHIEVEMENTS.map((achievement) => ({
  ...DEFAULT_META,
  ...achievement,
  ...(BADGE_METADATA[achievement.id] || {}),
}));

const CATEGORY_ORDER = ['Wins', 'Streaks', 'Participation', 'Speed', 'Daily', 'Special'];

export function getBadgeById(id) {
  return BADGES.find((badge) => badge.id === id);
}

export function getBadgeCategories() {
  const categories = new Set(BADGES.map((badge) => badge.category));
  return CATEGORY_ORDER.filter((category) => categories.has(category));
}
