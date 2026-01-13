/**
 * Real-Time SSE Stream API Route
 * Server-Sent Events endpoint for live admin dashboard updates
 */

// In-memory store for active sessions and game states
const activeClients = new Set();
const activeSessions = new Map();
const gameStates = new Map();
const metrics = {
  totalConnections: 0,
  activeGames: 0,
  lastUpdate: Date.now(),
};

// Broadcast data to all connected clients
function broadcast(channel, payload) {
  const message = JSON.stringify({
    channel,
    payload,
    timestamp: Date.now(),
  });
  
  activeClients.forEach(controller => {
    try {
      controller.enqueue(`data: ${message}\n\n`);
    } catch (e) {
      // Client disconnected
      activeClients.delete(controller);
    }
  });
}

// Update session data
export function updateSession(sessionId, data) {
  activeSessions.set(sessionId, {
    ...data,
    lastSeen: Date.now(),
  });
  
  // Clean up stale sessions (older than 5 minutes)
  const now = Date.now();
  activeSessions.forEach((session, id) => {
    if (now - session.lastSeen > 5 * 60 * 1000) {
      activeSessions.delete(id);
    }
  });
  
  broadcastMetrics();
}

// Update game state
export function updateGameState(sessionId, game, state) {
  const key = `${sessionId}:${game}`;
  gameStates.set(key, {
    ...state,
    sessionId,
    game,
    timestamp: Date.now(),
  });
  
  // Clean up old game states (older than 30 minutes)
  const now = Date.now();
  gameStates.forEach((gs, k) => {
    if (now - gs.timestamp > 30 * 60 * 1000) {
      gameStates.delete(k);
    }
  });
  
  broadcastMetrics();
}

// Broadcast current metrics to all clients
function broadcastMetrics() {
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

export async function GET(request) {
  metrics.totalConnections++;
  
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  const encoder = new TextEncoder();
  
  // Custom controller to track this client
  const controller = {
    enqueue: (data) => writer.write(encoder.encode(data)),
  };
  
  activeClients.add(controller);
  
  // Send initial connection message
  const initialData = JSON.stringify({
    channel: 'connection',
    payload: { status: 'connected', clientCount: activeClients.size },
    timestamp: Date.now(),
  });
  writer.write(encoder.encode(`data: ${initialData}\n\n`));
  
  // Send current metrics immediately
  setTimeout(() => broadcastMetrics(), 100);
  
  // Keep-alive ping every 30 seconds
  const keepAlive = setInterval(() => {
    try {
      writer.write(encoder.encode(`: keepalive\n\n`));
    } catch (e) {
      clearInterval(keepAlive);
      activeClients.delete(controller);
    }
  }, 30000);
  
  // Handle client disconnect
  request.signal.addEventListener('abort', () => {
    clearInterval(keepAlive);
    activeClients.delete(controller);
    writer.close().catch(() => {});
  });
  
  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Nginx support
    },
  });
}
