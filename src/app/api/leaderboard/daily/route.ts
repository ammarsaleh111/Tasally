import { db, gameResults, users } from "@/db";
import { and, desc, eq, isNotNull, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getCached, setCache, leaderboardCacheKey, CACHE_DURATIONS } from "@/lib/cache";
import { createRequestTimer, logRequestMetrics, trackDbQuery } from "@/lib/observability";

const VALID_GAMES = [
  "wordle",
  "connections",
  "crossword",
  "numbers",
  "trivia",
  "strands",
  "spelling",
  "waffle",
  "combinations",
];

interface LeaderboardEntry {
  rank: number;
  playerName: string;
  score: number | null;
  success: boolean;
  attempts: number | null;
  durationMs: number | null;
}

export async function GET(request: NextRequest) {
  const timer = createRequestTimer();
  
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const game = searchParams.get("game") ?? "wordle";
    const dateParam = searchParams.get("date");

    if (!VALID_GAMES.includes(game)) {
      return NextResponse.json({ error: "Invalid game key" }, { status: 400 });
    }

    const today = new Date();
    const parsedDate = dateParam ? new Date(dateParam) : today;
    if (isNaN(parsedDate.getTime())) {
      return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    }

    const dayKey = parsedDate.toISOString().slice(0, 10);
    
    // Check cache first (30 second TTL)
    const cacheKey = leaderboardCacheKey('daily', game, dayKey);
    const cached = getCached<LeaderboardEntry[]>(cacheKey);
    
    if (cached !== null) {
      logRequestMetrics({
        route: '/api/leaderboard/daily',
        method: 'GET',
        statusCode: 200,
        durationMs: timer.elapsed(),
        dbQueryCount: 0, // Cache hit
        timestamp: new Date().toISOString(),
      });
      
      const response = NextResponse.json({ date: dayKey, game, leaderboard: cached, cached: true });
      response.headers.set("Cache-Control", "public, max-age=30, s-maxage=30, stale-while-revalidate=30");
      return response;
    }

    // Only authenticated users appear on the leaderboard
    const rows = await db
      .select({
        rank: sql<number>`ROW_NUMBER() OVER (ORDER BY ${gameResults.score} DESC)`,
        userId: gameResults.userId,
        score: gameResults.score,
        success: gameResults.success,
        attempts: gameResults.attempts,
        durationMs: gameResults.durationMs,
        userDisplayName: users.displayName,
        userName: users.name,
        playedAt: gameResults.playedAt,
      })
      .from(gameResults)
      .leftJoin(users, eq(gameResults.userId, users.id))
      .where(
        and(
          eq(gameResults.gameKey, game),
          eq(gameResults.dayKey, sql`${dayKey}::date`),
          isNotNull(gameResults.userId),
          eq(gameResults.mode, "daily")
        )
      )
      .orderBy(desc(gameResults.score))
      .limit(50);
    trackDbQuery();

    const leaderboard: LeaderboardEntry[] = rows.map((r) => ({
      rank: Number(r.rank),
      playerName: r.userDisplayName ?? r.userName ?? "Player",
      score: r.score,
      success: r.success,
      attempts: r.attempts,
      durationMs: r.durationMs,
    }));
    
    // Cache the result
    setCache(cacheKey, leaderboard, CACHE_DURATIONS.LEADERBOARD_DAILY);

    logRequestMetrics({
      route: '/api/leaderboard/daily',
      method: 'GET',
      statusCode: 200,
      durationMs: timer.elapsed(),
      dbQueryCount: 1,
      timestamp: new Date().toISOString(),
    });

    const response = NextResponse.json({ date: dayKey, game, leaderboard });
    response.headers.set("Cache-Control", "public, max-age=30, s-maxage=30, stale-while-revalidate=30");
    return response;
  } catch (error) {
    console.error("[leaderboard/daily]", error);
    return NextResponse.json({ error: "Failed to load leaderboard" }, { status: 500 });
  }
}
