/**
 * POST /api/groups/[groupId]/results
 *
 * Submit a game result for a group (unlimited mode only).
 * Atomically inserts the result AND updates the aggregate totals
 * in a single transaction to keep the leaderboard consistent.
 *
 * Body: { gameKey, won, moves?, timeMs }
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { sql } from "drizzle-orm";
import { ok, fail, handleApiError } from "@/server/http";
import { requireIdentity, RESULT_IDENTITY_HEADER } from "@/lib/groups/identity";
import {
  GROUP_GAME_KEYS,
  computeGroupPoints,
} from "@/lib/groups/constants";
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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await params;
    const identity = await requireIdentity();
    const expectedIdentity = request.headers.get(RESULT_IDENTITY_HEADER);
    if (expectedIdentity !== null && expectedIdentity !== identity.id) {
      return fail(403, "IDENTITY_MISMATCH", "Result belongs to a different identity");
    }

    // Rate limit: 10/min per identity per group
    const rl = await checkRateLimit(
      buildRateLimitKey(`groups:results:${groupId}`, identity.id),
      10,
      60
    );
    if (!rl.allowed) {
      return rateLimitResponse(rl, "groups:results", identity.id);
    }

    const body = await request.json();
    const parsed = resultsSchema.safeParse(body);
    if (!parsed.success) {
      return fail(422, "VALIDATION_ERROR", "Invalid input", {
        issues: parsed.error.flatten(),
      });
    }

    const { gameKey, won, moves, timeMs } = parsed.data;

    // Validate game key is in allowed list
    if (!GROUP_GAME_KEYS.has(gameKey)) {
      return fail(
        400,
        "INVALID_GAME",
        `Game "${gameKey}" is not available in groups`
      );
    }

    // Verify active membership (single query)
    const memberCheck = await db.execute(sql`
      SELECT 1 FROM group_members
      WHERE group_id = ${groupId}
        AND identity_id = ${identity.id}
        AND status = 'active'
      LIMIT 1
    `);

    if ((memberCheck as any[]).length === 0) {
      return fail(
        403,
        "NOT_A_MEMBER",
        "You are not an active member of this group"
      );
    }

    // Compute points
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
        INSERT INTO group_game_results (group_id, identity_id, game_key, mode, won, moves, time_ms, points_awarded)
        VALUES (${groupId}, ${identity.id}, ${gameKey}, 'unlimited', ${won}, ${moves ?? null}, ${timeMs}, ${pointsAwarded})
        RETURNING id, points_awarded, played_at
      )
      INSERT INTO group_member_totals (group_id, identity_id, total_points, total_time_ms, games_played, wins, updated_at)
      VALUES (
        ${groupId},
        ${identity.id},
        ${pointsAwarded},
        ${timeMs},
        1,
        ${won ? 1 : 0},
        now()
      )
      ON CONFLICT (group_id, identity_id) DO UPDATE SET
        total_points = group_member_totals.total_points + EXCLUDED.total_points,
        total_time_ms = group_member_totals.total_time_ms + EXCLUDED.total_time_ms,
        games_played = group_member_totals.games_played + 1,
        wins = group_member_totals.wins + EXCLUDED.wins,
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
