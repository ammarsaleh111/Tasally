/**
 * Badge utilities: progress, new-state, sorting helpers.
 */

import { BADGES } from '@/utils/badgesEngine';
import { getProfile, saveProfile, getTodayString } from '@/utils/profileManager';

export const BADGE_GAME_KEYS = [
  'wordle',
  'connections',
  'crossword',
  'numbers',
  'trivia',
  'strands',
  'spelling',
  'waffle',
  'combinations',
];

export const BADGE_DAILY_GAMES = [
  'wordle',
  'connections',
  'crossword',
  'numbers',
  'trivia',
  'strands',
];

const GAME_LABELS = {
  wordle: 'Wordle',
  connections: 'Connections',
  crossword: 'Crossword',
  numbers: 'Numbers',
  trivia: 'Trivia',
  strands: 'Strands',
  spelling: 'Spelling Bee',
  waffle: 'Waffle',
  combinations: 'Combinations',
};

const RARITY_ORDER = {
  common: 1,
  rare: 2,
  epic: 3,
};

const getSafeProfile = (profile) => profile || getProfile();

const getGameStats = (profile, key) => profile?.games?.[key] || {};

const getHistory = (stats) => (Array.isArray(stats?.history) ? stats.history : []);

const getBestAttempts = (stats) => {
  const attempts = getHistory(stats)
    .filter((entry) => entry?.win && Number.isFinite(entry?.attempts))
    .map((entry) => entry.attempts);
  if (!attempts.length) return null;
  return Math.min(...attempts);
};

const getBestTime = (stats) => {
  if (Number.isFinite(stats?.bestTime)) return stats.bestTime;
  const times = getHistory(stats)
    .filter((entry) => Number.isFinite(entry?.time))
    .map((entry) => entry.time);
  if (!times.length) return null;
  return Math.min(...times);
};

const getMaxScore = (stats) => {
  const scores = getHistory(stats)
    .filter((entry) => Number.isFinite(entry?.score))
    .map((entry) => entry.score);
  if (!scores.length) return 0;
  return Math.max(...scores);
};

const getExactHits = (stats) =>
  getHistory(stats).filter((entry) => entry?.exact === true).length;

const getNoHintWins = (stats) =>
  getHistory(stats).filter((entry) => entry?.win && entry?.hintsUsed === 0).length;

const getRankCount = (stats, rank) => Number(stats?.rankDistribution?.[rank] || 0);

const toNumber = (value) => (Number.isFinite(value) ? value : 0);

const aggregateValues = (values, aggregation = 'sum', countThreshold = 1) => {
  if (!values.length) return 0;
  switch (aggregation) {
    case 'sum':
      return values.reduce((sum, value) => sum + toNumber(value), 0);
    case 'max':
      return Math.max(...values.map((value) => toNumber(value)));
    case 'min':
      return Math.min(...values.map((value) => toNumber(value)));
    case 'count':
      return values.filter((value) => toNumber(value) >= countThreshold).length;
    default:
      return toNumber(values[0]);
  }
};

const resolveScopeKeys = (scope) => {
  if (!scope || scope === 'any' || scope === 'all') return BADGE_GAME_KEYS;
  if (Array.isArray(scope)) return scope;
  return [scope];
};

const getMetricFromStats = (stats, metric) => {
  switch (metric) {
    case 'gamesWon':
      return toNumber(stats?.gamesWon);
    case 'gamesPlayed':
      return toNumber(stats?.gamesPlayed);
    case 'currentStreak':
      return toNumber(stats?.currentStreak);
    case 'perfectGames':
      return toNumber(stats?.perfectGames || stats?.perfectSolves);
    case 'totalWords':
      return toNumber(stats?.totalWords);
    case 'totalPangrams':
      return toNumber(stats?.totalPangrams);
    case 'queenBeeCount':
      return toNumber(stats?.queenBeeCount);
    case 'maxComboLength':
      return toNumber(stats?.maxComboLength);
    case 'totalBonusWords':
      return toNumber(stats?.totalBonusWords);
    case 'bestAttempts':
      return getBestAttempts(stats);
    case 'bestTime':
      return getBestTime(stats);
    case 'maxScore':
      return getMaxScore(stats);
    case 'exactHits':
      return getExactHits(stats);
    case 'noHintWins':
      return getNoHintWins(stats);
    case 'rankGenius':
      return getRankCount(stats, 'Genius');
    default:
      return 0;
  }
};

