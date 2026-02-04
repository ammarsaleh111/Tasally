/**
 * Admin Online Users Endpoint
 * GET /api/admin/online-users?limit=50
 * 
 * Returns list of currently online users with minimal info.
 * Admin-only endpoint, no caching for accuracy.
 * 
 * Response:
 * - userId, username, displayName, lastSeenAt
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { validateAdminSession } from "@/lib/adminAuth";
import { db, users } from "@/db";
import { desc, gte, sql } from "drizzle-orm";
import { createRequestTimer, logRequestMetrics, trackDbQuery } from "@/lib/observability";

// Online window: users seen in last 3 minutes (with tolerance for missed heartbeats)
const ONLINE_WINDOW_MINUTES = 3;
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

interface OnlineUser {
  userId: string;
  username: string | null;
  displayName: string | null;
  lastSeenAt: string;
  ageSeconds: number;
}

export async function GET(request: NextRequest) {
  const timer = createRequestTimer();

  // Admin authentication
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_session")?.value;
  const authenticated = await validateAdminSession(token);

  if (!authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Parse limit from query params
    const { searchParams } = request.nextUrl;
    const limitParam = searchParams.get("limit");
    const limit = Math.min(
      Math.max(1, parseInt(limitParam ?? String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT),
      MAX_LIMIT
    );

    const now = new Date();
    const cutoff = new Date(now.getTime() - ONLINE_WINDOW_MINUTES * 60 * 1000);

    // Single efficient query with index on last_seen_at
    const rows = await db
      .select({
        id: users.id,
        name: users.name,
        displayName: users.displayName,
        lastSeenAt: users.lastSeenAt,
      })
      .from(users)
      .where(gte(users.lastSeenAt, cutoff))
      .orderBy(desc(users.lastSeenAt))
      .limit(limit);
    trackDbQuery();

    const onlineUsers: OnlineUser[] = rows.map((row) => ({
      userId: row.id,
      username: row.name,
      displayName: row.displayName,
      lastSeenAt: row.lastSeenAt?.toISOString() ?? "",
      ageSeconds: row.lastSeenAt
        ? Math.round((now.getTime() - row.lastSeenAt.getTime()) / 1000)
        : 0,
    }));

    logRequestMetrics({
      route: "/api/admin/online-users",
      method: "GET",
      statusCode: 200,
      durationMs: timer.elapsed(),
      dbQueryCount: 1,
      timestamp: new Date().toISOString(),
    });

    const response = NextResponse.json({
      onlineUsers,
      totalOnline: onlineUsers.length,
      windowMinutes: ONLINE_WINDOW_MINUTES,
      lastUpdated: now.toISOString(),
    });
    // No cache for admin endpoint - always fresh
    response.headers.set("Cache-Control", "no-store, max-age=0");
    return response;
  } catch (error) {
    console.error("[admin/online-users] Error:", error);
    return NextResponse.json(
      { error: "Failed to get online users" },
      { status: 500 }
    );
  }
}
