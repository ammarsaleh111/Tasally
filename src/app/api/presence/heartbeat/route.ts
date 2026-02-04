/**
 * Presence Heartbeat Endpoint
 * POST /api/presence/heartbeat
 * 
 * Lightweight endpoint for presence tracking.
 * Updates user's last_seen_at with server-side throttling.
 * 
 * Performance characteristics:
 * - Single UPDATE query (no SELECT first)
 * - Server-side throttle: skip DB write if last_seen_at within 30s
 * - Rate limit: 2/min per user
 * - Target: <10ms response time
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, users } from "@/db";
import { eq, sql } from "drizzle-orm";
import { checkRateLimit, rateLimitResponse, buildRateLimitKey, RATE_LIMITS } from "@/lib/rateLimit";
import { createRequestTimer, logRequestMetrics, trackDbQuery } from "@/lib/observability";

// Server-side throttle: only write if last heartbeat > 30 seconds ago
const THROTTLE_SECONDS = 30;

export async function POST() {
  const timer = createRequestTimer();

  try {
    // Auth required
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Rate limiting: 2 requests per minute (client should call every 60-120s)
    const rateLimitKey = buildRateLimitKey("presence:heartbeat", userId);
    const rateResult = await checkRateLimit(
      rateLimitKey,
      RATE_LIMITS.PRESENCE_HEARTBEAT?.max ?? 2,
      RATE_LIMITS.PRESENCE_HEARTBEAT?.windowSeconds ?? 60
    );

    if (!rateResult.allowed) {
      logRequestMetrics({
        route: "/api/presence/heartbeat",
        method: "POST",
        statusCode: 429,
        durationMs: timer.elapsed(),
        rateLimited: true,
        timestamp: new Date().toISOString(),
      });
      return rateLimitResponse(rateResult, "/api/presence/heartbeat", userId);
    }

    // Atomic update with server-side throttling:
    // Only update if last_seen_at is NULL or older than THROTTLE_SECONDS
    const result = await db.execute(sql`
      UPDATE users 
      SET last_seen_at = now(), updated_at = now()
      WHERE id = ${userId}
        AND (last_seen_at IS NULL OR last_seen_at < now() - interval '${sql.raw(String(THROTTLE_SECONDS))} seconds')
      RETURNING id
    `);
    trackDbQuery();

    // result is array of rows - if empty, we throttled
    const rows = result as unknown as Array<{ id: string }>;
    const updated = rows.length > 0;

    logRequestMetrics({
      route: "/api/presence/heartbeat",
      method: "POST",
      statusCode: 200,
      durationMs: timer.elapsed(),
      dbQueryCount: 1,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      ok: true,
      updated,
      serverTime: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[presence/heartbeat] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Handle preflight for CORS if needed
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
