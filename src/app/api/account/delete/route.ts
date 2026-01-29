import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import {
  accounts,
  gameEvents,
  gameResults,
  presenceSessions,
  sessions,
  themeSettings,
  users,
  verificationTokens,
} from "@/db";
import { db } from "@/db";
import { getActivityStore, getAllPlayers, saveActivityStore, savePlayers } from "@/lib/serverData";

export async function DELETE() {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    const email = session?.user?.email ?? null;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Best-effort cleanup for file-backed stores (admin dashboards)
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
      console.error("[account/delete] failed to update server data", error);
      return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
    }

    try {
      await db.transaction(async (tx) => {
        await tx.delete(gameResults).where(eq(gameResults.userId, userId));
        await tx.delete(gameEvents).where(eq(gameEvents.userId, userId));
        await tx.delete(presenceSessions).where(eq(presenceSessions.userId, userId));
        await tx.delete(sessions).where(eq(sessions.userId, userId));
        await tx.delete(accounts).where(eq(accounts.userId, userId));
        if (email) {
          await tx.delete(verificationTokens).where(eq(verificationTokens.identifier, email));
        }
        await tx
          .update(themeSettings)
          .set({ updatedByUserId: null })
          .where(eq(themeSettings.updatedByUserId, userId));
        await tx.delete(users).where(eq(users.id, userId));
      });
    } catch (error) {
      // Attempt to restore file-backed data if DB deletion fails
      try {
        if (playersBackup) {
          await savePlayers(playersBackup);
        }
        if (activityBackup) {
          await saveActivityStore(activityBackup);
        }
      } catch (restoreError) {
        console.error("[account/delete] failed to restore server data", restoreError);
      }

      console.error("[account/delete] failed to delete account", error);
      return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[account/delete] unexpected error", error);
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
  }
}
