export const activeClients = new Set();
export const activeSessions = new Map();
export const gameStates = new Map();
export const connectionsByIP = new Map();

export const metrics = {
  totalConnections: 0,
  activeGames: 0,
  lastUpdate: Date.now(),
};

export function broadcast(channel, payload) {
  const message = JSON.stringify({
    channel,
    payload,
    timestamp: Date.now(),
  });
  
  activeClients.forEach(controller => {
    try {
      controller.enqueue(`data: ${message}\n\n`);
    } catch (e) {
      activeClients.delete(controller);
    }
  });
}

export function updateSession(sessionId, data) {
  activeSessions.set(sessionId, {
    ...data,
    lastSeen: Date.now(),
  });
  
  const now = Date.now();
  activeSessions.forEach((session, id) => {
    if (now - session.lastSeen > 5 * 60 * 1000) {
      activeSessions.delete(id);
    }
  });
  
  broadcastMetrics();
}

export function updateGameState(sessionId, game, state) {
  const key = `${sessionId}:${game}`;
  gameStates.set(key, {
    ...state,
    sessionId,
    game,
    timestamp: Date.now(),
  });
  
  const now = Date.now();
  gameStates.forEach((gs, k) => {
    if (now - gs.timestamp > 30 * 60 * 1000) {
      gameStates.delete(k);
    }
  });
  
  broadcastMetrics();
}

export function broadcastMetrics() {
  const now = Date.now();
  
  // Count active sessions (seen in last 2 minutes)
  const activePlayers = Array.from(activeSessions.values())
    .filter(s => now - s.lastSeen < 2 * 60 * 1000);
  
  // Count active games (updated in last 5 minutes)
  const activeGames = Array.from(gameStates.values())
    .filter(g => now - g.timestamp < 5 * 60 * 1000);
  
  // Calculate game distribution
  const gameDistribution = {};
  activeGames.forEach(g => {
    gameDistribution[g.game] = (gameDistribution[g.game] || 0) + 1;
  });
  
  // Group players by browser
  const browsers = {};
  activePlayers.forEach(p => {
    const browser = p.browser || 'Unknown';
    browsers[browser] = (browsers[browser] || 0) + 1;
  });
  
  broadcast('metrics', {
    activePlayers: activePlayers.length,
    activeGames: activeGames.length,
    gameDistribution,
    browsers,
    sessions: activePlayers.map(p => ({
      id: p.sessionId?.substring(0, 8) + '...',
      name: p.playerName || 'Anonymous',
      currentGame: p.currentGame,
      lastSeen: p.lastSeen,
      browser: p.browser,
    })),
    liveGames: activeGames.map(g => ({
      player: g.playerName || 'Anonymous',
      game: g.game,
      progress: g.progress,
      attempts: g.attempts,
      timestamp: g.timestamp,
    })),
  });
}
