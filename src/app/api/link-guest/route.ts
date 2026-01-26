import { db, guestProfiles, gameResults } from "@/db";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

const LinkGuestSchema = z.object({
  guestId: z.string().uuid(),
});

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const payload = await request.json();
    const parsed = LinkGuestSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid guest ID" }, { status: 400 });
    }

    const { guestId } = parsed.data;

    const guest = await db.query.guestProfiles.findFirst({
      where: eq(guestProfiles.id, guestId),
    });

    if (!guest) {
      return NextResponse.json({ error: "Guest profile not found" }, { status: 404 });
    }

    await db
      .update(gameResults)
      .set({ userId, guestId: null })
      .where(eq(gameResults.guestId, guestId));

    await db.delete(guestProfiles).where(eq(guestProfiles.id, guestId));

    return NextResponse.json({ linked: true });
  } catch (error) {
    console.error("[link-guest]", error);
    return NextResponse.json({ error: "Failed to link guest" }, { status: 500 });
  }
}
