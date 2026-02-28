/**
 * Real-Time Telemetry API Route
 * Receives game telemetry data from clients
 * 
 * Performance optimizations:
 * - Rate limiting (30/min per session)
 * - Sampling: only persist 1 in 5 non-critical events
 * - START events always persisted for analytics
 */

import { updateGameState } from '../store';
import { db, gameEvents } from '@/db';
import { checkRateLimit, buildRateLimitKey, RATE_LIMITS } from '@/lib/rateLimit';
import { createRequestTimer, logRequestMetrics, trackDbQuery } from '@/lib/observability';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Sampling rate for non-critical events (1 in N)
const EVENT_SAMPLING_RATE = 5;

// Events that always get persisted (no sampling)
const CRITICAL_EVENTS = new Set(['start', 'end', 'win', 'lose']);

function coerceUuid(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return UUID_REGEX.test(trimmed) ? trimmed : null;
}

// In-memory store for recent telemetry events
const recentEvents = [];
const MAX_EVENTS = 500;

export async function POST(request) {
  const timer = createRequestTimer();
  
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

    // Rate limiting: 30/min per session
    const identifier = sessionId || 'anonymous';
    const rateLimitKey = buildRateLimitKey('telemetry', identifier);
    const rateResult = await checkRateLimit(
      rateLimitKey,
      RATE_LIMITS.TELEMETRY.max,
      RATE_LIMITS.TELEMETRY.windowSeconds
    );
    
    if (!rateResult.allowed) {
      logRequestMetrics({
        route: '/api/realtime/telemetry',
        method: 'POST',
        statusCode: 200,
        durationMs: timer.elapsed(),
        rateLimited: true,
        timestamp: new Date().toISOString(),
      });
      return Response.json({
        success: true,
        throttled: true,
        dropped: true,
        retryAfterSeconds: rateResult.retryAfterSeconds ?? 60,
        timestamp: Date.now(),
      });
    }
    
    // Update game state for live monitoring (always do this - no DB write)
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
    
    // Store event for analytics (in-memory only)
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

    // Sampling: only persist critical events OR 1 in N non-critical events
    const isCritical = CRITICAL_EVENTS.has(eventType.toLowerCase());
    const shouldPersist = isCritical || Math.random() < (1 / EVENT_SAMPLING_RATE);

    // Persist START events for analytics (and sampled others)
    if (shouldPersist && (eventType === 'start' || isCritical)) {
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
          type: eventType.toUpperCase(),
          createdAt: new Date(timestamp || Date.now()),
        });
        trackDbQuery();
      } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('[Telemetry] Failed to append event', error);
        }
      }
    }

    logRequestMetrics({
      route: '/api/realtime/telemetry',
      method: 'POST',
      statusCode: 200,
      durationMs: timer.elapsed(),
      timestamp: new Date().toISOString(),
    });
    
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
