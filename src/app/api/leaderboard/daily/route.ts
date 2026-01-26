import { db, gameResults, users } from "@/db";
import { and, desc, eq, gte, isNotNull, lt, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

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

export async function GET(request: NextRequest) {
  try {
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

    const rows = await db
      .select({
        rank: sql<number>`ROW_NUMBER() OVER (ORDER BY ${gameResults.score} DESC)`,
        userId: gameResults.userId,
        score: gameResults.score,
        success: gameResults.success,
        attempts: gameResults.attempts,
        durationMs: gameResults.durationMs,
        playerName: users.name,
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

    const leaderboard = rows.map((r) => ({
      rank: Number(r.rank),
      playerName: r.playerName ?? "Anonymous",
      score: r.score,
      success: r.success,
      attempts: r.attempts,
      durationMs: r.durationMs,
    }));

    const response = NextResponse.json({ date: dayKey, game, leaderboard });
    response.headers.set("Cache-Control", "public, max-age=60, s-maxage=60, stale-while-revalidate=30");
    return response;
  } catch (error) {
    console.error("[leaderboard/daily]", error);
    return NextResponse.json({ error: "Failed to load leaderboard" }, { status: 500 });
  }
}
