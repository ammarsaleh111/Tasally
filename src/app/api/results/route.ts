import { db, gameEvents, gameResults, guestProfiles } from "@/db";
import { auth } from "@/lib/auth";
import { computeScore, ScoreInput } from "@/server/scoring";
import { and, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { MAX_INPUT_LENGTHS, sanitizeName } from "@/utils/inputSanitizer";
import { checkRateLimit, rateLimitResponse, buildRateLimitKey, RATE_LIMITS } from "@/lib/rateLimit";
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
] as const;

const VALID_MODES = ["daily", "practice", "unlimited"] as const;

const ResultSchema = z.object({
  gameKey: z.enum(VALID_GAMES),
  mode: z.enum(VALID_MODES),
  success: z.boolean(),
  attempts: z.number().int().nonnegative().optional(),
  durationMs: z.number().int().nonnegative().optional(),
  metadata: z.record(z.unknown()).optional(),
  guestId: z.string().uuid().optional(),
  displayName: z.string().max(MAX_INPUT_LENGTHS.NAME).optional(),
  idempotencyKey: z.string().max(64).optional(), // For replay protection
});

export async function POST(request: Request) {
  const timer = createRequestTimer();
  
  try {
    const session = await auth();
    const payload = await request.json();
    const parsed = ResultSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
    }

    const { gameKey, mode, success, attempts, durationMs, metadata, guestId, displayName, idempotencyKey } = parsed.data;
    
    // Rate limiting: 10/min per user/guest
    const identifier = session?.user?.id || guestId || 'anonymous';
    const rateLimitKey = buildRateLimitKey('results', identifier);
    const rateResult = await checkRateLimit(
      rateLimitKey,
      RATE_LIMITS.RESULTS.max,
      RATE_LIMITS.RESULTS.windowSeconds
    );

    if (!rateResult.allowed) {
      logRequestMetrics({
        route: '/api/results',
        method: 'POST',
        statusCode: 429,
        durationMs: timer.elapsed(),
        rateLimited: true,
        timestamp: new Date().toISOString(),
      });
      return rateLimitResponse(rateResult, '/api/results', identifier);
    }

    const safeDisplayName = displayName ? sanitizeName(displayName) : null;

    if (displayName && !safeDisplayName) {
      return NextResponse.json({ error: "Invalid display name" }, { status: 400 });
    }

    let userId: string | null = session?.user?.id ?? null;
    let resolvedGuestId: string | null = null;

    if (!userId) {
      if (!guestId) {
        return NextResponse.json({ error: "Guest ID required for unauthenticated submissions" }, { status: 400 });
      }

      let guest = await db.query.guestProfiles.findFirst({
        where: eq(guestProfiles.id, guestId),
      });
      trackDbQuery();

      if (!guest) {
        const [created] = await db
          .insert(guestProfiles)
          .values({ id: guestId, displayName: safeDisplayName ?? null, createdAt: new Date(), lastSeenAt: new Date() })
          .returning();
        guest = created;
        trackDbQuery();
      } else {
        // Update display name if provided and different
        const updates: { lastSeenAt: Date; displayName?: string } = { lastSeenAt: new Date() };
        if (safeDisplayName && safeDisplayName !== guest.displayName) {
          updates.displayName = safeDisplayName;
        }
        await db.update(guestProfiles).set(updates).where(eq(guestProfiles.id, guestId));
        trackDbQuery();
      }

      resolvedGuestId = guest.id;
    }

    const input: ScoreInput = {
      gameKey,
      mode,
      success,
      attempts: attempts ?? null,
      durationMs: durationMs ?? null,
      metadata: metadata ?? {},
    };

    const result = computeScore(input);

    const now = new Date();
    const dayKey = now.toISOString().slice(0, 10);
    const monthKey = now.toISOString().slice(0, 7);

    // Use upsert for daily mode to handle duplicate constraint gracefully
    let inserted;
    try {
      if (mode === 'daily') {
        // Check for existing daily submission first
        const existing = await db.query.gameResults.findFirst({
          where: and(
            userId ? eq(gameResults.userId, userId) : eq(gameResults.guestId, resolvedGuestId!),
            eq(gameResults.gameKey, gameKey),
            eq(gameResults.dayKey, sql`${dayKey}::date`),
            eq(gameResults.mode, 'daily')
          ),
        });
        trackDbQuery();

        if (existing) {
          // Already submitted today
          logRequestMetrics({
            route: '/api/results',
            method: 'POST',
            statusCode: 409,
            durationMs: timer.elapsed(),
            timestamp: new Date().toISOString(),
          });
          return NextResponse.json({ 
            error: "Already submitted today",
            existingId: existing.id,
            existingScore: existing.score,
          }, { status: 409 });
        }
      }

      // Idempotency check if key provided
      if (idempotencyKey) {
        const existingByKey = await db.query.gameResults.findFirst({
          where: eq(gameResults.idempotencyKey, idempotencyKey),
        });
        trackDbQuery();

        if (existingByKey) {
          // Return existing result (idempotent)
          return NextResponse.json({
            id: existingByKey.id,
            score: existingByKey.score,
            idempotent: true,
          });
        }
      }

      [inserted] = await db
        .insert(gameResults)
        .values({
          userId,
          guestId: resolvedGuestId,
          gameKey,
          mode,
          score: result.score,
          durationMs: result.durationMs ?? null,
          attempts: result.attempts ?? null,
          success: result.success,
          playedAt: now,
          dayKey: sql`${dayKey}::date`,
          monthKey,
          metadata: result.metadata ?? {},
          idempotencyKey: idempotencyKey ?? null,
        })
        .returning({ id: gameResults.id, score: gameResults.score });
      trackDbQuery();
    } catch (dbError: any) {
      // Handle unique constraint violation gracefully
      if (dbError?.code === '23505') {
        return NextResponse.json({ error: "Duplicate submission" }, { status: 409 });
      }
      throw dbError;
    }

    // Append event log for analytics (WIN / LOSE)
    try {
      await db.insert(gameEvents).values({
        userId,
        guestId: resolvedGuestId,
        gameKey,
        type: success ? "WIN" : "LOSE",
        score: result.score,
        durationMs: result.durationMs ?? null,
        createdAt: now,
      });
      trackDbQuery();
    } catch (error) {
      console.warn("[results] failed to append game event", error);
    }

    logRequestMetrics({
      route: '/api/results',
      method: 'POST',
      statusCode: 200,
      durationMs: timer.elapsed(),
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      id: inserted.id,
      score: inserted.score,
    });
  } catch (error) {
    console.error("[results]", error);
    return NextResponse.json({ error: "Failed to save result" }, { status: 500 });
  }
}
