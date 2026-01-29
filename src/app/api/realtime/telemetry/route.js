/**
 * Real-Time Telemetry API Route
 * Receives game telemetry data from clients
 */

import { updateGameState } from '../stream/route';
import { db, gameEvents } from '@/db';
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function coerceUuid(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return UUID_REGEX.test(trimmed) ? trimmed : null;
}

// In-memory store for recent telemetry events
const recentEvents = [];
const MAX_EVENTS = 500;

export async function POST(request) {
  try {
    const data = await request.json();
    
    const {
      sessionId,
      playerName,
      userId,
      role,
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

    // Persist START events for analytics
    if (eventType === 'start') {
      const safeRole = typeof role === 'string' ? role.toUpperCase() : null;
      const normalizedRole = safeRole === 'ADMIN' || safeRole === 'USER' || safeRole === 'GUEST' ? safeRole : null;
      const safeUserId = coerceUuid(userId);
      const resolvedUserId = normalizedRole === 'USER' ? safeUserId : null;
      const resolvedGuestId = normalizedRole === 'GUEST' ? safeUserId : null;

      try {
        await db.insert(gameEvents).values({
          userId: resolvedUserId ?? null,
          guestId: resolvedGuestId ?? null,
          gameKey: game,
          type: 'START',
          createdAt: new Date(timestamp || Date.now()),
        });
      } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('[Telemetry] Failed to append START event', error);
        }
      }
    }
    
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
