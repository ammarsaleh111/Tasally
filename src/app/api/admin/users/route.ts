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
import { and, desc, eq, ilike, isNotNull, or, sql } from "drizzle-orm";
import { getActivityStore, getAllPlayers, saveActivityStore, savePlayers } from "@/lib/serverData";
import { sanitizeString } from "@/utils/inputSanitizer";
import { getUsersColumnFlags } from "@/server/dbIntrospection";

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_session")?.value;
  const authenticated = await validateAdminSession(token);

  if (!authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const rawQuery = searchParams.get("query") ?? "";
  const query = rawQuery.trim().slice(0, 100);

  const { usersRole, usersLastSeen } = await getUsersColumnFlags();

  const winsByUser = db
    .select({
      userId: gameResults.userId,
      totalWins: sql<number>`count(*) filter (where ${gameResults.success} = true)`.as("totalWins"),
    })
    .from(gameResults)
    .where(isNotNull(gameResults.userId))
    .groupBy(gameResults.userId)
    .as("wins_by_user");

  let builder = db
    .select({
      id: users.id,
      displayName: users.displayName,
      name: users.name,
      createdAt: users.createdAt,
      lastSeenAt: usersLastSeen ? users.lastSeenAt : sql<Date | null>`null`.as("lastSeenAt"),
      totalWins: sql<number>`coalesce(${winsByUser.totalWins}, 0)`,
    })
    .from(users)
    .leftJoin(winsByUser, eq(users.id, winsByUser.userId));

  const roleCondition = usersRole ? eq(users.role, "USER") : null;

  if (query) {
    const likeQuery = `%${query}%`;
    builder = builder.where(
      and(
        roleCondition ?? sql`true`,
        or(
          ilike(users.displayName, likeQuery),
          ilike(users.name, likeQuery),
          sql`${users.id}::text ilike ${likeQuery}`
        )
      )
    );
  } else {
    if (roleCondition) {
      builder = builder.where(roleCondition);
    }
  }

  const rows = await builder.orderBy(desc(users.createdAt));

  const payload = rows.map((row) => ({
    id: row.id,
    displayName: row.displayName ?? row.name ?? "Player",
    createdAt: row.createdAt ? row.createdAt.toISOString() : null,
    lastSeenAt: row.lastSeenAt ? row.lastSeenAt.toISOString() : null,
    totalWins: Number(row.totalWins ?? 0),
  }));

  const response = NextResponse.json({ users: payload });
  response.headers.set("Cache-Control", "no-store, max-age=0");
  return response;
}

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
        console.error("[admin/users] failed to update server data", error);
        return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
      }

      const [userRow] = await db
        .select({ email: users.email, role: users.role })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (userRow?.role && userRow.role !== "USER") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      try {
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
          console.error("[admin/users] failed to restore server data", restoreError);
        }

        console.error("[admin/users] failed to delete user", error);
        return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
      }
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
