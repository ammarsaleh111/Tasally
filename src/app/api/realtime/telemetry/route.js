/**
 * Real-Time Telemetry API Route
 * Receives game telemetry data from clients
 */

import { updateGameState } from '../stream/route';

// In-memory store for recent telemetry events
const recentEvents = [];
const MAX_EVENTS = 500;

export async function POST(request) {
  try {
    const data = await request.json();
    
    const {
      sessionId,
      playerName,
      game,
      eventType,
      details,
      timestamp,
    } = data;
    
    if (!game || !eventType) {
      return Response.json({ error: 'Missing game or eventType' }, { status: 400 });
    }
    
    // Update game state for live monitoring
    if (sessionId && game) {
      updateGameState(sessionId, game, {
        playerName,
        progress: details?.progress || 0,
        attempts: details?.attempts || 0,
        guesses: details?.guesses || 0,
        completed: eventType === 'end',
        won: details?.won,
        eventType,
      });
    }
    
    // Store event for analytics
    recentEvents.unshift({
      sessionId: sessionId?.substring(0, 8) || 'unknown',
      playerName,
      game,
      eventType,
      details: summarizeDetails(details),
      timestamp: timestamp || Date.now(),
    });
    
    // Keep only recent events
    if (recentEvents.length > MAX_EVENTS) {
      recentEvents.length = MAX_EVENTS;
    }
    
    return Response.json({ 
      success: true,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('[Telemetry] Error:', error);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}

/**
 * GET recent telemetry events (for admin dashboard)
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '50', 10);
  const game = searchParams.get('game');
  
  let events = recentEvents;
  
  if (game) {
    events = events.filter(e => e.game === game);
  }
  
  return Response.json({
    events: events.slice(0, limit),
    total: events.length,
    timestamp: Date.now(),
  });
}

/**
 * Summarize details to reduce payload size
 */
function summarizeDetails(details = {}) {
  return {
    progress: details.progress,
    attempts: details.attempts,
    won: details.won,
    score: details.score,
    timeSpent: details.timeSpent,
  };
}