const computeMetricValue = (profile, requirement) => {
  if (!profile || !requirement) return 0;

  const scopeKeys = resolveScopeKeys(requirement.scope);

  if (requirement.metric === 'gamesPlayedToday') {
    const today = getTodayString();
    const values = scopeKeys.map((key) => {
      const stats = getGameStats(profile, key);
      return stats?.lastPlayedDate === today ? 1 : 0;
    });
    return aggregateValues(values, requirement.aggregation || 'sum', requirement.countThreshold);
  }

  const values = scopeKeys.map((key) => getMetricFromStats(getGameStats(profile, key), requirement.metric));

  if (requirement.aggregation) {
    return aggregateValues(values, requirement.aggregation, requirement.countThreshold);
  }

  if (values.length === 1) return toNumber(values[0]);
  return aggregateValues(values, 'sum');
};

const getComparison = (requirement) =>
  requirement?.comparison || (requirement?.metric === 'bestTime' || requirement?.metric === 'bestAttempts' ? 'lte' : 'gte');

const clampRatio = (value) => Math.max(0, Math.min(1, value));

export const getBadgeProgressEntry = (badge, profile) => {
  const requirement = badge?.requirement;
  const target = requirement?.target || 1;
  const comparison = getComparison(requirement);
  const current = requirement ? computeMetricValue(profile, requirement) : 0;

  let ratio = 0;
  if (comparison === 'lte') {
    ratio = current ? clampRatio(target / current) : 0;
  } else {
    ratio = clampRatio(current / target);
  }

  const isComplete = comparison === 'lte' ? current > 0 && current <= target : current >= target;

  return {
    current,
    target,
    ratio,
    isComplete,
    comparison,
    metric: requirement?.metric || 'event',
    scope: requirement?.scope,
  };
};

export const getProgressDisplay = (badge, progress) => {
  if (!badge || !progress) return '';

  const labelMap = {
    gamesWon: 'wins',
    gamesPlayed: 'plays',
    currentStreak: 'days',
    perfectGames: 'perfects',
    totalWords: 'words',
    totalPangrams: 'pangrams',
    queenBeeCount: 'queen bees',
    maxComboLength: 'combo',
    totalBonusWords: 'bonus words',
    exactHits: 'exact hits',
    noHintWins: 'no-hint wins',
    rankGenius: 'genius ranks',
  };

  if (progress.comparison === 'lte') {
    const unit = progress.metric === 'bestTime' ? 's' : 'tries';
    const currentText = progress.current ? `${progress.current}${unit}` : '-';
    return `Best: ${currentText} - Target <= ${progress.target}${unit}`;
  }

  const unit = labelMap[progress.metric] ? ` ${labelMap[progress.metric]}` : '';
  return `${Math.min(progress.current, progress.target)}/${progress.target}${unit}`;
};

export const getRequirementLines = (badge) => {
  if (!badge) return [];
  if (Array.isArray(badge.requirements) && badge.requirements.length) {
    return badge.requirements;
  }

  const requirement = badge.requirement || {};
  const scope = requirement.scope;
  const scopeLabel = Array.isArray(scope)
    ? scope.map((key) => GAME_LABELS[key] || key).join(', ')
    : scope === 'any'
      ? 'any game'
      : scope === 'all'
        ? 'all games'
        : GAME_LABELS[scope] || scope;

  const lines = [];

  if (requirement.metric === 'currentStreak') {
    lines.push(`Target: ${requirement.target} day streak (${scopeLabel})`);
  } else if (requirement.metric === 'gamesPlayedToday') {
    lines.push(`Play ${requirement.target} daily puzzles (${scopeLabel})`);
  } else if (requirement.metric === 'gamesWon') {
    lines.push(`Win ${requirement.target} ${scopeLabel} games`);
  } else if (requirement.metric === 'gamesPlayed') {
    lines.push(`Play ${requirement.target} ${scopeLabel} games`);
  } else if (requirement.metric === 'bestAttempts') {
    lines.push(`Solve in ${requirement.target} attempt${requirement.target === 1 ? '' : 's'} or fewer`);
  } else if (requirement.metric === 'bestTime') {
    lines.push(`Finish in ${requirement.target} seconds or less`);
  } else if (requirement.metric === 'maxScore') {
    lines.push(`Reach ${requirement.target}+ points`);
  } else if (requirement.metric === 'maxComboLength') {
    lines.push(`Create a combo of ${requirement.target}+ fragments`);
  } else if (requirement.metric === 'totalWords') {
    lines.push(`Find ${requirement.target}+ words`);
  } else if (requirement.metric === 'totalPangrams') {
    lines.push(`Find ${requirement.target}+ pangrams`);
  } else if (requirement.metric === 'queenBeeCount') {
    lines.push(`Complete ${requirement.target}+ puzzles perfectly`);
  } else if (requirement.metric === 'exactHits') {
    lines.push(`Hit the exact target ${requirement.target} time${requirement.target === 1 ? '' : 's'}`);
  } else if (requirement.metric === 'noHintWins') {
    lines.push(`Complete a puzzle with zero hints`);
  } else if (requirement.metric === 'rankGenius') {
    lines.push(`Reach Genius rank`);
  } else if (requirement.metric === 'totalBonusWords') {
    lines.push(`Find ${requirement.target}+ bonus words`);
  }

  if (!lines.length) {
    lines.push(badge.description);
  }

  return lines;
};

