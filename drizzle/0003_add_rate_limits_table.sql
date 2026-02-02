-- Migration: Add rate_limits table for serverless rate limiting
-- This table stores rate limit counters with automatic expiry

CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT PRIMARY KEY,
  window_start TIMESTAMP NOT NULL,
  count INTEGER NOT NULL DEFAULT 1,
  expires_at TIMESTAMP NOT NULL
);

-- Index for cleanup queries
CREATE INDEX IF NOT EXISTS rate_limits_expires_idx ON rate_limits (expires_at);

-- Index for efficient key lookups (already covered by PK, but explicit for clarity)
COMMENT ON TABLE rate_limits IS 'Rate limit counters for API protection. Rows auto-expire based on expires_at.';
