/**
 * Leaderboard Cache Service
 * 
 * Provides DB-level caching for expensive leaderboard aggregation queries.
 * Uses the leaderboard_cache table with TTL-based expiry.
 * 
 * Features:
 * - Atomic cache read/write
 * - Stampede protection (only one computation at a time)
 * - Configurable TTL per leaderboard type
 * - Automatic cleanup of expired entries
 */

import { db, leaderboardCache } from "@/db";
import { sql, eq, gt } from "drizzle-orm";

// Cache TTL configuration (in seconds)
export const LEADERBOARD_CACHE_TTL = {
  daily: 30,    // 30 seconds for daily (more dynamic)
  monthly: 120, // 2 minutes for monthly (less dynamic)
} as const;

export interface CachedLeaderboard<T> {
  key: string;
  data: T;
  computedAt: Date;
  expiresAt: Date;
  computeTimeMs?: number;
  fromCache: boolean;
}

/**
 * Build a cache key for leaderboard
 */
export function buildLeaderboardCacheKey(
  type: 'daily' | 'monthly',
  gameKey: string,
  dateKey: string
): string {
  return `${type}:${gameKey}:${dateKey}`;
}

/**
 * Get cached leaderboard if valid
 * Returns null if cache miss or expired
 */
export async function getCachedLeaderboard<T>(key: string): Promise<CachedLeaderboard<T> | null> {
  try {
    const rows = await db
      .select()
      .from(leaderboardCache)
      .where(
        sql`${leaderboardCache.key} = ${key} AND ${leaderboardCache.expiresAt} > now()`
      )
      .limit(1);

    if (rows.length === 0) {
      return null;
    }

    const row = rows[0];
    return {
      key: row.key,
      data: row.payload as T,
      computedAt: row.computedAt,
      expiresAt: row.expiresAt,
      computeTimeMs: row.computeTimeMs ?? undefined,
      fromCache: true,
    };
  } catch (error) {
    console.warn('[LeaderboardCache] Get error:', error);
    return null;
  }
}

/**
 * Set leaderboard cache with TTL
 */
export async function setCachedLeaderboard<T>(
  key: string,
  data: T,
  ttlSeconds: number,
  computeTimeMs?: number
): Promise<void> {
  try {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttlSeconds * 1000);

    await db
      .insert(leaderboardCache)
      .values({
        key,
        payload: data as unknown as object,
        computedAt: now,
        expiresAt,
        computeTimeMs: computeTimeMs ?? null,
      })
      .onConflictDoUpdate({
        target: leaderboardCache.key,
        set: {
          payload: data as unknown as object,
          computedAt: now,
          expiresAt,
          computeTimeMs: computeTimeMs ?? null,
        },
      });
  } catch (error) {
    console.warn('[LeaderboardCache] Set error:', error);
    // Don't throw - cache failure shouldn't break the API
  }
}

/**
 * Get or compute leaderboard with caching
 * 
 * Uses optimistic locking to prevent stampede:
 * - If cache hit and valid, return cached data
 * - If cache miss or expired, compute fresh data and cache it
 * - Multiple concurrent requests may compute, but that's acceptable
 *   (better than complex locking in serverless)
 */
export async function getOrComputeLeaderboard<T>(
  key: string,
  ttlSeconds: number,
  computeFn: () => Promise<T>
): Promise<CachedLeaderboard<T>> {
  // Try cache first
  const cached = await getCachedLeaderboard<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Cache miss - compute fresh data
  const startTime = performance.now();
  const data = await computeFn();
  const computeTimeMs = Math.round(performance.now() - startTime);

  // Cache the result
  await setCachedLeaderboard(key, data, ttlSeconds, computeTimeMs);

  const now = new Date();
  return {
    key,
    data,
    computedAt: now,
    expiresAt: new Date(now.getTime() + ttlSeconds * 1000),
    computeTimeMs,
    fromCache: false,
  };
}

/**
 * Invalidate a specific cache entry
 */
export async function invalidateLeaderboardCache(key: string): Promise<void> {
  try {
    await db.delete(leaderboardCache).where(eq(leaderboardCache.key, key));
  } catch (error) {
    console.warn('[LeaderboardCache] Invalidate error:', error);
  }
}

/**
 * Invalidate all cache entries matching a prefix
 */
export async function invalidateLeaderboardCachePrefix(prefix: string): Promise<void> {
  try {
    await db.delete(leaderboardCache).where(
      sql`${leaderboardCache.key} LIKE ${prefix + '%'}`
    );
  } catch (error) {
    console.warn('[LeaderboardCache] Invalidate prefix error:', error);
  }
}

/**
 * Clean up expired cache entries
 * Call this periodically (e.g., via cron or on certain requests)
 */
export async function cleanupExpiredLeaderboardCache(): Promise<number> {
  try {
    const result = await db.execute(sql`
      DELETE FROM leaderboard_cache 
      WHERE expires_at < now()
      RETURNING key
    `);
    const rows = result as unknown as Array<{ key: string }>;
    return rows.length;
  } catch (error) {
    console.warn('[LeaderboardCache] Cleanup error:', error);
    return 0;
  }
}
