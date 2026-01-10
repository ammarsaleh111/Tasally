import { TRIVIA_SETS, generateDefaultSet } from './questions/trivia-2026-01';
import { getThemedTrivia } from './questions/themed';
import { getActiveTheme, getGameTheme } from '@/utils/themeEngine';

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
      const today = new Date();
      return {
        date: today.toISOString().split('T')[0],
        questions: themedQuestions
      };
    }
  }
  
  // Default behavior
  const today = new Date();
  const dayIndex = today.getDate() - 1;
  
  // Get the set for today or use fallback
  if (dayIndex < TRIVIA_SETS.length) {
    return TRIVIA_SETS[dayIndex];
  }
  
  // Generate fallback set
  const dateStr = today.toISOString().split('T')[0];
  return generateDefaultSet(dateStr);
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
  // Pick random questions from all available sets
  const allQuestions = TRIVIA_SETS.flatMap(set => set.questions);
  const shuffled = shuffleArray(allQuestions);
  const selected = shuffled.slice(0, 10);
  
  return {
    date: new Date().toISOString().split('T')[0],
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
  const baseScore = (correctAnswers / totalQuestions) * 1000;
  return Math.round(baseScore + timeBonus);
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
    localStorage.setItem('ammar-times-trivia-stats', JSON.stringify(stats));
  }
};

/**
 * Load game stats from localStorage
 */
export const loadStats = () => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('ammar-times-trivia-stats');
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
