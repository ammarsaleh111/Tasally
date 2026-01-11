/**
 * Session Tracker
 * Tracks user activity: page visits, game starts/ends, and timestamps
 * Updates every 30 seconds and on key events
 * 
 * Data structure:
 * {
 *   userId,
 *   name,
 *   sessions: [
 *     {
 *       startTime: ISO timestamp,
 *       page: 'games' | 'profile' | 'game:wordle' | etc.,
 *       game: 'wordle' | 'connections' | null,
 *       lastActivity: ISO timestamp,
 *       events: [
 *         { type: 'page_load' | 'game_start' | 'game_end', timestamp, details }
 *       ]
 *     }
 *   ]
 * }
 */

import { syncActivityEvent } from '@/utils/backendSync';

const SESSION_KEY = 'ammarTimes_session';
const ALL_SESSIONS_KEY = 'ammarTimes_allSessions';

// Initialize or get current session
export function getSession() {
  if (typeof window === 'undefined') return null;

  const stored = localStorage.getItem(SESSION_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error('Error parsing session:', e);
      return createNewSession();
    }
  }

  return createNewSession();
}

// Create a new session
function createNewSession() {
  if (typeof window === 'undefined') return null;

  const { getProfile } = require('./profileManager');
  const profile = getProfile();

  const session = {
    userId: profile.userId,
    name: profile.name || 'Anonymous',
    sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    startTime: new Date().toISOString(),
    currentPage: getCurrentPage(),
    currentGame: null,
    lastActivity: new Date().toISOString(),
    events: [
      {
        type: 'session_start',
        timestamp: new Date().toISOString(),
        page: getCurrentPage(),
      },
    ],
  };

  saveSession(session);
  return session;
}

// Save session to localStorage
export function saveSession(session) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

// Track an activity event
export function trackActivity(type, details = {}) {
  if (typeof window === 'undefined') return;

  let session = getSession();
  if (!session) {
    session = createNewSession();
  }

  // Update name from profile if changed
  const { getProfile } = require('./profileManager');
  const profile = getProfile();
  if (profile && profile.name && profile.name !== session.name) {
    session.name = profile.name;
  }

  const event = {
    type,
    timestamp: new Date().toISOString(),
    page: getCurrentPage(),
    ...details,
  };

  // Update session
  session.currentPage = getCurrentPage();
  if (details.game) {
    session.currentGame = details.game;
  }
  session.lastActivity = new Date().toISOString();

  // Add event
  if (!session.events) {
    session.events = [];
  }
  session.events.push(event);

  // Keep only last 100 events
  if (session.events.length > 100) {
    session.events = session.events.slice(-100);
  }

  saveSession(session);

  // Archive to all sessions
  archiveActivity(session.userId, session.name, event);
  syncActivityEvent(session.userId, session.name, event);
}

// Track page navigation
export function trackPageLoad(page) {
  trackActivity('page_load', { page });
}

// Track game start
export function trackGameStart(gameName) {
  trackActivity('game_start', { game: gameName });
}

// Track game completion
export function trackGameEnd(gameName, result) {
  trackActivity('game_end', {
    game: gameName,
    win: result.win,
    time: result.time,
  });
}

// Get current page from URL
function getCurrentPage() {
  if (typeof window === 'undefined') return 'unknown';

  const path = window.location.pathname;
  if (path === '/') return 'home';
  if (path.startsWith('/games')) {
    const gameMatch = path.match(/\/games\/([a-z]+)/);
    return gameMatch ? `game:${gameMatch[1]}` : 'games';
  }
  if (path.startsWith('/profile')) return 'profile';
  if (path.startsWith('/admin')) return 'admin';
  if (path.startsWith('/themes')) return 'themes';
  return path.replace(/\//g, ':') || 'unknown';
}

// Archive activities to global sessions store
function archiveActivity(userId, playerName, event) {
  if (typeof window === 'undefined') return;

  let allSessions = [];
  try {
    const stored = localStorage.getItem(ALL_SESSIONS_KEY);
    if (stored) {
      allSessions = JSON.parse(stored);
    }
  } catch (e) {
    allSessions = [];
  }

  // Find or create user activity entry
  let userSession = allSessions.find(s => s.userId === userId);
  if (!userSession) {
    userSession = {
      userId,
      name: playerName,
      activities: [],
      lastSeen: new Date().toISOString(),
    };
    allSessions.push(userSession);
  }

  // Update last seen
  userSession.lastSeen = new Date().toISOString();
  userSession.name = playerName || userSession.name; // Update name if changed (but don't overwrite with null)

  // Add activity
  userSession.activities.push(event);

  // Keep only last 500 activities
  if (userSession.activities.length > 500) {
    userSession.activities = userSession.activities.slice(-500);
  }

  // Keep only last 1000 users (LRU cache)
  if (allSessions.length > 1000) {
    allSessions = allSessions.sort((a, b) => new Date(b.lastSeen) - new Date(a.lastSeen)).slice(0, 1000);
  }

  localStorage.setItem(ALL_SESSIONS_KEY, JSON.stringify(allSessions));
}

// Get all active sessions (online users)
export function getActiveSessions(minutesActive = 5) {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(ALL_SESSIONS_KEY);
    if (!stored) return [];

    const allSessions = JSON.parse(stored);
    const cutoffTime = new Date(Date.now() - minutesActive * 60 * 1000);

    return allSessions.filter(session => {
      const lastSeen = new Date(session.lastSeen);
      return lastSeen > cutoffTime;
    });
  } catch (e) {
    console.error('Error getting active sessions:', e);
    return [];
  }
}

