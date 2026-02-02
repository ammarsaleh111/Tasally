/**
 * Server-Side Heartbeat Throttling
 * 
 * Prevents excessive DB writes by tracking last heartbeat time per session.
 * In serverless, we use the DB as the source of truth for throttling.
 * 
 * MIN_INTERVAL:
 * - Guests: 30 seconds
 * - Auth users: 15 seconds
 */

import { db, presenceSessions } from "@/db";
import { eq } from "drizzle-orm";

export const HEARTBEAT_MIN_INTERVALS = {
  GUEST: 30 * 1000, // 30 seconds in ms
  USER: 15 * 1000,  // 15 seconds in ms
  ADMIN: 15 * 1000, // 15 seconds in ms
} as const;

export interface HeartbeatThrottleResult {
  shouldWrite: boolean;
  lastHeartbeatAt: Date | null;
  timeSinceLastMs: number | null;
}

/**
 * Check if heartbeat should be written to DB based on last heartbeat time
 * Returns whether we should proceed with the DB write
 * 
 * @param sessionId - The session identifier
 * @param role - 'GUEST' | 'USER' | 'ADMIN'
 * @returns Object with shouldWrite flag and timing info
 */
export async function checkHeartbeatThrottle(
  sessionId: string,
  role: 'GUEST' | 'USER' | 'ADMIN'
): Promise<HeartbeatThrottleResult> {
  const minInterval = HEARTBEAT_MIN_INTERVALS[role] || HEARTBEAT_MIN_INTERVALS.GUEST;
  const now = Date.now();

  try {
    // Check if session exists and get last heartbeat time
    const existing = await db
      .select({ lastHeartbeatAt: presenceSessions.lastHeartbeatAt })
      .from(presenceSessions)
      .where(eq(presenceSessions.id, sessionId))
      .limit(1);

    if (!existing.length) {
      // New session, always allow first heartbeat
      return { shouldWrite: true, lastHeartbeatAt: null, timeSinceLastMs: null };
    }

    const lastHeartbeatAt = existing[0].lastHeartbeatAt;
    const timeSinceLastMs = now - lastHeartbeatAt.getTime();

    if (timeSinceLastMs < minInterval) {
      // Too soon, skip DB write
      return { shouldWrite: false, lastHeartbeatAt, timeSinceLastMs };
    }

    // Enough time has passed, allow write
    return { shouldWrite: true, lastHeartbeatAt, timeSinceLastMs };
  } catch (error) {
    // On error, allow write to avoid breaking functionality
    console.warn('[HeartbeatThrottle] Error checking throttle:', error);
    return { shouldWrite: true, lastHeartbeatAt: null, timeSinceLastMs: null };
  }
}
