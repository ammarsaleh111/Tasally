-- Migration: Add unique constraint for daily game submissions
-- Prevents duplicate daily scores per user/guest per game per day

-- For authenticated users: one daily submission per game per day
CREATE UNIQUE INDEX IF NOT EXISTS game_results_user_daily_unique_idx 
ON game_results (user_id, game_key, day_key, mode) 
WHERE user_id IS NOT NULL AND mode = 'daily';

-- For guests: one daily submission per game per day  
CREATE UNIQUE INDEX IF NOT EXISTS game_results_guest_daily_unique_idx 
ON game_results (guest_id, game_key, day_key, mode) 
WHERE guest_id IS NOT NULL AND mode = 'daily';

-- Add idempotency_key column for replay protection
ALTER TABLE game_results ADD COLUMN IF NOT EXISTS idempotency_key TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS game_results_idempotency_idx 
ON game_results (idempotency_key) 
WHERE idempotency_key IS NOT NULL;

COMMENT ON COLUMN game_results.idempotency_key IS 'Optional client-provided key to prevent duplicate submissions';
