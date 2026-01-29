/**
 * Real-Time Heartbeat API Route
 * Receives session heartbeats from clients
 */

import { updateSession } from '../stream/route';
import { db, guestProfiles, presenceSessions, users } from '@/db';
import { eq, lt } from 'drizzle-orm';

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
    
    // Parse browser from user agent
    const browser = parseBrowser(userAgent);
    
    // Update session in the stream module (in-memory SSE)
    updateSession(sessionId, {
      sessionId,
      playerName: playerName || 'Anonymous',
      currentGame,
      currentPage,
      browser,
      timestamp,
      lastSeen: Date.now(),
    });

    const now = new Date();
    const safeRole = typeof role === 'string' ? role.toUpperCase() : null;
    const normalizedRole = safeRole === 'ADMIN' || safeRole === 'USER' || safeRole === 'GUEST' ? safeRole : 'GUEST';
    const lastHeartbeatAt = Number.isFinite(timestamp) ? new Date(timestamp) : now;
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

    // Persist presence to database (source of truth for admin metrics)
    await db
      .insert(presenceSessions)
      .values({
        id: sessionId,
        userId: resolvedUserId ?? null,
        guestId: resolvedGuestId ?? null,
        displayName: playerName || 'Anonymous',
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
          displayName: playerName || 'Anonymous',
          role: normalizedRole,
          currentPage: currentPage || null,
          currentGame: currentGame || null,
          state: normalizedState,
          lastHeartbeatAt,
          updatedAt: now,
        },
      });

    // Best-effort update for guest last-seen if profile exists
    if (resolvedGuestId) {
      try {
        await db
          .update(guestProfiles)
          .set({ lastSeenAt: now })
          .where(eq(guestProfiles.id, resolvedGuestId));
      } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('[Heartbeat] Failed to update guest lastSeenAt', error);
        }
      }
    }

    // Clean up stale sessions (older than 7 days)
    try {
      const staleCutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      await db.delete(presenceSessions).where(lt(presenceSessions.lastHeartbeatAt, staleCutoff));
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[Heartbeat] Failed to clean stale sessions', error);
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
