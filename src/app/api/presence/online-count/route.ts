/**
 * Online Count Endpoint
 * GET /api/presence/online-count
 * 
 * Returns count of users online in the last 2-3 minutes.
 * Heavily cached at edge (CDN) and in-memory.
 * 
 * Performance characteristics:
 * - Single COUNT(*) query with index
 * - Edge cache: 10s, stale-while-revalidate: 30s
 * - Target: <50ms response time
 */

import { NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";
import { createRequestTimer, logRequestMetrics, trackDbQuery } from "@/lib/observability";
import { getCached, setCache } from "@/lib/cache";

// Online window: users seen in last 2 minutes (with 1 min tolerance = 3 min)
const ONLINE_WINDOW_MINUTES = 2;
const CACHE_KEY = "presence:online-count";
const CACHE_TTL_SECONDS = 5; // In-memory cache TTL

interface OnlineCountResult {
  onlineCount: number;
  windowSeconds: number;
  computedAt: string;
}

export async function GET() {
  const timer = createRequestTimer();

  try {
    // Check in-memory cache first
    const cached = getCached<OnlineCountResult>(CACHE_KEY);
    if (cached !== null) {
      logRequestMetrics({
        route: "/api/presence/online-count",
        method: "GET",
        statusCode: 200,
        durationMs: timer.elapsed(),
        dbQueryCount: 0,
        timestamp: new Date().toISOString(),
      });

      const response = NextResponse.json({
        ...cached,
        cached: true,
      });
      // Edge cache headers for CDN
      response.headers.set(
        "Cache-Control",
        "public, max-age=5, s-maxage=10, stale-while-revalidate=30"
      );
      return response;
    }

    // Query count of online users using the index on last_seen_at
    const result = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM users
      WHERE last_seen_at > now() - interval '${sql.raw(String(ONLINE_WINDOW_MINUTES))} minutes'
    `);
    trackDbQuery();

    const rows = result as unknown as Array<{ count: string | number }>;
    const onlineCount = Number(rows[0]?.count ?? 0);

    const data: OnlineCountResult = {
      onlineCount,
      windowSeconds: ONLINE_WINDOW_MINUTES * 60,
      computedAt: new Date().toISOString(),
    };

    // Cache result
    setCache(CACHE_KEY, data, CACHE_TTL_SECONDS);

    logRequestMetrics({
      route: "/api/presence/online-count",
      method: "GET",
      statusCode: 200,
      durationMs: timer.elapsed(),
      dbQueryCount: 1,
      timestamp: new Date().toISOString(),
    });

    const response = NextResponse.json(data);
    // Edge cache headers for CDN
    response.headers.set(
      "Cache-Control",
      "public, max-age=5, s-maxage=10, stale-while-revalidate=30"
    );
    return response;
  } catch (error) {
    console.error("[presence/online-count] Error:", error);
    return NextResponse.json(
      { error: "Failed to get online count" },
      { status: 500 }
    );
  }
}
