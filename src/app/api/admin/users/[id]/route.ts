import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { validateAdminSession } from "@/lib/adminAuth";
import {
  accounts,
  gameEvents,
  gameResults,
  presenceSessions,
  sessions,
  themeSettings,
  users,
  verificationTokens,
  db,
} from "@/db";
import { eq } from "drizzle-orm";
import { sanitizeString } from "@/utils/inputSanitizer";
import { getActivityStore, getAllPlayers, saveActivityStore, savePlayers } from "@/lib/serverData";

export async function DELETE(_request: Request, { params }: { params: { id?: string } }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_session")?.value;
  const authenticated = await validateAdminSession(token);

  if (!authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = sanitizeString(params?.id ?? "", 100);

  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  const [userRow] = await db
    .select({ id: users.id, email: users.email, role: users.role })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!userRow) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (userRow.role !== "USER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let playersBackup = null;
  let activityBackup = null;
  try {
    playersBackup = await getAllPlayers();
    activityBackup = await getActivityStore();

    const nextPlayers = (playersBackup || []).filter((p: any) => p.userId !== userId);
    const nextSessions = (activityBackup?.sessions || []).filter((s: any) => s.userId !== userId);

    await savePlayers(nextPlayers);
    await saveActivityStore({ ...(activityBackup || {}), sessions: nextSessions });
  } catch (error) {
    console.error("[admin/users/:id] failed to update server data", error);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }

  try {
    await db.transaction(async (tx) => {
      await tx.delete(gameResults).where(eq(gameResults.userId, userId));
      await tx.delete(gameEvents).where(eq(gameEvents.userId, userId));
      await tx.delete(presenceSessions).where(eq(presenceSessions.userId, userId));
      await tx.delete(sessions).where(eq(sessions.userId, userId));
      await tx.delete(accounts).where(eq(accounts.userId, userId));
      if (userRow.email) {
        await tx.delete(verificationTokens).where(eq(verificationTokens.identifier, userRow.email));
      }
      await tx
        .update(themeSettings)
        .set({ updatedByUserId: null })
        .where(eq(themeSettings.updatedByUserId, userId));
      await tx.delete(users).where(eq(users.id, userId));
    });
  } catch (error) {
    try {
      if (playersBackup) {
        await savePlayers(playersBackup);
      }
      if (activityBackup) {
        await saveActivityStore(activityBackup);
      }
    } catch (restoreError) {
      console.error("[admin/users/:id] failed to restore server data", restoreError);
    }

    console.error("[admin/users/:id] failed to delete user", error);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
