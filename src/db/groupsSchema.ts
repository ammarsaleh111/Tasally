/**
 * Groups & Identities Schema
 *
 * Tables for the Groups feature:
 *   identities, groups, group_members, group_invites,
 *   group_game_results, group_member_totals
 *
 * Designed for high scalability: aggregate table for fast leaderboard,
 * append-only results for audit, and covering indexes for hot paths.
 */

import {
  boolean,
  check,
  integer,
  bigint,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { index, uniqueIndex } from "drizzle-orm/pg-core/indexes";
import { sql } from "drizzle-orm";
import { users } from "./schema";

// Re-export guestProfiles reference so we can FK to it
import { guestProfiles } from "./schema";

/* ------------------------------------------------------------------ */
/*  1. identities                                                      */
/* ------------------------------------------------------------------ */
export const identities = pgTable(
  "identities",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    guestId: uuid("guest_id").references(() => guestProfiles.id, {
      onDelete: "set null",
    }),
    displayName: text("display_name").notNull(),
    displayNameNorm: text("display_name_norm").notNull(),
    lastRenamedAt: timestamp("last_renamed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    displayNameNormIdx: uniqueIndex("identities_display_name_norm_idx").on(
      table.displayNameNorm
    ),
    userIdUniqueIdx: uniqueIndex("identities_user_id_unique_idx")
      .on(table.userId)
      .where(sql`user_id IS NOT NULL`),
    guestIdIdx: index("identities_guest_id_idx").on(table.guestId),
  })
);

/* ------------------------------------------------------------------ */
/*  2. groups                                                          */
/* ------------------------------------------------------------------ */
export const groups = pgTable(
  "groups",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    name: text("name").notNull(),
    ownerIdentityId: uuid("owner_identity_id")
      .notNull()
      .references(() => identities.id, { onDelete: "cascade" }),
    joinCode: text("join_code").unique(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    ownerIdx: index("groups_owner_idx").on(table.ownerIdentityId),
  })
);

/* ------------------------------------------------------------------ */
/*  3. group_members                                                   */
/* ------------------------------------------------------------------ */
export const groupMembers = pgTable(
  "group_members",
  {
    groupId: uuid("group_id")
      .notNull()
      .references(() => groups.id, { onDelete: "cascade" }),
    identityId: uuid("identity_id")
      .notNull()
      .references(() => identities.id, { onDelete: "cascade" }),
    role: text("role").notNull().default("member"),
    status: text("status").notNull().default("active"),
    joinedAt: timestamp("joined_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.groupId, table.identityId] }),
    identityIdx: index("group_members_identity_idx").on(table.identityId),
  })
);

/* ------------------------------------------------------------------ */
/*  4. group_invites                                                   */
/* ------------------------------------------------------------------ */
export const groupInvites = pgTable(
  "group_invites",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    groupId: uuid("group_id")
      .notNull()
      .references(() => groups.id, { onDelete: "cascade" }),
    inviterIdentityId: uuid("inviter_identity_id")
      .notNull()
      .references(() => identities.id, { onDelete: "cascade" }),
    inviteeIdentityId: uuid("invitee_identity_id")
      .notNull()
      .references(() => identities.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (table) => ({
    inviteeStatusIdx: index("group_invites_invitee_status_idx").on(
      table.inviteeIdentityId,
      table.status
    ),
    groupStatusIdx: index("group_invites_group_status_idx").on(
      table.groupId,
      table.status
    ),
  })
);

/* ------------------------------------------------------------------ */
/*  5. group_game_results — append-only audit log                      */
/* ------------------------------------------------------------------ */
export const groupGameResults = pgTable(
  "group_game_results",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    groupId: uuid("group_id")
      .notNull()
      .references(() => groups.id, { onDelete: "cascade" }),
    identityId: uuid("identity_id")
      .notNull()
      .references(() => identities.id, { onDelete: "cascade" }),
    gameKey: text("game_key").notNull(),
    mode: text("mode").notNull().default("unlimited"),
    won: boolean("won").notNull(),
    moves: integer("moves"),
    timeMs: integer("time_ms").notNull(),
    pointsAwarded: integer("points_awarded").notNull(),
    playedAt: timestamp("played_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    groupPlayedIdx: index("group_game_results_group_played_idx").on(
      table.groupId,
      table.playedAt
    ),
    groupIdentityIdx: index("group_game_results_group_identity_idx").on(
      table.groupId,
      table.identityId,
      table.playedAt
    ),
    groupGameIdx: index("group_game_results_group_game_idx").on(
      table.groupId,
      table.gameKey,
      table.playedAt
    ),
  })
);

/* ------------------------------------------------------------------ */
/*  6. group_member_totals — pre-aggregated for fast leaderboard       */
/* ------------------------------------------------------------------ */
export const groupMemberTotals = pgTable(
  "group_member_totals",
  {
    groupId: uuid("group_id")
      .notNull()
      .references(() => groups.id, { onDelete: "cascade" }),
    identityId: uuid("identity_id")
      .notNull()
      .references(() => identities.id, { onDelete: "cascade" }),
    totalPoints: bigint("total_points", { mode: "number" })
      .notNull()
      .default(0),
    totalTimeMs: bigint("total_time_ms", { mode: "number" })
      .notNull()
      .default(0),
    gamesPlayed: integer("games_played").notNull().default(0),
    wins: integer("wins").notNull().default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.groupId, table.identityId] }),
    leaderboardIdx: index("group_member_totals_leaderboard_idx").on(
      table.groupId,
      table.totalPoints,
      table.totalTimeMs,
      table.wins
    ),
  })
);
