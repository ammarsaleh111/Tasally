-- Migration: Add Global Leaderboard Tables
-- Separate from group tables to maintain strict context isolation

-- 1. global_game_results — append-only audit log for unlimited games
CREATE TABLE IF NOT EXISTS global_game_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id UUID NOT NULL REFERENCES identities(id) ON DELETE CASCADE,
  game_key TEXT NOT NULL,
  won BOOLEAN NOT NULL,
  moves INTEGER,
  time_ms INTEGER NOT NULL,
  points_awarded INTEGER NOT NULL,
  played_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for global_game_results
CREATE INDEX IF NOT EXISTS global_game_results_identity_played_idx
  ON global_game_results (identity_id, played_at DESC);
CREATE INDEX IF NOT EXISTS global_game_results_game_played_idx
  ON global_game_results (game_key, played_at DESC);

-- 2. global_player_totals — pre-aggregated for fast leaderboard
CREATE TABLE IF NOT EXISTS global_player_totals (
  identity_id UUID PRIMARY KEY REFERENCES identities(id) ON DELETE CASCADE,
  total_points BIGINT NOT NULL DEFAULT 0,
  total_time_ms BIGINT NOT NULL DEFAULT 0,
  games_played INTEGER NOT NULL DEFAULT 0,
  wins INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Covering index for leaderboard queries (ORDER BY total_points DESC, total_time_ms ASC)
CREATE INDEX IF NOT EXISTS global_player_totals_leaderboard_idx
  ON global_player_totals (total_points DESC, total_time_ms ASC, wins DESC);

COMMENT ON TABLE global_game_results IS 'Append-only audit log for global unlimited game results. Separate from group_game_results.';
COMMENT ON TABLE global_player_totals IS 'Pre-aggregated player totals for fast global leaderboard. Separate from group_member_totals.';
