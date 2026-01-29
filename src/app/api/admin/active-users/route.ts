import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { validateAdminSession } from "@/lib/adminAuth";
import { db, presenceSessions, users } from "@/db";
import { and, desc, eq, gte, isNotNull, sql } from "drizzle-orm";
import { getUsersColumnFlags } from "@/server/dbIntrospection";

const ACTIVE_WINDOW_MINUTES = 5;

const GAME_LABELS: Record<string, string> = {
  wordle: "Wordle",
  connections: "Connections",
  crossword: "Crossword",
  numbers: "Numbers",
  trivia: "Trivia",
  strands: "Strands",
  spelling: "Spelling Bee",
  waffle: "Waffle",
  combinations: "Combinations",
};

function formatGameLabel(gameKey?: string | null) {
  if (!gameKey) return "Game";
  return GAME_LABELS[gameKey] ?? `${gameKey.charAt(0).toUpperCase()}${gameKey.slice(1)}`;
}

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_session")?.value;
  const authenticated = await validateAdminSession(token);

  if (!authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const activeCutoff = new Date(now.getTime() - ACTIVE_WINDOW_MINUTES * 60 * 1000);

  const { usersRole } = await getUsersColumnFlags();

  const roleCondition = usersRole ? eq(users.role, "USER") : null;

  const rows = await db
    .select({
      sessionId: presenceSessions.id,
      userId: presenceSessions.userId,
      displayName: presenceSessions.displayName,
      state: presenceSessions.state,
      currentGame: presenceSessions.currentGame,
      lastHeartbeatAt: presenceSessions.lastHeartbeatAt,
      userDisplayName: users.displayName,
      userName: users.name,
    })
    .from(presenceSessions)
    .leftJoin(users, eq(presenceSessions.userId, users.id))
    .where(
      and(
        isNotNull(presenceSessions.userId),
        gte(presenceSessions.lastHeartbeatAt, activeCutoff),
        roleCondition ?? sql`true`
      )
    )
    .orderBy(desc(presenceSessions.lastHeartbeatAt));

  const latestByUser = new Map<string, typeof rows[number]>();
  rows.forEach((row) => {
    if (!row.userId) return;
    const existing = latestByUser.get(row.userId);
    if (!existing || row.lastHeartbeatAt > existing.lastHeartbeatAt) {
      latestByUser.set(row.userId, row);
    }
  });

  const activeUsers = Array.from(latestByUser.values()).map((row) => {
    const lastSeen = row.lastHeartbeatAt;
    const ageMs = now.getTime() - lastSeen.getTime();
    const status =
      ageMs > ACTIVE_WINDOW_MINUTES * 60 * 1000
        ? "OFFLINE"
        : row.state === "IDLE"
        ? "IDLE"
        : "ONLINE";

    return {
      id: row.userId as string,
      displayName: row.userDisplayName ?? row.userName ?? row.displayName ?? "Player",
      lastSeenAt: lastSeen.toISOString(),
      currentActivity:
        row.state === "PLAYING" && row.currentGame
          ? `Playing: ${formatGameLabel(row.currentGame)}`
          : "Idle",
      status,
      state: row.state,
      currentGameKey: row.currentGame ?? null,
    };
  });

  const response = NextResponse.json({
    activeUsers,
    lastUpdated: now.toISOString(),
  });
  response.headers.set("Cache-Control", "no-store, max-age=0");
  return response;
}
