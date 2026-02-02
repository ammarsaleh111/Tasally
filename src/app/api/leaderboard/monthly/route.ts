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

interface MonthlyLeaderboardEntry {
  rank: number;
  playerName: string;
  totalScore: number;
  gamesPlayed: number;
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
    const monthParam = searchParams.get("month");

    if (!VALID_GAMES.includes(game)) {
      return NextResponse.json({ error: "Invalid game key" }, { status: 400 });
    }

    const today = new Date();
    const monthKey = monthParam ?? today.toISOString().slice(0, 7);

    if (!/^\d{4}-\d{2}$/.test(monthKey)) {
      return NextResponse.json({ error: "Invalid month format (YYYY-MM)" }, { status: 400 });
    }

    // Check cache first (60 second TTL for monthly)
    const cacheKey = leaderboardCacheKey('monthly', game, monthKey);
    const cached = getCached<MonthlyLeaderboardEntry[]>(cacheKey);
    
    if (cached !== null) {
      logRequestMetrics({
        route: '/api/leaderboard/monthly',
        method: 'GET',
        statusCode: 200,
        durationMs: timer.elapsed(),
        dbQueryCount: 0, // Cache hit
        timestamp: new Date().toISOString(),
      });
      
      const response = NextResponse.json({ month: monthKey, game, leaderboard: cached, cached: true });
      response.headers.set("Cache-Control", "public, max-age=60, s-maxage=60, stale-while-revalidate=60");
      return response;
    }

    const rows = await db
      .select({
        rank: sql<number>`ROW_NUMBER() OVER (ORDER BY SUM(${gameResults.score}) DESC)`,
        userId: gameResults.userId,
        totalScore: sql<number>`SUM(${gameResults.score})`,
        gamesPlayed: sql<number>`COUNT(*)`,
        userDisplayName: users.displayName,
        userName: users.name,
      })
      .from(gameResults)
      .leftJoin(users, eq(gameResults.userId, users.id))
      .where(
        and(
          eq(gameResults.gameKey, game),
          eq(gameResults.monthKey, monthKey),
          isNotNull(gameResults.userId),
          eq(gameResults.mode, "daily")
        )
      )
      .groupBy(gameResults.userId, users.displayName, users.name)
      .orderBy(desc(sql`SUM(${gameResults.score})`))
      .limit(50);
    trackDbQuery();

    const leaderboard: MonthlyLeaderboardEntry[] = rows.map((r) => ({
      rank: Number(r.rank),
      playerName: r.userDisplayName ?? r.userName ?? "Player",
      totalScore: Number(r.totalScore),
      gamesPlayed: Number(r.gamesPlayed),
    }));
    
    // Cache the result
    setCache(cacheKey, leaderboard, CACHE_DURATIONS.LEADERBOARD_MONTHLY);

    logRequestMetrics({
      route: '/api/leaderboard/monthly',
      method: 'GET',
      statusCode: 200,
      durationMs: timer.elapsed(),
      dbQueryCount: 1,
      timestamp: new Date().toISOString(),
    });

    const response = NextResponse.json({ month: monthKey, game, leaderboard });
    response.headers.set("Cache-Control", "public, max-age=60, s-maxage=60, stale-while-revalidate=60");
    return response;
  } catch (error) {
    console.error("[leaderboard/monthly]", error);
    return NextResponse.json({ error: "Failed to load leaderboard" }, { status: 500 });
  }
}
