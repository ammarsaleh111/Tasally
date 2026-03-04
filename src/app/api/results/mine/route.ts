import { db, gameResults } from "@/db";
import { auth } from "@/lib/auth";
import { and, eq, gte, desc, sql } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

/**
 * GET /api/results/mine
 * ─────────────────────────────────────────────────────────
 * Returns the authenticated user's game results since a
 * given timestamp. Used by the sync reconciler to pull
 * results recorded on other devices.
 *
 * Query params:
 *   since — ISO timestamp (required)
 *   limit — max rows (default 100, max 500)
 *
 * Response:
 *   { results: [ { gameKey, dayKey, success, attempts, durationMs, score, metadata, playedAt } ] }
 * ─────────────────────────────────────────────────────────
 */

const QuerySchema = z.object({
  since: z.string().datetime({ offset: true }).or(z.string().datetime()),
  limit: z.coerce.number().int().min(1).max(500).default(100),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const parsed = QuerySchema.safeParse({
      since: searchParams.get("since"),
      limit: searchParams.get("limit") ?? 100,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query params", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { since, limit } = parsed.data;
    const sinceDate = new Date(since);

    const results = await db
      .select({
        gameKey: gameResults.gameKey,
        dayKey: gameResults.dayKey,
        success: gameResults.success,
        attempts: gameResults.attempts,
        durationMs: gameResults.durationMs,
        score: gameResults.score,
        metadata: gameResults.metadata,
        playedAt: gameResults.playedAt,
      })
      .from(gameResults)
      .where(
        and(
          eq(gameResults.userId, session.user.id),
          gte(gameResults.playedAt, sinceDate)
        )
      )
      .orderBy(desc(gameResults.playedAt))
      .limit(limit);

    return NextResponse.json({ results });
  } catch (error) {
    console.error("[results/mine]", error);
    return NextResponse.json(
      { error: "Failed to fetch results" },
      { status: 500 }
    );
  }
}
