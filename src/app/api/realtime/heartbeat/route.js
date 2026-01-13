/**
 * Real-Time Heartbeat API Route
 * Receives session heartbeats from clients
 */

import { updateSession, updateGameState } from '../stream/route';

// In-memory store shared with stream route
const recentHeartbeats = [];
const MAX_HEARTBEATS = 1000;

export async function POST(request) {
  try {
    const data = await request.json();
    
    const {
      sessionId,
      playerName,
      currentGame,
      currentPage,
      timestamp,
      userAgent,
    } = data;
    
    if (!sessionId) {
      return Response.json({ error: 'Missing sessionId' }, { status: 400 });
    }
    
    // Parse browser from user agent
    const browser = parseBrowser(userAgent);
    
    // Update session in the stream module
    updateSession(sessionId, {
      sessionId,
      playerName: playerName || 'Anonymous',
      currentGame,
      currentPage,
      browser,
      timestamp,
      lastSeen: Date.now(),
    });
    
    // Store heartbeat for analytics
    recentHeartbeats.unshift({
      sessionId: sessionId.substring(0, 8),
      playerName,
      currentGame,
      browser,
      timestamp: Date.now(),
    });
    
    // Keep only recent heartbeats
    if (recentHeartbeats.length > MAX_HEARTBEATS) {
      recentHeartbeats.length = MAX_HEARTBEATS;
    }
    
    return Response.json({ 
      success: true,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('[Heartbeat] Error:', error);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}

/**
 * Parse browser name from user agent string
 */
function parseBrowser(userAgent = '') {
  if (!userAgent) return 'Unknown';
  
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Edg/')) return 'Edge';
  if (userAgent.includes('OPR/') || userAgent.includes('Opera')) return 'Opera';
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Safari')) return 'Safari';
  if (userAgent.includes('MSIE') || userAgent.includes('Trident')) return 'IE';
  
  return 'Other';
}
