import { db, gameResults, guestProfiles } from "@/db";
import { auth } from "@/lib/auth";
import { computeScore, ScoreInput } from "@/server/scoring";
import { eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

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
  displayName: z.string().max(50).optional(),
});

export async function POST(request: Request) {
  try {
    const session = await auth();
    const payload = await request.json();
    const parsed = ResultSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
    }

    const { gameKey, mode, success, attempts, durationMs, metadata, guestId, displayName } = parsed.data;

    let userId: string | null = session?.user?.id ?? null;
    let resolvedGuestId: string | null = null;

    if (!userId) {
      if (!guestId) {
        return NextResponse.json({ error: "Guest ID required for unauthenticated submissions" }, { status: 400 });
      }

      let guest = await db.query.guestProfiles.findFirst({
        where: eq(guestProfiles.id, guestId),
      });

      if (!guest) {
        const [created] = await db
          .insert(guestProfiles)
          .values({ id: guestId, displayName: displayName ?? null, createdAt: new Date(), lastSeenAt: new Date() })
          .returning();
        guest = created;
      } else {
        // Update display name if provided and different
        const updates: { lastSeenAt: Date; displayName?: string } = { lastSeenAt: new Date() };
        if (displayName && displayName !== guest.displayName) {
          updates.displayName = displayName;
        }
        await db.update(guestProfiles).set(updates).where(eq(guestProfiles.id, guestId));
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

    const [inserted] = await db
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
      })
      .returning({ id: gameResults.id, score: gameResults.score });

    return NextResponse.json({
      id: inserted.id,
      score: inserted.score,
    });
  } catch (error) {
    console.error("[results]", error);
    return NextResponse.json({ error: "Failed to save result" }, { status: 500 });
  }
}
