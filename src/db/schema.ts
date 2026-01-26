import { boolean, date, integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { index, uniqueIndex } from "drizzle-orm/pg-core/indexes";
import { sql } from "drizzle-orm";

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    name: text("name"),
    email: text("email").unique(),
    emailVerified: timestamp("email_verified", { withTimezone: false }),
    image: text("image"),
    passwordHash: text("password_hash"),
    createdAt: timestamp("created_at", { withTimezone: false }).defaultNow().notNull(),
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
  },
  (table) => ({
    dailyIdx: index("game_results_daily_idx").on(table.gameKey, table.dayKey, table.score),
    monthlyIdx: index("game_results_monthly_idx").on(table.gameKey, table.monthKey, table.score),
    userPlayedIdx: index("game_results_user_played_idx").on(table.userId, table.playedAt),
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
