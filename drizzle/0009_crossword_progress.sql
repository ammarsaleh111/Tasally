-- Migration: Add crossword progress persistence for authenticated users

CREATE TABLE IF NOT EXISTS crossword_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  puzzle_date DATE NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS crossword_progress_user_date_idx
  ON crossword_progress (user_id, puzzle_date);

CREATE INDEX IF NOT EXISTS crossword_progress_user_updated_idx
  ON crossword_progress (user_id, updated_at DESC);

COMMENT ON TABLE crossword_progress IS 'Autosave payloads for authenticated crossword players by Cairo date.';
