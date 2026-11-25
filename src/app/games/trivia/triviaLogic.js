import { getThemedTrivia } from './questions/themed';
import { getActiveTheme, getGameTheme } from '@/utils/themeEngine';
import { getUserStorageKey } from '@/utils/storageKeys';
import { loader as dailyData } from '@/data/all-data/games/trivia';
import { getCairoDateKey, monthKeyFromDate } from '@/data/all-data/utils/date';

/**
 * Get daily trivia set based on current date
 * Uses themed questions if a theme is active
 */
export const getDailyTrivia = () => {
  // Check for active theme
  const activeTheme = getActiveTheme();
  const gameTheme = getGameTheme('trivia');
  
  if (activeTheme && gameTheme?.questionSet) {
    const themedQuestions = getThemedTrivia(gameTheme.questionSet);
    if (themedQuestions) {
      return {
        date: getCairoDateKey(),
        questions: themedQuestions
      };
    }
  }
  
  const dateKey = getCairoDateKey();
  const questions = dailyData.getDailyGameData(dateKey);
  return {
    date: dateKey,
    questions
  };
};

/**
 * Shuffle array (Fisher-Yates algorithm)
 */
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

/**
 * Generate random trivia set
 */
export const generateRandomTrivia = () => {
  const dateKey = getCairoDateKey();
  const monthData = dailyData.getMonthGameData(monthKeyFromDate(dateKey));
  const allQuestions = Object.values(monthData).flat();
  const shuffled = shuffleArray(allQuestions);
  const selected = shuffled.slice(0, 10);
  
  return {
    date: dateKey,
    questions: selected
  };
};

/**
 * Check if answer is correct
 */
export const checkAnswer = (userAnswer, correctAnswer) => {
  return userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
};

/**
 * Calculate score
 */
export const calculateScore = (correctAnswers, totalQuestions, timeBonus = 0) => {
  const safeTotal = Math.max(1, totalQuestions);
  const accuracy = correctAnswers / safeTotal;
  const baseScore = 1200 * accuracy;
  const thresholdBonus = Math.round(Math.max(0, correctAnswers - 5) * 20);
  const timePenalty = Math.floor(Math.max(0, timeBonus) / 3);
  return Math.max(0, Math.round(baseScore + thresholdBonus - timePenalty));
};

/**
 * Get category color
 */
export const getCategoryColor = (category) => {
  const colors = {
    'Science': '#10b981', // green
    'History': '#3b82f6', // blue
    'Geography': '#f59e0b', // orange
    'Literature': '#8b5cf6', // purple
    'Math': '#ef4444', // red
    'Nature': '#22c55e', // lime
    'Sports': '#06b6d4', // cyan
    'Art': '#ec4899', // pink
    'Music': '#a855f7', // violet
    'Language': '#14b8a6', // teal
  };
  
  return colors[category] || '#6b7280'; // gray default
};

/**
 * Get performance message based on score
 */
export const getPerformanceMessage = (correctAnswers, totalQuestions) => {
  const percentage = (correctAnswers / totalQuestions) * 100;
  
  if (percentage === 100) return "🏆 Perfect Score! Genius!";
  if (percentage >= 90) return "🌟 Excellent! Almost perfect!";
  if (percentage >= 80) return "🎯 Great job! Well done!";
  if (percentage >= 70) return "👍 Good work! Keep it up!";
  if (percentage >= 60) return "📚 Not bad! Room to improve!";
  if (percentage >= 50) return "💪 Keep practicing!";
  return "🎓 Better luck next time!";
};

/**
 * Format time (seconds to MM:SS)
 */
export const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Get streak bonus points
 */
export const getStreakBonus = (streak) => {
  if (streak >= 5) return 100;
  if (streak >= 3) return 50;
  if (streak >= 2) return 25;
  return 0;
};

/**
 * Save game stats to localStorage
 */
export const saveStats = (stats) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(getUserStorageKey('tasally-trivia-stats'), JSON.stringify(stats));
  }
};

/**
 * Load game stats from localStorage
 */
export const loadStats = () => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(getUserStorageKey('tasally-trivia-stats'));
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
  }
  return null;
};

/**
 * Initialize default stats
 */
export const getDefaultStats = () => {
  return {
    gamesPlayed: 0,
    totalCorrect: 0,
    totalQuestions: 0,
    bestScore: 0,
    currentStreak: 0,
    maxStreak: 0,
    categoryStats: {}
  };
};
