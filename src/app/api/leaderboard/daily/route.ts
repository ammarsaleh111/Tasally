import { db, gameResults, guestProfiles, users } from "@/db";
import { and, desc, eq, isNotNull, or, sql } from "drizzle-orm";
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

    // Query both authenticated users and guests
    const rows = await db
      .select({
        rank: sql<number>`ROW_NUMBER() OVER (ORDER BY ${gameResults.score} DESC)`,
        userId: gameResults.userId,
        guestId: gameResults.guestId,
        score: gameResults.score,
        success: gameResults.success,
        attempts: gameResults.attempts,
        durationMs: gameResults.durationMs,
        userDisplayName: users.displayName,
        guestName: guestProfiles.displayName,
        playedAt: gameResults.playedAt,
      })
      .from(gameResults)
      .leftJoin(users, eq(gameResults.userId, users.id))
      .leftJoin(guestProfiles, eq(gameResults.guestId, guestProfiles.id))
      .where(
        and(
          eq(gameResults.gameKey, game),
          eq(gameResults.dayKey, sql`${dayKey}::date`),
          or(isNotNull(gameResults.userId), isNotNull(gameResults.guestId)),
          eq(gameResults.mode, "daily")
        )
      )
      .orderBy(desc(gameResults.score))
      .limit(50);

    const leaderboard = rows.map((r) => ({
      rank: Number(r.rank),
      playerName: r.userDisplayName ?? r.guestName ?? "Guest",
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
