import { bigint, boolean, date, integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { index, uniqueIndex } from "drizzle-orm/pg-core/indexes";
import { sql } from "drizzle-orm";

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    name: text("name"),
    displayName: text("display_name"),
    role: text("role").notNull().default("USER"),
    email: text("email").unique(),
    emailVerified: timestamp("email_verified", { withTimezone: false }),
    image: text("image"),
    passwordHash: text("password_hash"),
    createdAt: timestamp("created_at", { withTimezone: false }).defaultNow().notNull(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: false }),
    updatedAt: timestamp("updated_at", { withTimezone: false }).defaultNow().notNull(),
  },
  (table) => ({
    emailIdx: uniqueIndex("users_email_idx").on(table.email),
  })
);

export const accounts = pgTable(
  "accounts",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    expiresAt: integer("expires_at"),
    tokenType: text("token_type"),
    scope: text("scope"),
    idToken: text("id_token"),
    sessionState: text("session_state"),
    createdAt: timestamp("created_at", { withTimezone: false }).defaultNow().notNull(),
  },
  (table) => ({
    providerUnique: uniqueIndex("provider_provider_account_id_idx").on(
      table.provider,
      table.providerAccountId
    ),
  })
);

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    sessionToken: text("session_token").notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expires: timestamp("expires", { withTimezone: false }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: false }).defaultNow().notNull(),
  },
  (table) => ({
    sessionTokenIdx: uniqueIndex("session_token_idx").on(table.sessionToken),
  })
);

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { withTimezone: false }).notNull(),
  },
  (table) => ({
    tokenIdx: uniqueIndex("token_idx").on(table.token),
    identifierTokenIdx: uniqueIndex("identifier_token_idx").on(
      table.identifier,
      table.token
    ),
  })
);

export const guestProfiles = pgTable("guest_profiles", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  displayName: text("display_name"),
  createdAt: timestamp("created_at", { withTimezone: false }).defaultNow().notNull(),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: false }),
});

export const presenceSessions = pgTable(
  "presence_sessions",
  {
    id: text("id").primaryKey(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    guestId: uuid("guest_id").references(() => guestProfiles.id, { onDelete: "set null" }),
    displayName: text("display_name"),
    role: text("role"),
    currentPage: text("current_page"),
    currentGame: text("current_game"),
    state: text("state").notNull().default("IDLE"),
    lastHeartbeatAt: timestamp("last_heartbeat_at", { withTimezone: false }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: false }).defaultNow().notNull(),
  },
  (table) => ({
    lastHeartbeatIdx: index("presence_last_heartbeat_idx").on(table.lastHeartbeatAt),
    userIdx: index("presence_user_idx").on(table.userId),
    guestIdx: index("presence_guest_idx").on(table.guestId),
  })
);

export const gameResults = pgTable(
  "game_results",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    guestId: uuid("guest_id").references(() => guestProfiles.id, { onDelete: "set null" }),
    gameKey: text("game_key").notNull(),
    mode: text("mode").notNull(),
    score: integer("score").notNull(),
    durationMs: integer("duration_ms"),
    attempts: integer("attempts"),
    success: boolean("success").notNull(),
    playedAt: timestamp("played_at", { withTimezone: false }).defaultNow().notNull(),
    dayKey: date("day_key").notNull(),
    monthKey: text("month_key").notNull(),
    metadata: jsonb("metadata").notNull().default(sql`'{}'::jsonb`),
    idempotencyKey: text("idempotency_key"), // For replay protection
  },
  (table) => ({
    dailyIdx: index("game_results_daily_idx").on(table.gameKey, table.dayKey, table.score),
    monthlyIdx: index("game_results_monthly_idx").on(table.gameKey, table.monthKey, table.score),
    userPlayedIdx: index("game_results_user_played_idx").on(table.userId, table.playedAt),
    idempotencyIdx: uniqueIndex("game_results_idempotency_idx").on(table.idempotencyKey),
  })
);

export const gameEvents = pgTable(
  "game_events",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    guestId: uuid("guest_id").references(() => guestProfiles.id, { onDelete: "set null" }),
    gameKey: text("game_key").notNull(),
    type: text("type").notNull(),
    score: integer("score"),
    durationMs: integer("duration_ms"),
    createdAt: timestamp("created_at", { withTimezone: false }).defaultNow().notNull(),
  },
  (table) => ({
    gameIdx: index("game_events_game_idx").on(table.gameKey, table.createdAt),
    userIdx: index("game_events_user_idx").on(table.userId, table.createdAt),
    guestIdx: index("game_events_guest_idx").on(table.guestId, table.createdAt),
  })
);

