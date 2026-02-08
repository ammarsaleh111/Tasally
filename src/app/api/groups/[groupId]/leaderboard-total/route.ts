/**
 * GET /api/groups/[groupId]/leaderboard-total?limit=50
 *
 * Group Total Leaderboard — reads from the pre-aggregated
 * group_member_totals table joined with identities for display names.
 *
 * ORDER BY: total_points DESC, total_time_ms ASC, wins DESC
 *
 * Caching strategy:
 *   - HTTP: Cache-Control private + s-maxage=30 + stale-while-revalidate
 *   - In-memory: 15s TTL per group (lightweight, works within same serverless instance)
 */

import { NextRequest } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";
import { ok, fail, handleApiError } from "@/server/http";
import {
  checkRateLimit,
  rateLimitResponse,
  getClientIP,
  buildRateLimitKey,
} from "@/lib/rateLimit";

// Simple in-memory cache for leaderboard data (per serverless instance)
const leaderboardMemCache = new Map<
  string,
  { data: any[]; ts: number }
>();
const MEM_CACHE_TTL_MS = 15_000; // 15 seconds

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await params;

    // Rate limit: 30/min per IP
    const ip = getClientIP(request);
    const rl = await checkRateLimit(
      buildRateLimitKey("groups:leaderboard", ip),
      30,
      60
    );
    if (!rl.allowed) {
      return rateLimitResponse(rl, "groups:leaderboard", ip);
    }

    const limitParam = request.nextUrl.searchParams.get("limit");
    const limit = Math.min(100, Math.max(1, Number(limitParam) || 50));

    // Check in-memory cache first
    const cacheKey = `${groupId}:${limit}`;
    const cached = leaderboardMemCache.get(cacheKey);
    if (cached && Date.now() - cached.ts < MEM_CACHE_TTL_MS) {
      const response = ok({ leaderboard: cached.data, cached: true });
      setCacheHeaders(response);
      return response;
    }

    // Query: pre-aggregated table + join for display name
    // Uses the covering index (group_id, total_points DESC, total_time_ms ASC, wins DESC)
    const rows = await db.execute(sql`
      SELECT
        t.identity_id,
        t.total_points,
        t.total_time_ms,
        t.games_played,
        t.wins,
        i.display_name
      FROM group_member_totals t
      JOIN identities i ON i.id = t.identity_id
      WHERE t.group_id = ${groupId}
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
    leaderboardMemCache.set(cacheKey, { data: leaderboard, ts: Date.now() });

    // Evict stale entries periodically (keep cache small)
    if (leaderboardMemCache.size > 200) {
      const now = Date.now();
      for (const [k, v] of leaderboardMemCache) {
        if (now - v.ts > MEM_CACHE_TTL_MS * 4) {
          leaderboardMemCache.delete(k);
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
  response.headers.set(
    "Cache-Control",
    "private, max-age=5, s-maxage=30, stale-while-revalidate=120"
  );
}
