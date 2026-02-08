/**
 * POST /api/games/global/results
 *
 * Submit a game result for the GLOBAL leaderboard (unlimited mode).
 * Atomically inserts the result AND updates the aggregate totals
 * in a single transaction to keep the leaderboard consistent.
 *
 * Body: { gameKey, won, moves?, timeMs }
 *
 * CRITICAL: This is SEPARATE from group results.
 * Global results → global_game_results + global_player_totals
 * Group results → group_game_results + group_member_totals
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { sql } from "drizzle-orm";
import { ok, fail, handleApiError } from "@/server/http";
import { requireIdentity } from "@/lib/groups/identity";
import { computeGroupPoints, GROUP_GAME_KEYS } from "@/lib/groups/constants";
import {
  checkRateLimit,
  rateLimitResponse,
  buildRateLimitKey,
} from "@/lib/rateLimit";

const resultsSchema = z.object({
  gameKey: z.string(),
  won: z.boolean(),
  moves: z.number().int().min(0).nullable().optional(),
  timeMs: z.number().int().min(0),
});

// All games that support global unlimited mode
// NOTE: Crossword is excluded because it only has daily mode
const GLOBAL_GAME_KEYS = new Set([
  "wordle",
  "numbers",
  "trivia",
  "waffle",
  "combinations",
  "spelling",
  "connections",
  "strands",
]);

export async function POST(request: NextRequest) {
  try {
    const identity = await requireIdentity();

    // Rate limit: 10/min per identity
    const rl = await checkRateLimit(
      buildRateLimitKey("global:results", identity.id),
      10,
      60
    );
    if (!rl.allowed) {
      return rateLimitResponse(rl, "global:results", identity.id);
    }

    const body = await request.json();
    const parsed = resultsSchema.safeParse(body);
    if (!parsed.success) {
      return fail(422, "VALIDATION_ERROR", "Invalid input", {
        issues: parsed.error.flatten(),
      });
    }

    const { gameKey, won, moves, timeMs } = parsed.data;

    // Validate game key
    if (!GLOBAL_GAME_KEYS.has(gameKey)) {
      return fail(
        400,
        "INVALID_GAME",
        `Game "${gameKey}" is not available for global leaderboard`
      );
    }

    // Compute points (reuse same scoring as groups for consistency)
    const pointsAwarded = computeGroupPoints(
      gameKey,
      won,
      moves ?? null,
      timeMs
    );

    // Atomic transaction: insert result + update totals
    // Using raw SQL for a single round-trip to Neon
    const result = await db.execute(sql`
      WITH inserted AS (
        INSERT INTO global_game_results (identity_id, game_key, won, moves, time_ms, points_awarded)
        VALUES (${identity.id}, ${gameKey}, ${won}, ${moves ?? null}, ${timeMs}, ${pointsAwarded})
        RETURNING id, points_awarded, played_at
      )
      INSERT INTO global_player_totals (identity_id, total_points, total_time_ms, games_played, wins, updated_at)
      VALUES (
        ${identity.id},
        ${pointsAwarded},
        ${timeMs},
        1,
        ${won ? 1 : 0},
        now()
      )
      ON CONFLICT (identity_id) DO UPDATE SET
        total_points = global_player_totals.total_points + EXCLUDED.total_points,
        total_time_ms = global_player_totals.total_time_ms + EXCLUDED.total_time_ms,
        games_played = global_player_totals.games_played + 1,
        wins = global_player_totals.wins + EXCLUDED.wins,
        updated_at = now()
      RETURNING total_points, total_time_ms, games_played, wins
    `);

    const totals = (result as any[])[0];

    return ok({
      pointsAwarded,
      totals: {
        totalPoints: totals?.total_points ?? pointsAwarded,
        totalTimeMs: totals?.total_time_ms ?? timeMs,
        gamesPlayed: totals?.games_played ?? 1,
        wins: totals?.wins ?? (won ? 1 : 0),
      },
    });
  } catch (error: any) {
    if (error?.message === "IDENTITY_REQUIRED") {
      return fail(403, "IDENTITY_REQUIRED", "You must claim a display name first");
    }
    return handleApiError(error);
  }
}
