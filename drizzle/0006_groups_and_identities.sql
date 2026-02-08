-- Migration: Groups & Identities System
-- Creates tables for: identities, groups, group_members, group_invites,
--   group_game_results, group_member_totals
-- Designed for 10k+ concurrent users with Neon pooled connections

-- 1. Identities — unified identity for guest + logged-in users
CREATE TABLE IF NOT EXISTS "identities" (
  "id"                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id"           UUID REFERENCES "users"("id") ON DELETE SET NULL,
  "guest_id"          UUID REFERENCES "guest_profiles"("id") ON DELETE SET NULL,
  "display_name"      TEXT NOT NULL,
  "display_name_norm" TEXT NOT NULL,
  "created_at"        TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at"        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX "identities_display_name_norm_idx" ON "identities" ("display_name_norm");
CREATE INDEX "identities_user_id_idx" ON "identities" ("user_id") WHERE "user_id" IS NOT NULL;
CREATE INDEX "identities_guest_id_idx" ON "identities" ("guest_id") WHERE "guest_id" IS NOT NULL;

-- 2. Groups
CREATE TABLE IF NOT EXISTS "groups" (
  "id"                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name"               TEXT NOT NULL,
  "owner_identity_id"  UUID NOT NULL REFERENCES "identities"("id") ON DELETE CASCADE,
  "join_code"          TEXT UNIQUE,
  "created_at"         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX "groups_owner_idx" ON "groups" ("owner_identity_id");

-- 3. Group Members
CREATE TABLE IF NOT EXISTS "group_members" (
  "group_id"     UUID NOT NULL REFERENCES "groups"("id") ON DELETE CASCADE,
  "identity_id"  UUID NOT NULL REFERENCES "identities"("id") ON DELETE CASCADE,
  "role"         TEXT NOT NULL DEFAULT 'member' CHECK ("role" IN ('owner', 'member')),
  "status"       TEXT NOT NULL DEFAULT 'active' CHECK ("status" IN ('active')),
  "joined_at"    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "group_members_pk" PRIMARY KEY ("group_id", "identity_id")
);

CREATE INDEX "group_members_identity_idx" ON "group_members" ("identity_id");

-- 4. Group Invites
CREATE TABLE IF NOT EXISTS "group_invites" (
  "id"                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "group_id"              UUID NOT NULL REFERENCES "groups"("id") ON DELETE CASCADE,
  "inviter_identity_id"   UUID NOT NULL REFERENCES "identities"("id") ON DELETE CASCADE,
  "invitee_identity_id"   UUID NOT NULL REFERENCES "identities"("id") ON DELETE CASCADE,
  "status"                TEXT NOT NULL DEFAULT 'pending' CHECK ("status" IN ('pending', 'accepted', 'declined', 'expired')),
  "created_at"            TIMESTAMPTZ NOT NULL DEFAULT now(),
  "expires_at"            TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days')
);

CREATE INDEX "group_invites_invitee_status_idx" ON "group_invites" ("invitee_identity_id", "status");
CREATE INDEX "group_invites_group_status_idx" ON "group_invites" ("group_id", "status");

-- 5. Group Game Results (append-only audit log)
CREATE TABLE IF NOT EXISTS "group_game_results" (
  "id"              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "group_id"        UUID NOT NULL REFERENCES "groups"("id") ON DELETE CASCADE,
  "identity_id"     UUID NOT NULL REFERENCES "identities"("id") ON DELETE CASCADE,
  "game_key"        TEXT NOT NULL CHECK ("game_key" IN ('wordle', 'numbers', 'trivia', 'waffle', 'combinations', 'spelling')),
  "mode"            TEXT NOT NULL DEFAULT 'unlimited' CHECK ("mode" = 'unlimited'),
  "won"             BOOLEAN NOT NULL,
  "moves"           INTEGER,
  "time_ms"         INTEGER NOT NULL,
  "points_awarded"  INTEGER NOT NULL,
  "played_at"       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX "group_game_results_group_played_idx" ON "group_game_results" ("group_id", "played_at" DESC);
CREATE INDEX "group_game_results_group_identity_idx" ON "group_game_results" ("group_id", "identity_id", "played_at" DESC);
CREATE INDEX "group_game_results_group_game_idx" ON "group_game_results" ("group_id", "game_key", "played_at" DESC);

-- 6. Group Member Totals (pre-aggregated for fast leaderboard)
CREATE TABLE IF NOT EXISTS "group_member_totals" (
  "group_id"       UUID NOT NULL REFERENCES "groups"("id") ON DELETE CASCADE,
  "identity_id"    UUID NOT NULL REFERENCES "identities"("id") ON DELETE CASCADE,
  "total_points"   BIGINT NOT NULL DEFAULT 0,
  "total_time_ms"  BIGINT NOT NULL DEFAULT 0,
  "games_played"   INTEGER NOT NULL DEFAULT 0,
  "wins"           INTEGER NOT NULL DEFAULT 0,
  "updated_at"     TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "group_member_totals_pk" PRIMARY KEY ("group_id", "identity_id")
);

-- Covering index for leaderboard ORDER BY query — no table lookback needed
CREATE INDEX "group_member_totals_leaderboard_idx"
  ON "group_member_totals" ("group_id", "total_points" DESC, "total_time_ms" ASC, "wins" DESC);
