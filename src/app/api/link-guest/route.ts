import { db, gameEvents, guestProfiles, gameResults } from "@/db";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit, rateLimitResponse, buildRateLimitKey, RATE_LIMITS } from "@/lib/rateLimit";
import { createRequestTimer, logRequestMetrics, trackDbQuery } from "@/lib/observability";

const LinkGuestSchema = z.object({
  guestId: z.string().uuid(),
});

export async function POST(request: Request) {
  const timer = createRequestTimer();
  
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Rate limiting: 5/day per user
    const rateLimitKey = buildRateLimitKey('link-guest', userId);
    const rateResult = await checkRateLimit(
      rateLimitKey,
      RATE_LIMITS.LINK_GUEST.max,
      RATE_LIMITS.LINK_GUEST.windowSeconds
    );

    if (!rateResult.allowed) {
      logRequestMetrics({
        route: '/api/link-guest',
        method: 'POST',
        statusCode: 429,
        durationMs: timer.elapsed(),
        rateLimited: true,
        timestamp: new Date().toISOString(),
      });
      return rateLimitResponse(rateResult, '/api/link-guest', userId);
    }

    const payload = await request.json();
    const parsed = LinkGuestSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid guest ID" }, { status: 400 });
    }

    const { guestId } = parsed.data;

    const guest = await db.query.guestProfiles.findFirst({
      where: eq(guestProfiles.id, guestId),
    });
    trackDbQuery();

    if (!guest) {
      return NextResponse.json({ error: "Guest profile not found" }, { status: 404 });
    }

    await db
      .update(gameResults)
      .set({ userId, guestId: null })
      .where(eq(gameResults.guestId, guestId));
    trackDbQuery();

    await db
      .update(gameEvents)
      .set({ userId, guestId: null })
      .where(eq(gameEvents.guestId, guestId));
    trackDbQuery();

    await db.delete(guestProfiles).where(eq(guestProfiles.id, guestId));
    trackDbQuery();

    logRequestMetrics({
      route: '/api/link-guest',
      method: 'POST',
      statusCode: 200,
      durationMs: timer.elapsed(),
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ linked: true });
  } catch (error) {
    console.error("[link-guest]", error);
    return NextResponse.json({ error: "Failed to link guest" }, { status: 500 });
  }
}
