/**
 * Real-Time Heartbeat API Route
 * Receives session heartbeats from clients
 * 
 * Performance optimizations:
 * - Server-side throttling (15s users, 30s guests)
 * - Rate limiting (60/min per session)
 * - Skips DB write if heartbeat too recent
 */

import { updateSession } from '../store';
import { db, guestProfiles, presenceSessions, users } from '@/db';
import { sanitizeName } from '@/utils/inputSanitizer';
import { eq, lt } from 'drizzle-orm';
import { checkHeartbeatThrottle } from '@/lib/heartbeatThrottle';
import { checkRateLimit, buildRateLimitKey, RATE_LIMITS } from '@/lib/rateLimit';
import { createRequestTimer, logRequestMetrics, trackDbQuery } from '@/lib/observability';

// In-memory store shared with stream route
const recentHeartbeats = [];
const MAX_HEARTBEATS = 1000;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function coerceUuid(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return UUID_REGEX.test(trimmed) ? trimmed : null;
}

export async function POST(request) {
  const timer = createRequestTimer();
  
  try {
    const data = await request.json();
    
    const {
      sessionId,
      playerName,
      currentGame,
      currentPage,
      timestamp,
      userAgent,
      userId,
      role,
      state,
    } = data;
    
    if (!sessionId) {
      return Response.json({ error: 'Missing sessionId' }, { status: 400 });
    }

    // Rate limiting: 60/min per session
    const rateLimitKey = buildRateLimitKey('heartbeat', sessionId);
    const rateResult = await checkRateLimit(
      rateLimitKey, 
      RATE_LIMITS.HEARTBEAT.max, 
      RATE_LIMITS.HEARTBEAT.windowSeconds
    );
    
    if (!rateResult.allowed) {
      logRequestMetrics({
        route: '/api/realtime/heartbeat',
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
    
    // Parse browser from user agent
    const browser = parseBrowser(userAgent);
    
    const sanitizedDisplayName = typeof playerName === 'string' ? sanitizeName(playerName) : '';
    const safeDisplayName = sanitizedDisplayName || 'Anonymous';

    // Update session in the stream module (in-memory SSE) - always do this
    updateSession(sessionId, {
      sessionId,
      playerName: safeDisplayName,
      currentGame,
      currentPage,
      browser,
      timestamp,
      lastSeen: Date.now(),
    });

    const now = new Date();
    const safeRole = typeof role === 'string' ? role.toUpperCase() : null;
    const normalizedRole = safeRole === 'ADMIN' || safeRole === 'USER' || safeRole === 'GUEST' ? safeRole : 'GUEST';

    // Server-side heartbeat throttling: skip DB write if too recent
    const throttleResult = await checkHeartbeatThrottle(sessionId, normalizedRole);
    trackDbQuery(); // Count the throttle check query
    
    if (!throttleResult.shouldWrite) {
      // Heartbeat too recent - respond success but skip DB writes
      logRequestMetrics({
        route: '/api/realtime/heartbeat',
        method: 'POST',
        statusCode: 200,
        durationMs: timer.elapsed(),
        dbQueryCount: 1, // Only the throttle check
        timestamp: new Date().toISOString(),
      });
      
      return Response.json({ 
        success: true,
        throttled: true,
        timestamp: Date.now(),
      });
    }

    const lastHeartbeatAt = now;
    const safeUserId = coerceUuid(userId);
    const resolvedUserId = normalizedRole === 'USER' ? safeUserId : null;
    const resolvedGuestId = normalizedRole === 'GUEST' ? safeUserId : null;
    const normalizedState = state === 'PLAYING' || state === 'IDLE' ? state : currentGame ? 'PLAYING' : 'IDLE';

    if (resolvedUserId) {
      const existing = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.id, resolvedUserId))
        .limit(1);
      trackDbQuery();

      if (!existing.length) {
        return Response.json(
          {
            error: 'Account deleted',
            code: 'ACCOUNT_DELETED',
            message: 'Your account was deleted by an admin.',
          },
          { status: 410 }
        );
      }
    }

    // Ensure guest profile exists before inserting presence (FK constraint)
    if (resolvedGuestId) {
      await db
        .insert(guestProfiles)
        .values({
          id: resolvedGuestId,
          displayName: safeDisplayName,
          createdAt: now,
          lastSeenAt: now,
        })
        .onConflictDoUpdate({
          target: guestProfiles.id,
          set: {
            displayName: safeDisplayName,
            lastSeenAt: now,
          },
        });
      trackDbQuery();
    }

    // Persist presence to database (source of truth for admin metrics)
    await db
      .insert(presenceSessions)
      .values({
        id: sessionId,
        userId: resolvedUserId ?? null,
        guestId: resolvedGuestId ?? null,
        displayName: safeDisplayName,
        role: normalizedRole,
        currentPage: currentPage || null,
        currentGame: currentGame || null,
        state: normalizedState,
        lastHeartbeatAt,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: presenceSessions.id,
        set: {
          userId: resolvedUserId ?? null,
          guestId: resolvedGuestId ?? null,
          displayName: safeDisplayName,
          role: normalizedRole,
          currentPage: currentPage || null,
          currentGame: currentGame || null,
          state: normalizedState,
          lastHeartbeatAt,
          updatedAt: now,
        },
      });
    trackDbQuery();

    if (resolvedUserId) {
      const updates = { lastSeenAt: now };
      if (sanitizedDisplayName) {
        updates.displayName = sanitizedDisplayName;
      }
      await db.update(users).set(updates).where(eq(users.id, resolvedUserId));
      trackDbQuery();
    }

    // Clean up stale sessions (older than 7 days) - do this less frequently
    // Only run cleanup 1% of the time to reduce DB load
    if (Math.random() < 0.01) {
      try {
        const staleCutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        await db.delete(presenceSessions).where(lt(presenceSessions.lastHeartbeatAt, staleCutoff));
        trackDbQuery();
      } catch (cleanupError) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('[Heartbeat] Failed to clean stale sessions', cleanupError);
        }
      }
    }
    
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

    logRequestMetrics({
      route: '/api/realtime/heartbeat',
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