// Get user activity summary
export function getUserActivitySummary(userId) {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(ALL_SESSIONS_KEY);
    if (!stored) return null;

    const allSessions = JSON.parse(stored);
    return allSessions.find(s => s.userId === userId) || null;
  } catch (e) {
    console.error('Error getting activity summary:', e);
    return null;
  }
}

// Get total unique users (all time)
export function getTotalUniqueUsers() {
  if (typeof window === 'undefined') return 0;

  try {
    const stored = localStorage.getItem(ALL_SESSIONS_KEY);
    if (!stored) return 0;

    const allSessions = JSON.parse(stored);
    const uniqueUserIds = new Set(allSessions.map(s => s.userId));
    return uniqueUserIds.size;
  } catch (e) {
    console.error('Error getting total users:', e);
    return 0;
  }
}

// Get all users with their details
export function getAllUsers() {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(ALL_SESSIONS_KEY);
    if (!stored) return [];

    const allSessions = JSON.parse(stored);
    return allSessions.map(session => ({
      userId: session.userId,
      name: session.name,
      lastSeen: session.lastSeen,
      totalActivities: session.activities ? session.activities.length : 0,
    }));
  } catch (e) {
    console.error('Error getting all users:', e);
    return [];
  }
}

// Get statistics for active users
export function getActivityStats() {
  if (typeof window === 'undefined') return {};

  try {
    const activeSessions = getActiveSessions(30); // Last 30 minutes

    const stats = {
      totalActivePlayers: activeSessions.length,
      gamesPlaying: {},
      pagesViewed: {},
      recentGames: [],
    };

    activeSessions.forEach(session => {
      // Count games being played
      if (session.activities && session.activities.length > 0) {
        const lastActivity = session.activities[session.activities.length - 1];
        if (lastActivity.game) {
          stats.gamesPlaying[lastActivity.game] = (stats.gamesPlaying[lastActivity.game] || 0) + 1;
        }
        if (lastActivity.page) {
          stats.pagesViewed[lastActivity.page] = (stats.pagesViewed[lastActivity.page] || 0) + 1;
        }

        // Get recent game results
        const gameEnds = session.activities.filter(a => a.type === 'game_end');
        if (gameEnds.length > 0) {
          const recentGame = gameEnds[gameEnds.length - 1];
          stats.recentGames.push({
            userId: session.userId,
            name: session.name,
            game: recentGame.game,
            win: recentGame.win,
            time: recentGame.time,
            timestamp: recentGame.timestamp,
          });
        }
      }
    });

    // Sort recent games by timestamp
    stats.recentGames.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 50);

    return stats;
  } catch (e) {
    console.error('Error getting activity stats:', e);
    return {};
  }
}

// Clear old session data (cleanup)
export function cleanupOldSessions(daysToKeep = 7) {
  if (typeof window === 'undefined') return;

  try {
    const stored = localStorage.getItem(ALL_SESSIONS_KEY);
    if (!stored) return;

    const allSessions = JSON.parse(stored);
    const cutoffTime = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);

    const filtered = allSessions.filter(session => {
      const lastSeen = new Date(session.lastSeen);
      return lastSeen > cutoffTime;
    });

    localStorage.setItem(ALL_SESSIONS_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.error('Error cleaning up sessions:', e);
  }
}

// Initialize session tracking (should be called on app start)
export function initSessionTracking() {
  if (typeof window === 'undefined') return;

  // Create session if none exists
  if (!getSession()) {
    createNewSession();
  }

  // Track page load
  trackPageLoad(getCurrentPage());

  // Setup periodic activity tracking (every 30 seconds)
  const trackingInterval = setInterval(() => {
    const session = getSession();
    if (session) {
      session.lastActivity = new Date().toISOString();
      saveSession(session);
      archiveActivity(session.userId, session.name, {
        type: 'activity_update',
        timestamp: new Date().toISOString(),
        page: getCurrentPage(),
      });
      syncActivityEvent(session.userId, session.name, {
        type: 'activity_update',
        timestamp: new Date().toISOString(),
        page: getCurrentPage(),
      });
    }
  }, 30000); // 30 seconds

  // Cleanup old sessions daily
  const cleanupInterval = setInterval(() => {
    cleanupOldSessions();
  }, 24 * 60 * 60 * 1000); // 24 hours

  return () => {
    clearInterval(trackingInterval);
    clearInterval(cleanupInterval);
  };
}
