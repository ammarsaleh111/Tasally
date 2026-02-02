/**
 * Real-Time SSE Stream API Route
 * Server-Sent Events endpoint for live admin dashboard updates
 * 
 * Performance optimizations for serverless:
 * - Connection timeout (2 minutes) to prevent serverless hanging
 * - Max connections per IP limit
 * - Keepalive pings every 30 seconds
 * - Graceful cleanup on disconnect
 */

// In-memory store for active sessions and game states
const activeClients = new Set();
const activeSessions = new Map();
const gameStates = new Map();
const connectionsByIP = new Map(); // Track connections per IP

// Serverless-friendly limits
const MAX_CONNECTION_TIME_MS = 2 * 60 * 1000; // 2 minutes max connection
const MAX_CONNECTIONS_PER_IP = 3;
const KEEPALIVE_INTERVAL_MS = 30000;

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
  
  // Get client IP for connection limiting
  const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                   request.headers.get('x-real-ip') || 
                   'unknown';
  
  // Check connection limit per IP
  const currentConnections = connectionsByIP.get(clientIP) || 0;
  if (currentConnections >= MAX_CONNECTIONS_PER_IP) {
    return new Response(
      JSON.stringify({ error: 'Too many connections from this IP' }),
      { 
        status: 429,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
  
  // Track this connection
  connectionsByIP.set(clientIP, currentConnections + 1);
  
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  const encoder = new TextEncoder();
  
  // Custom controller to track this client
  const controller = {
    enqueue: (data) => writer.write(encoder.encode(data)),
    clientIP,
    connectedAt: Date.now(),
  };
  
  activeClients.add(controller);
  
  // Send initial connection message
  const initialData = JSON.stringify({
    channel: 'connection',
    payload: { 
      status: 'connected', 
      clientCount: activeClients.size,
      maxConnectionTime: MAX_CONNECTION_TIME_MS / 1000,
    },
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
      cleanupConnection(controller);
    }
  }, KEEPALIVE_INTERVAL_MS);
  
  // Connection timeout - force close after MAX_CONNECTION_TIME
  const connectionTimeout = setTimeout(() => {
    try {
      const timeoutMsg = JSON.stringify({
        channel: 'connection',
        payload: { status: 'timeout', reason: 'Connection timeout - please reconnect' },
        timestamp: Date.now(),
      });
      writer.write(encoder.encode(`data: ${timeoutMsg}\n\n`));
      writer.close().catch(() => {});
    } catch (e) {
      // Ignore errors during cleanup
    }
    cleanupConnection(controller);
    clearInterval(keepAlive);
  }, MAX_CONNECTION_TIME_MS);
  
  // Handle client disconnect
  request.signal.addEventListener('abort', () => {
    clearInterval(keepAlive);
    clearTimeout(connectionTimeout);
    cleanupConnection(controller);
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

/**
 * Clean up a disconnected client
 */
function cleanupConnection(controller) {
  activeClients.delete(controller);
  
  // Decrement IP connection count
  const currentCount = connectionsByIP.get(controller.clientIP) || 1;
  if (currentCount <= 1) {
    connectionsByIP.delete(controller.clientIP);
  } else {
    connectionsByIP.set(controller.clientIP, currentCount - 1);
  }
}
