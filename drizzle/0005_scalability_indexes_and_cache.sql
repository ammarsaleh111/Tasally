-- Migration: Scalability Upgrade - Indexes and Leaderboard Cache
-- Purpose: Support 10k-50k concurrent users with presence tracking and cached leaderboards

-- =============================================================================
-- PRESENCE TRACKING INDEXES
-- =============================================================================

-- Index for online user count queries: SELECT COUNT(*) FROM users WHERE last_seen_at > now() - interval
-- This is the primary index for presence tracking - enables fast online count queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS users_last_seen_at_idx 
ON users (last_seen_at DESC NULLS LAST)
WHERE last_seen_at IS NOT NULL;

-- Composite index for authenticated user presence lookups
-- Used in heartbeat endpoint to update specific user's last_seen_at
CREATE INDEX CONCURRENTLY IF NOT EXISTS users_id_last_seen_idx 
ON users (id, last_seen_at)
WHERE last_seen_at IS NOT NULL;

-- =============================================================================
-- LEADERBOARD CACHE TABLE
-- =============================================================================

-- Stores pre-computed leaderboard data to avoid expensive aggregation queries
-- Key structure: "daily:wordle:2026-02-04" or "monthly:wordle:2026-02"
CREATE TABLE IF NOT EXISTS leaderboard_cache (
  key TEXT PRIMARY KEY,
  payload JSONB NOT NULL,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  compute_time_ms INTEGER -- Track how long computation took for monitoring
);

-- Index for cache expiry checks and cleanup
CREATE INDEX IF NOT EXISTS leaderboard_cache_expires_idx 
ON leaderboard_cache (expires_at);

-- Comment for documentation
COMMENT ON TABLE leaderboard_cache IS 'Pre-computed leaderboard data with TTL. Reduces expensive aggregation queries.';
COMMENT ON COLUMN leaderboard_cache.key IS 'Cache key format: {type}:{game}:{date} e.g. daily:wordle:2026-02-04';
COMMENT ON COLUMN leaderboard_cache.payload IS 'JSON array of leaderboard entries with rank, playerName, score, etc.';
COMMENT ON COLUMN leaderboard_cache.expires_at IS 'When this cache entry expires. Readers should check this.';
COMMENT ON COLUMN leaderboard_cache.compute_time_ms IS 'How long the leaderboard computation took in milliseconds.';

-- =============================================================================
-- GAME RESULTS INDEXES (Leaderboard Query Optimization)
-- =============================================================================

-- Composite index for daily leaderboard queries
-- Query: SELECT ... FROM game_results WHERE game_key = X AND day_key = Y AND mode = 'daily' ORDER BY score DESC
CREATE INDEX CONCURRENTLY IF NOT EXISTS game_results_daily_leaderboard_idx
ON game_results (game_key, day_key, score DESC)
WHERE mode = 'daily' AND user_id IS NOT NULL;

-- Composite index for monthly leaderboard aggregation
-- Query: SELECT user_id, SUM(score), COUNT(*) FROM game_results WHERE game_key = X AND month_key = Y GROUP BY user_id
CREATE INDEX CONCURRENTLY IF NOT EXISTS game_results_monthly_leaderboard_idx
ON game_results (game_key, month_key, user_id, score)
WHERE mode = 'daily' AND user_id IS NOT NULL;

-- =============================================================================
-- PRESENCE SESSIONS INDEXES (Admin Dashboard Optimization)
-- =============================================================================

-- Index for active user queries in admin dashboard
-- Query: SELECT ... FROM presence_sessions WHERE last_heartbeat_at > cutoff ORDER BY last_heartbeat_at DESC
CREATE INDEX CONCURRENTLY IF NOT EXISTS presence_sessions_active_idx
ON presence_sessions (last_heartbeat_at DESC)
WHERE user_id IS NOT NULL;

-- =============================================================================
-- RATE LIMITS CLEANUP INDEX
-- =============================================================================

-- Already exists from previous migration, but ensure it's there
CREATE INDEX IF NOT EXISTS rate_limits_expires_cleanup_idx 
ON rate_limits (expires_at)
WHERE expires_at < now();
