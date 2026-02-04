import { db, gameResults, users } from "@/db";
import { and, desc, eq, isNotNull, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { 
  buildLeaderboardCacheKey, 
  getOrComputeLeaderboard, 
  LEADERBOARD_CACHE_TTL 
} from "@/lib/leaderboardCache";
import { createRequestTimer, logRequestMetrics, trackDbQuery } from "@/lib/observability";
import { checkRateLimit, rateLimitResponse, buildRateLimitKey, RATE_LIMITS } from "@/lib/rateLimit";

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

    // Rate limiting for leaderboard endpoint
    const rateLimitKey = buildRateLimitKey("leaderboard:monthly", session.user.id);
    const rateResult = await checkRateLimit(
      rateLimitKey,
      RATE_LIMITS.LEADERBOARD.max,
      RATE_LIMITS.LEADERBOARD.windowSeconds
    );

    if (!rateResult.allowed) {
      logRequestMetrics({
        route: "/api/leaderboard/monthly",
        method: "GET",
        statusCode: 429,
        durationMs: timer.elapsed(),
        rateLimited: true,
        timestamp: new Date().toISOString(),
      });
      return rateLimitResponse(rateResult, "/api/leaderboard/monthly", session.user.id);
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

    // Use DB-level caching for leaderboard data
    const cacheKey = buildLeaderboardCacheKey('monthly', game, monthKey);
    
    const result = await getOrComputeLeaderboard<MonthlyLeaderboardEntry[]>(
      cacheKey,
      LEADERBOARD_CACHE_TTL.monthly,
      async () => {
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

        return rows.map((r) => ({
          rank: Number(r.rank),
          playerName: r.userDisplayName ?? r.userName ?? "Player",
          totalScore: Number(r.totalScore),
          gamesPlayed: Number(r.gamesPlayed),
        }));
      }
    );

    logRequestMetrics({
      route: '/api/leaderboard/monthly',
      method: 'GET',
      statusCode: 200,
      durationMs: timer.elapsed(),
      dbQueryCount: result.fromCache ? 1 : 2,
      timestamp: new Date().toISOString(),
    });

    const response = NextResponse.json({ 
      month: monthKey, 
      game, 
      leaderboard: result.data,
      cached: result.fromCache,
      computeTimeMs: result.computeTimeMs,
    });
    // Edge caching: cache at CDN for 30s, allow stale responses for 5 minutes
    response.headers.set("Cache-Control", "public, max-age=30, s-maxage=60, stale-while-revalidate=300");
    return response;
  } catch (error) {
    console.error("[leaderboard/monthly]", error);
    return NextResponse.json({ error: "Failed to load leaderboard" }, { status: 500 });
  }
}
