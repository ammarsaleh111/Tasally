import { db, gameResults, users } from "@/db";
import { and, desc, eq, isNotNull, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { 
  buildLeaderboardCacheKey, 
  getOrComputeLeaderboard, 
  LEADERBOARD_CACHE_TTL,
  cleanupExpiredLeaderboardCache 
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

    // Rate limiting for leaderboard endpoint
    const rateLimitKey = buildRateLimitKey("leaderboard:daily", session.user.id);
    const rateResult = await checkRateLimit(
      rateLimitKey,
      RATE_LIMITS.LEADERBOARD.max,
      RATE_LIMITS.LEADERBOARD.windowSeconds
    );

    if (!rateResult.allowed) {
      logRequestMetrics({
        route: "/api/leaderboard/daily",
        method: "GET",
        statusCode: 429,
        durationMs: timer.elapsed(),
        rateLimited: true,
        timestamp: new Date().toISOString(),
      });
      return rateLimitResponse(rateResult, "/api/leaderboard/daily", session.user.id);
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
    
    // Use DB-level caching for leaderboard data
    const cacheKey = buildLeaderboardCacheKey('daily', game, dayKey);
    
    const result = await getOrComputeLeaderboard<LeaderboardEntry[]>(
      cacheKey,
      LEADERBOARD_CACHE_TTL.daily,
      async () => {
        // Compute leaderboard data
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

        return rows.map((r) => ({
          rank: Number(r.rank),
          playerName: r.userDisplayName ?? r.userName ?? "Player",
          score: r.score,
          success: r.success,
          attempts: r.attempts,
          durationMs: r.durationMs,
        }));
      }
    );

    // Occasionally clean up expired cache entries (1% of requests)
    if (Math.random() < 0.01) {
      cleanupExpiredLeaderboardCache().catch(() => {});
    }

    logRequestMetrics({
      route: '/api/leaderboard/daily',
      method: 'GET',
      statusCode: 200,
      durationMs: timer.elapsed(),
      dbQueryCount: result.fromCache ? 1 : 2, // Cache read + optional compute
      timestamp: new Date().toISOString(),
    });

    const response = NextResponse.json({ 
      date: dayKey, 
      game, 
      leaderboard: result.data,
      cached: result.fromCache,
      computeTimeMs: result.computeTimeMs,
    });
    // Edge caching: cache at CDN for 10s, allow stale responses for 5 minutes
    response.headers.set("Cache-Control", "public, max-age=10, s-maxage=30, stale-while-revalidate=300");
    return response;
  } catch (error) {
    console.error("[leaderboard/daily]", error);
    return NextResponse.json({ error: "Failed to load leaderboard" }, { status: 500 });
  }
}
