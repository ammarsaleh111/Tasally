import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { validateAdminSession } from "@/lib/adminAuth";
import { db, gameResults, guestProfiles, presenceSessions, users } from "@/db";
import { and, desc, eq, gte, inArray, isNotNull, sql } from "drizzle-orm";
import { getUsersColumnFlags } from "@/server/dbIntrospection";

const ACTIVE_WINDOW_MINUTES = 5;
const RECENT_WINS_DAYS = 7;
const GAME_KEYS = [
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

type ActiveSession = {
  id: string;
  userId: string | null;
  guestId: string | null;
  displayName: string | null;
  role: string | null;
  currentPage: string | null;
  currentGame: string | null;
  state: string;
  lastHeartbeatAt: Date;
};

function getSessionKey(session: ActiveSession) {
  return session.userId ?? session.guestId ?? session.id;
}

function normalizeDisplayName(name?: string | null) {
  if (name && name.trim().length > 0) return name.trim();
  return "Anonymous";
}

function normalizeDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  const date = new Date(value as string);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getLatestDate(...dates: Array<Date | null | undefined>) {
  let latest: Date | null = null;
  dates.forEach((date) => {
    if (!date) return;
    if (!latest || date.getTime() > latest.getTime()) {
      latest = date;
    }
  });
  return latest;
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin_session")?.value;
    const authenticated = await validateAdminSession(token);

    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const activeCutoff = new Date(now.getTime() - ACTIVE_WINDOW_MINUTES * 60 * 1000);
    const recentCutoff = new Date(now.getTime() - RECENT_WINS_DAYS * 24 * 60 * 60 * 1000);

    const { usersRole } = await getUsersColumnFlags();
    const roleCondition = usersRole ? eq(users.role, "USER") : null;

    const activeSessionsRaw = await db
      .select({
        id: presenceSessions.id,
        userId: presenceSessions.userId,
        guestId: presenceSessions.guestId,
        displayName: presenceSessions.displayName,
        role: presenceSessions.role,
        currentPage: presenceSessions.currentPage,
        currentGame: presenceSessions.currentGame,
        state: presenceSessions.state,
        lastHeartbeatAt: presenceSessions.lastHeartbeatAt,
      })
      .from(presenceSessions)
      .where(and(isNotNull(presenceSessions.userId), gte(presenceSessions.lastHeartbeatAt, activeCutoff)));

    // Deduplicate sessions by player (user or guest), keep the most recent heartbeat
    const activeSessionMap = new Map<string, ActiveSession>();
    activeSessionsRaw.forEach((session) => {
      const key = getSessionKey(session);
      const existing = activeSessionMap.get(key);
      if (!existing || session.lastHeartbeatAt > existing.lastHeartbeatAt) {
        activeSessionMap.set(key, session);
      }
    });

    const activeSessions = Array.from(activeSessionMap.values()).sort(
      (a, b) => b.lastHeartbeatAt.getTime() - a.lastHeartbeatAt.getTime()
    );

    const activePlayers = activeSessions.length;

    const activePlaying = activeSessions.filter(
      (session) => session.state === "PLAYING" && session.currentGame
    );

    const activeGames = activePlaying.length;
    const gameDistribution: Record<string, number> = {};
    activePlaying.forEach((session) => {
      if (!session.currentGame) return;
      gameDistribution[session.currentGame] = (gameDistribution[session.currentGame] || 0) + 1;
    });

    let totalUsersQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(users);
    if (roleCondition) {
      totalUsersQuery = totalUsersQuery.where(roleCondition);
    }
    const [{ count: totalUsers = 0 }] = await totalUsersQuery;

    const [{ count: totalGuests = 0 }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(guestProfiles);

    const totalPlayers = Number(totalUsers) + Number(totalGuests);

    const [overallTotals] = await db
      .select({
        played: sql<number>`count(*)`,
        wins: sql<number>`count(*) filter (where ${gameResults.success} = true)`,
      })
      .from(gameResults)
      .where(isNotNull(gameResults.userId));

    const totalGames = Number(overallTotals?.played ?? 0);
    const totalWins = Number(overallTotals?.wins ?? 0);

    const perGameRows = await db
      .select({
        gameKey: gameResults.gameKey,
        played: sql<number>`count(*)`,
        wins: sql<number>`count(*) filter (where ${gameResults.success} = true)`,
        bestTimeMs: sql<number | null>`min(${gameResults.durationMs}) filter (where ${gameResults.success} = true)`,
      })
      .from(gameResults)
      .where(isNotNull(gameResults.userId))
      .groupBy(gameResults.gameKey);

    const perGameMap = new Map(
      perGameRows.map((row) => [row.gameKey, row])
    );

    const gamePerformance = GAME_KEYS.map((gameKey) => {
      const row = perGameMap.get(gameKey);
      return {
        gameKey,
        played: Number(row?.played ?? 0),
        won: Number(row?.wins ?? 0),
        bestTimeMs:
          row?.bestTimeMs !== null && row?.bestTimeMs !== undefined
            ? Number(row.bestTimeMs)
            : null,
        bestStreak: null as number | null,
      };
    });

    const userStatsRows = await db
      .select({
        userId: gameResults.userId,
        played: sql<number>`count(*)`,
        wins: sql<number>`count(*) filter (where ${gameResults.success} = true)`,
        lastPlayedAt: sql<Date>`max(${gameResults.playedAt})`,
      })
      .from(gameResults)
      .where(isNotNull(gameResults.userId))
      .groupBy(gameResults.userId);

    const guestStatsRows = await db
      .select({
        guestId: gameResults.guestId,
        played: sql<number>`count(*)`,
        wins: sql<number>`count(*) filter (where ${gameResults.success} = true)`,
        lastPlayedAt: sql<Date>`max(${gameResults.playedAt})`,
      })
      .from(gameResults)
      .where(isNotNull(gameResults.guestId))
      .groupBy(gameResults.guestId);

    const userStatsMap = new Map(
      userStatsRows
        .filter((row) => row.userId)
        .map((row) => [
          row.userId as string,
          {
            played: Number(row.played ?? 0),
            wins: Number(row.wins ?? 0),
            lastPlayedAt: normalizeDate(row.lastPlayedAt),
          },
        ])
    );

    const guestStatsMap = new Map(
      guestStatsRows
        .filter((row) => row.guestId)
        .map((row) => [
          row.guestId as string,
          {
            played: Number(row.played ?? 0),
            wins: Number(row.wins ?? 0),
            lastPlayedAt: normalizeDate(row.lastPlayedAt),
          },
        ])
    );

    let userRowsQuery = db
      .select({
        id: users.id,
        displayName: users.displayName,
        name: users.name,
        createdAt: users.createdAt,
      })
      .from(users);
    if (roleCondition) {
      userRowsQuery = userRowsQuery.where(roleCondition);
    }
    const userRows = await userRowsQuery.orderBy(desc(users.createdAt));

    const guestRows = await db
      .select({
        id: guestProfiles.id,
        displayName: guestProfiles.displayName,
        createdAt: guestProfiles.createdAt,
        lastSeenAt: guestProfiles.lastSeenAt,
      })
      .from(guestProfiles)
      .orderBy(desc(guestProfiles.createdAt));

    const activeSessionByUser = new Map<string, ActiveSession>();
    const activeSessionByGuest = new Map<string, ActiveSession>();
    activeSessions.forEach((session) => {
      if (session.userId) {
        activeSessionByUser.set(session.userId, session);
        return;
      }
      if (session.guestId) {
        activeSessionByGuest.set(session.guestId, session);
      }
    });

    const players = [
      ...userRows.map((user) => {
        const stats = userStatsMap.get(user.id);
        const activeSession = activeSessionByUser.get(user.id);
        const lastSeenAt = getLatestDate(activeSession?.lastHeartbeatAt, stats?.lastPlayedAt, user.createdAt);
        return {
          id: user.id,
          displayName: normalizeDisplayName(user.displayName || user.name),
          type: "USER",
          lastSeenAt: lastSeenAt?.toISOString() ?? null,
          totalPlays: stats?.played ?? 0,
          totalWins: stats?.wins ?? 0,
        };
      }),
      ...guestRows.map((guest) => {
        const stats = guestStatsMap.get(guest.id);
        const activeSession = activeSessionByGuest.get(guest.id);
        const lastSeenAt = getLatestDate(
          activeSession?.lastHeartbeatAt,
          guest.lastSeenAt ?? null,
          stats?.lastPlayedAt,
          guest.createdAt
        );
        return {
          id: guest.id,
          displayName: normalizeDisplayName(guest.displayName ?? "Guest"),
          type: "GUEST",
          lastSeenAt: lastSeenAt?.toISOString() ?? null,
          totalPlays: stats?.played ?? 0,
          totalWins: stats?.wins ?? 0,
        };
      }),
    ];

    const recentUserWins = await db
      .select({
        userId: gameResults.userId,
        wins: sql<number>`count(*)`,
        lastWinAt: sql<Date>`max(${gameResults.playedAt})`,
      })
      .from(gameResults)
      .where(
        and(
          isNotNull(gameResults.userId),
          eq(gameResults.success, true),
          gte(gameResults.playedAt, recentCutoff)
        )
      )
      .groupBy(gameResults.userId)
      .orderBy(desc(sql`count(*)`))
      .limit(50);

    const recentGuestWins = await db
      .select({
        guestId: gameResults.guestId,
        wins: sql<number>`count(*)`,
        lastWinAt: sql<Date>`max(${gameResults.playedAt})`,
      })
      .from(gameResults)
      .where(
        and(
          isNotNull(gameResults.guestId),
          eq(gameResults.success, true),
          gte(gameResults.playedAt, recentCutoff)
        )
      )
      .groupBy(gameResults.guestId)
      .orderBy(desc(sql`count(*)`))
      .limit(50);

    const userIds = recentUserWins.map((row) => row.userId).filter(Boolean) as string[];
    const guestIds = recentGuestWins.map((row) => row.guestId).filter(Boolean) as string[];

    const userNameRows = userIds.length
      ? await db
          .select({ id: users.id, displayName: users.displayName, name: users.name })
          .from(users)
          .where(inArray(users.id, userIds))
      : [];

    const guestNameRows = guestIds.length
      ? await db
          .select({ id: guestProfiles.id, displayName: guestProfiles.displayName })
          .from(guestProfiles)
          .where(inArray(guestProfiles.id, guestIds))
      : [];

    const userNameMap = new Map(
      userNameRows.map((row) => [row.id, normalizeDisplayName(row.displayName || row.name)])
    );

    const guestNameMap = new Map(
      guestNameRows.map((row) => [row.id, normalizeDisplayName(row.displayName ?? "Guest")])
    );

    const topPerformers = [
      ...recentUserWins.map((row) => {
        const userId = row.userId as string;
        const activeSession = activeSessionByUser.get(userId);
        const lastWinAt = normalizeDate(row.lastWinAt);
        const lastSeenAt = activeSession?.lastHeartbeatAt.toISOString() ?? lastWinAt?.toISOString() ?? null;
        return {
          id: userId,
          displayName: userNameMap.get(userId) ?? "Anonymous",
          type: "USER",
          recentWins: Number(row.wins ?? 0),
          lastWinAt: lastWinAt?.toISOString() ?? null,
          state: activeSession?.state ?? "IDLE",
          currentGame: activeSession?.currentGame ?? null,
          lastSeenAt,
        };
      }),
      ...recentGuestWins.map((row) => {
        const guestId = row.guestId as string;
        const activeSession = activeSessionByGuest.get(guestId);
        const lastWinAt = normalizeDate(row.lastWinAt);
        const lastSeenAt = activeSession?.lastHeartbeatAt.toISOString() ?? lastWinAt?.toISOString() ?? null;
        return {
          id: guestId,
          displayName: guestNameMap.get(guestId) ?? "Guest",
          type: "GUEST",
          recentWins: Number(row.wins ?? 0),
          lastWinAt: lastWinAt?.toISOString() ?? null,
          state: activeSession?.state ?? "IDLE",
          currentGame: activeSession?.currentGame ?? null,
          lastSeenAt,
        };
      }),
    ]
      .sort((a, b) => {
        if (b.recentWins !== a.recentWins) {
          return b.recentWins - a.recentWins;
        }
        const aTime = a.lastWinAt ? new Date(a.lastWinAt).getTime() : 0;
        const bTime = b.lastWinAt ? new Date(b.lastWinAt).getTime() : 0;
        return bTime - aTime;
      })
      .slice(0, 5);

    const response = NextResponse.json({
      totalPlayers,
      totalWinsOverall: totalWins,
      perGame: gamePerformance,
      metrics: {
        activePlayers,
        activeGames,
        gameDistribution,
        activeSessions: activeSessions.map((session) => ({
          id: getSessionKey(session),
          displayName: normalizeDisplayName(session.displayName),
          state: session.state,
          currentGame: session.currentGame,
          currentPage: session.currentPage,
          lastSeenAt: session.lastHeartbeatAt.toISOString(),
          type: session.userId ? "USER" : session.guestId ? "GUEST" : "UNKNOWN",
        })),
        liveGames: activePlaying.map((session) => ({
          player: normalizeDisplayName(session.displayName),
          game: session.currentGame,
          timestamp: session.lastHeartbeatAt.getTime(),
        })),
      },
      totals: {
        totalPlayers,
        totalRegistered: Number(totalUsers),
        totalGuests: Number(totalGuests),
        totalGames,
        totalWins,
      },
      gamePerformance,
      topPerformers,
      players,
      lastUpdated: now.toISOString(),
    });

    response.headers.set("Cache-Control", "no-store, max-age=0");
    response.headers.set("ETag", `W/\"${now.getTime()}\"`);
    return response;
  } catch (error) {
    console.error("[admin/metrics] failed to compute metrics", error);
    return NextResponse.json({ error: "Failed to load metrics" }, { status: 500 });
  }
}
