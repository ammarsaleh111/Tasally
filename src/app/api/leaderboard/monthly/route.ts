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
    const monthParam = searchParams.get("month");

    if (!VALID_GAMES.includes(game)) {
      return NextResponse.json({ error: "Invalid game key" }, { status: 400 });
    }

    const today = new Date();
    const monthKey = monthParam ?? today.toISOString().slice(0, 7);

    if (!/^\d{4}-\d{2}$/.test(monthKey)) {
      return NextResponse.json({ error: "Invalid month format (YYYY-MM)" }, { status: 400 });
    }

    const rows = await db
      .select({
        rank: sql<number>`ROW_NUMBER() OVER (ORDER BY SUM(${gameResults.score}) DESC)`,
        userId: gameResults.userId,
        guestId: gameResults.guestId,
        totalScore: sql<number>`SUM(${gameResults.score})`,
        gamesPlayed: sql<number>`COUNT(*)`,
        userName: users.name,
        guestName: guestProfiles.displayName,
      })
      .from(gameResults)
      .leftJoin(users, eq(gameResults.userId, users.id))
      .leftJoin(guestProfiles, eq(gameResults.guestId, guestProfiles.id))
      .where(
        and(
          eq(gameResults.gameKey, game),
          eq(gameResults.monthKey, monthKey),
          or(isNotNull(gameResults.userId), isNotNull(gameResults.guestId)),
          eq(gameResults.mode, "daily")
        )
      )
      .groupBy(gameResults.userId, gameResults.guestId, users.name, guestProfiles.displayName)
      .orderBy(desc(sql`SUM(${gameResults.score})`))
      .limit(50);

    const leaderboard = rows.map((r) => ({
      rank: Number(r.rank),
      playerName: r.userName ?? r.guestName ?? "Guest",
      totalScore: Number(r.totalScore),
      gamesPlayed: Number(r.gamesPlayed),
    }));

    const response = NextResponse.json({ month: monthKey, game, leaderboard });
    response.headers.set("Cache-Control", "public, max-age=300, s-maxage=300, stale-while-revalidate=60");
    return response;
  } catch (error) {
    console.error("[leaderboard/monthly]", error);
    return NextResponse.json({ error: "Failed to load leaderboard" }, { status: 500 });
  }
}
