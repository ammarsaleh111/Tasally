import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { validateAdminSession } from "@/lib/adminAuth";
import {
  accounts,
  gameEvents,
  gameResults,
  guestProfiles,
  presenceSessions,
  sessions,
  themeSettings,
  users,
  verificationTokens,
  db,
} from "@/db";
import { eq } from "drizzle-orm";
import { sanitizeString } from "@/utils/inputSanitizer";

export async function DELETE(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_session")?.value;
  const authenticated = await validateAdminSession(token);

  if (!authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const userId = sanitizeString(searchParams.get("userId"), 100);
  const guestId = sanitizeString(searchParams.get("guestId"), 100);

  if (!userId && !guestId) {
    return NextResponse.json({ error: "Missing userId or guestId" }, { status: 400 });
  }

  try {
    if (userId) {
      const [userRow] = await db
        .select({ email: users.email })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      await db.transaction(async (tx) => {
        await tx.delete(gameResults).where(eq(gameResults.userId, userId));
        await tx.delete(gameEvents).where(eq(gameEvents.userId, userId));
        await tx.delete(presenceSessions).where(eq(presenceSessions.userId, userId));
        await tx.delete(sessions).where(eq(sessions.userId, userId));
        await tx.delete(accounts).where(eq(accounts.userId, userId));
        if (userRow?.email) {
          await tx.delete(verificationTokens).where(eq(verificationTokens.identifier, userRow.email));
        }
        await tx
          .update(themeSettings)
          .set({ updatedByUserId: null })
          .where(eq(themeSettings.updatedByUserId, userId));
        await tx.delete(users).where(eq(users.id, userId));
      });
    }

    if (guestId) {
      await db.transaction(async (tx) => {
        await tx.delete(gameResults).where(eq(gameResults.guestId, guestId));
        await tx.delete(gameEvents).where(eq(gameEvents.guestId, guestId));
        await tx.delete(presenceSessions).where(eq(presenceSessions.guestId, guestId));
        await tx.delete(guestProfiles).where(eq(guestProfiles.id, guestId));
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[admin/users] failed to delete user", error);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