export const getUserBadgeState = (profileOverride) => {
  const profile = getSafeProfile(profileOverride);
  if (!profile) {
    return {
      earnedBadgeIds: [],
      earnedAtMap: {},
      progressMap: {},
      lastSeenBadgeEarnedAt: null,
    };
  }

  const earnedBadgeIds = profile.achievements?.map((entry) => entry.id) || [];
  const earnedAtMap = {};
  (profile.achievements || []).forEach((entry) => {
    earnedAtMap[entry.id] = entry.unlockedAt;
  });

  const progressMap = {};
  BADGES.forEach((badge) => {
    const progress = getBadgeProgressEntry(badge, profile);
    progressMap[badge.id] = progress.current;
  });

  return {
    earnedBadgeIds,
    earnedAtMap,
    progressMap,
    lastSeenBadgeEarnedAt: profile.lastSeenBadgeEarnedAt || null,
  };
};

export const buildBadgeViewModel = (profileOverride) => {
  const profile = getSafeProfile(profileOverride);
  const state = getUserBadgeState(profile);
  const earnedSet = new Set(state.earnedBadgeIds);
  const lastSeen = state.lastSeenBadgeEarnedAt ? new Date(state.lastSeenBadgeEarnedAt).getTime() : 0;

  return BADGES.map((badge) => {
    const progress = getBadgeProgressEntry(badge, profile);
    const earnedAt = state.earnedAtMap[badge.id];
    const earnedAtTime = earnedAt ? new Date(earnedAt).getTime() : 0;
    const isNew = earnedAtTime && earnedAtTime > lastSeen;

    return {
      ...badge,
      earned: earnedSet.has(badge.id),
      earnedAt,
      isNew,
      progress,
      progressText: getProgressDisplay(badge, progress),
      requirementLines: getRequirementLines(badge),
    };
  });
};

export const markBadgesSeen = () => {
  const profile = getProfile();
  if (!profile) return;

  const latestEarnedAt = (profile.achievements || []).reduce((latest, entry) => {
    if (!entry?.unlockedAt) return latest;
    if (!latest) return entry.unlockedAt;
    return entry.unlockedAt > latest ? entry.unlockedAt : latest;
  }, null);

  profile.lastSeenBadgeEarnedAt = latestEarnedAt || new Date().toISOString();
  saveProfile(profile);
};

export const getBadgeCounts = (profileOverride) => {
  const profile = getSafeProfile(profileOverride);
  const total = BADGES.length;
  const earned = profile?.achievements?.length || 0;
  const ratio = total ? earned / total : 0;
  return { total, earned, ratio };
};

export const getNextBadge = (profileOverride) => {
  const profile = getSafeProfile(profileOverride);
  if (!profile) return null;

  const badges = buildBadgeViewModel(profile);
  const locked = badges.filter((badge) => !badge.earned);
  if (!locked.length) return null;

  const sorted = [...locked].sort((a, b) => b.progress.ratio - a.progress.ratio);
  return sorted[0];
};

export const sortBadges = (badges, sortMode) => {
  const getRarityRank = (badge) => RARITY_ORDER[badge.rarity] || 0;

  const sorted = [...badges];

  if (sortMode === 'recent') {
    sorted.sort((a, b) => {
      if (a.earned && b.earned) {
        return new Date(b.earnedAt || 0).getTime() - new Date(a.earnedAt || 0).getTime();
      }
      if (a.earned) return -1;
      if (b.earned) return 1;
      return b.progress.ratio - a.progress.ratio;
    });
    return sorted;
  }

  if (sortMode === 'rarity') {
    sorted.sort((a, b) => {
      const rarityDiff = getRarityRank(b) - getRarityRank(a);
      if (rarityDiff !== 0) return rarityDiff;
      if (a.earned !== b.earned) return a.earned ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    return sorted;
  }

  // default: closest to unlock
  sorted.sort((a, b) => {
    if (a.earned !== b.earned) return a.earned ? 1 : -1;
    if (!a.earned && !b.earned) {
      return b.progress.ratio - a.progress.ratio;
    }
    return (new Date(b.earnedAt || 0).getTime()) - (new Date(a.earnedAt || 0).getTime());
  });
  return sorted;
};

export const getScopeLabel = (scope) => {
  if (!scope) return '';
  if (scope === 'any') return 'any game';
  if (scope === 'all') return 'all games';
  if (Array.isArray(scope)) {
    return scope.map((key) => GAME_LABELS[key] || key).join(', ');
  }
  return GAME_LABELS[scope] || scope;
};
