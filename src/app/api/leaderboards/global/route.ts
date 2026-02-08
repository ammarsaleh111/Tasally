/**
 * GET /api/leaderboards/global?limit=50
 *
 * Global Total Leaderboard — reads from the pre-aggregated
 * global_player_totals table joined with identities for display names.
 *
 * ORDER BY: total_points DESC, total_time_ms ASC, wins DESC
 *
 * CRITICAL: This is SEPARATE from group leaderboards.
 * Global leaderboard → global_player_totals
 * Group leaderboard → group_member_totals
 *
 * Caching strategy (optimized for 10s client polling):
 *   - HTTP: Cache-Control s-maxage=10 + stale-while-revalidate=20
 *   - In-memory: 10s TTL (lightweight, works within same serverless instance)
 */

import { NextRequest } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";
import { ok, handleApiError } from "@/server/http";
import {
  checkRateLimit,
  rateLimitResponse,
  getClientIP,
  buildRateLimitKey,
} from "@/lib/rateLimit";

// Simple in-memory cache for leaderboard data (per serverless instance)
const globalLeaderboardCache = new Map<
  string,
  { data: any[]; ts: number }
>();
const MEM_CACHE_TTL_MS = 10_000; // 10 seconds (matches client polling interval)

export async function GET(request: NextRequest) {
  try {
    // Rate limit: 60/min per IP (supports 10s polling = 6/min per client)
    const ip = getClientIP(request);
    const rl = await checkRateLimit(
      buildRateLimitKey("global:leaderboard", ip),
      60,
      60
    );
    if (!rl.allowed) {
      return rateLimitResponse(rl, "global:leaderboard", ip);
    }

    const limitParam = request.nextUrl.searchParams.get("limit");
    const limit = Math.min(100, Math.max(1, Number(limitParam) || 50));

    // Check in-memory cache first
    const cacheKey = `global:${limit}`;
    const cached = globalLeaderboardCache.get(cacheKey);
    if (cached && Date.now() - cached.ts < MEM_CACHE_TTL_MS) {
      const response = ok({ leaderboard: cached.data, cached: true });
      setCacheHeaders(response);
      return response;
    }

    // Query: pre-aggregated table + join for display name
    // Uses the covering index (total_points DESC, total_time_ms ASC, wins DESC)
    const rows = await db.execute(sql`
      SELECT
        t.identity_id,
        t.total_points,
        t.total_time_ms,
        t.games_played,
        t.wins,
        i.display_name
      FROM global_player_totals t
      JOIN identities i ON i.id = t.identity_id
      ORDER BY t.total_points DESC, t.total_time_ms ASC, t.wins DESC
      LIMIT ${limit}
    `);

    const leaderboard = (rows as any[]).map((r, idx) => ({
      rank: idx + 1,
      identityId: r.identity_id,
      displayName: r.display_name,
      totalPoints: Number(r.total_points),
      totalTimeMs: Number(r.total_time_ms),
      gamesPlayed: r.games_played,
      wins: r.wins,
    }));

    // Update in-memory cache
    globalLeaderboardCache.set(cacheKey, { data: leaderboard, ts: Date.now() });

    // Evict stale entries periodically (keep cache small)
    if (globalLeaderboardCache.size > 50) {
      const now = Date.now();
      for (const [k, v] of globalLeaderboardCache) {
        if (now - v.ts > MEM_CACHE_TTL_MS * 4) {
          globalLeaderboardCache.delete(k);
        }
      }
    }

    const response = ok({ leaderboard, cached: false });
    setCacheHeaders(response);
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}

function setCacheHeaders(response: Response) {
  // Optimized for 10-second client polling
  response.headers.set(
    "Cache-Control",
    "private, max-age=0, s-maxage=10, stale-while-revalidate=20"
  );
}
