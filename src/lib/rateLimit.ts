/**
 * Database-backed Rate Limiter for Serverless
 * 
 * Uses Neon Postgres for shared state across serverless instances.
 * Falls back to in-memory for development/testing.
 * 
 * Table: rate_limits (key, window_start, count, expires_at)
 */

import { db } from "@/db";
import { sql } from "drizzle-orm";
import { logRateLimitHit } from "./observability";
import { fail } from "@/server/http";

// Rate limit configuration per route
export const RATE_LIMITS = {
  // POST /api/auth/register: 5/min per IP
  REGISTER: { max: 5, windowSeconds: 60 },
  // POST /api/results: 10/min per user/guest
  RESULTS: { max: 10, windowSeconds: 60 },
  // POST /api/realtime/heartbeat: 60/min per session (legacy, allows ~1 per second burst)
  HEARTBEAT: { max: 60, windowSeconds: 60 },
  // POST /api/presence/heartbeat: 2/min per user (client calls every 60-120s)
  PRESENCE_HEARTBEAT: { max: 2, windowSeconds: 60 },
  // POST /api/realtime/telemetry: 30/min per session
  TELEMETRY: { max: 30, windowSeconds: 60 },
  // POST /api/link-guest: 5/day per user
  LINK_GUEST: { max: 5, windowSeconds: 86400 },
  // DELETE /api/account: 1/hour per user
  ACCOUNT_DELETE: { max: 1, windowSeconds: 3600 },
  // GET /api/leaderboard/*: 30/min per user (prevent abuse)
  LEADERBOARD: { max: 30, windowSeconds: 60 },
  // POST /api/auth/login: 10/min per IP (prevent brute force)
  LOGIN: { max: 10, windowSeconds: 60 },
  // Default for other write routes: 20/min
  DEFAULT_WRITE: { max: 20, windowSeconds: 60 },
} as const;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  retryAfterSeconds?: number;
}

/**
 * Check and update rate limit using database
 * Uses atomic upsert with window-based counting
 */
export async function checkRateLimit(
  key: string,
  maxRequests: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const now = new Date();
  const windowStart = new Date(Math.floor(now.getTime() / (windowSeconds * 1000)) * windowSeconds * 1000);
  const expiresAt = new Date(windowStart.getTime() + windowSeconds * 1000);

  try {
    // Atomic upsert: increment count or reset if window expired
    const result = await db.execute(sql`
      INSERT INTO rate_limits (key, window_start, count, expires_at)
      VALUES (${key}, ${windowStart}, 1, ${expiresAt})
      ON CONFLICT (key) DO UPDATE SET
        count = CASE 
          WHEN rate_limits.window_start < ${windowStart} THEN 1
          ELSE rate_limits.count + 1
        END,
        window_start = CASE
          WHEN rate_limits.window_start < ${windowStart} THEN ${windowStart}
          ELSE rate_limits.window_start
        END,
        expires_at = CASE
          WHEN rate_limits.window_start < ${windowStart} THEN ${expiresAt}
          ELSE rate_limits.expires_at
        END
      RETURNING count, expires_at
    `);

    // The result is an array of rows from postgres.js
    const rows = result as unknown as Array<{ count: number; expires_at: Date }>;
    const row = rows[0];
    const count = row?.count ?? 1;
    const resetAt = row?.expires_at ?? expiresAt;
    const remaining = Math.max(0, maxRequests - count);
    const allowed = count <= maxRequests;

    return {
      allowed,
      remaining,
      resetAt,
      retryAfterSeconds: allowed ? undefined : Math.ceil((resetAt.getTime() - now.getTime()) / 1000),
    };
  } catch (error) {
    // If rate_limits table doesn't exist, fail open (allow request)
    console.warn('[RateLimit] Database error, failing open:', error);
    return {
      allowed: true,
      remaining: maxRequests,
      resetAt: expiresAt,
    };
  }
}

/**
 * Create rate limit response with proper headers
 */
export function rateLimitResponse(
  result: RateLimitResult,
  route: string,
  identifier: string
): Response {
  logRateLimitHit(route, identifier);

  const response = fail(
    429,
    "RATE_LIMITED",
    "Too many requests",
    { retryAfter: result.retryAfterSeconds }
  );

  response.headers.set("Retry-After", String(result.retryAfterSeconds ?? 60));
  response.headers.set("X-RateLimit-Remaining", "0");
  response.headers.set("X-RateLimit-Reset", result.resetAt.toISOString());

  return response;
}

/**
 * Get client IP from request headers (works with Vercel/Netlify)
 */
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIP = request.headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }
  return "unknown";
}

/**
 * Build a rate limit key
 */
export function buildRateLimitKey(prefix: string, identifier: string): string {
  return `${prefix}:${identifier}`;
}

/**
 * Clean up expired rate limit entries (run periodically via cron or after requests)
 */
export async function cleanupExpiredRateLimits(): Promise<void> {
  try {
    await db.execute(sql`
      DELETE FROM rate_limits WHERE expires_at < NOW()
    `);
  } catch (error) {
    console.warn('[RateLimit] Cleanup error:', error);
  }
}