export const crosswordProgress = pgTable(
  "crossword_progress",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    puzzleDate: date("puzzle_date").notNull(),
    payload: jsonb("payload").notNull().default(sql`'{}'::jsonb`),
    updatedAt: timestamp("updated_at", { withTimezone: false }).defaultNow().notNull(),
  },
  (table) => ({
    userDateUniqueIdx: uniqueIndex("crossword_progress_user_date_idx").on(
      table.userId,
      table.puzzleDate
    ),
    userUpdatedIdx: index("crossword_progress_user_updated_idx").on(
      table.userId,
      table.updatedAt
    ),
  })
);

/**
 * Theme Settings Table
 * Stores admin-controlled theme configuration
 * Uses singleton pattern (single row with id = 'main')
 */
export const themeSettings = pgTable("theme_settings", {
  id: text("id").primaryKey().default("main"),
  
  // Active dominant theme (null = none, 'ramadan', 'eid')
  activeDominantTheme: text("active_dominant_theme"),
  
  // Whether to use date-based scheduling
  useSchedule: boolean("use_schedule").notNull().default(true),
  
  // Ramadan date range (used if useSchedule = true)
  ramadanStart: date("ramadan_start"),
  ramadanEnd: date("ramadan_end"),
  
  // Eid date range (used if useSchedule = true)
  eidStart: date("eid_start"),
  eidEnd: date("eid_end"),
  
  // Custom banner text (overrides theme defaults if set)
  bannerTitle: text("banner_title"),
  bannerSubtitle: text("banner_subtitle"),
  
  // Whether banner is enabled globally
  bannerEnabled: boolean("banner_enabled").notNull().default(true),
  
  // Audit fields
  updatedAt: timestamp("updated_at", { withTimezone: false }).defaultNow().notNull(),
  updatedByUserId: uuid("updated_by_user_id").references(() => users.id, { onDelete: "set null" }),
});

/**
 * Leaderboard Cache Table
 * Stores pre-computed leaderboard data to avoid expensive aggregation queries
 * Key format: {type}:{game}:{date} e.g. "daily:wordle:2026-02-04"
 */
export const leaderboardCache = pgTable("leaderboard_cache", {
  key: text("key").primaryKey(),
  payload: jsonb("payload").notNull(),
  computedAt: timestamp("computed_at", { withTimezone: true }).defaultNow().notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  computeTimeMs: integer("compute_time_ms"),
});

/**
 * Rate Limits Table (for reference - created via migration)
 * Stores rate limit counters with automatic expiry
 */
export const rateLimits = pgTable("rate_limits", {
  key: text("key").primaryKey(),
  windowStart: timestamp("window_start", { withTimezone: false }).notNull(),
  count: integer("count").notNull().default(1),
  expiresAt: timestamp("expires_at", { withTimezone: false }).notNull(),
});

/* ------------------------------------------------------------------ */
/*  Global Leaderboard Tables (Unlimited Mode)                         */
/* ------------------------------------------------------------------ */

/**
 * Global Game Results — append-only audit log for unlimited games
 * Separate from group_game_results to keep contexts isolated
 */
export const globalGameResults = pgTable(
  "global_game_results",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    identityId: uuid("identity_id").notNull(),
    gameKey: text("game_key").notNull(),
    won: boolean("won").notNull(),
    moves: integer("moves"),
    timeMs: integer("time_ms").notNull(),
    pointsAwarded: integer("points_awarded").notNull(),
    playedAt: timestamp("played_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    identityPlayedIdx: index("global_game_results_identity_played_idx").on(
      table.identityId,
      table.playedAt
    ),
    gamePlayedIdx: index("global_game_results_game_played_idx").on(
      table.gameKey,
      table.playedAt
    ),
  })
);

/**
 * Global Player Totals — pre-aggregated for fast leaderboard queries
 * Separate from group_member_totals to keep contexts isolated
 */
export const globalPlayerTotals = pgTable(
  "global_player_totals",
  {
    identityId: uuid("identity_id").primaryKey(),
    totalPoints: bigint("total_points", { mode: "number" }).notNull().default(0),
    totalTimeMs: bigint("total_time_ms", { mode: "number" }).notNull().default(0),
    gamesPlayed: integer("games_played").notNull().default(0),
    wins: integer("wins").notNull().default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    leaderboardIdx: index("global_player_totals_leaderboard_idx").on(
      table.totalPoints,
      table.totalTimeMs,
      table.wins
    ),
  })
);
