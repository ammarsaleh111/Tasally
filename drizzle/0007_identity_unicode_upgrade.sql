-- Migration: Identity system Unicode upgrade
-- Adds: last_renamed_at for rename cooldown, UNIQUE(user_id) for 1:1 linking
-- Drops: guest_id FK requirement (cookie-based identity instead)

-- 1. Add last_renamed_at column
ALTER TABLE "identities" ADD COLUMN IF NOT EXISTS "last_renamed_at" TIMESTAMPTZ;

-- 2. Add unique constraint on user_id (one identity per account)
--    First drop the non-unique index if it exists
DROP INDEX IF EXISTS "identities_user_id_idx";
CREATE UNIQUE INDEX "identities_user_id_unique_idx" ON "identities" ("user_id") WHERE "user_id" IS NOT NULL;

-- 3. Make guest_id nullable and remove strict FK requirement
--    (identity can exist with just a cookie-based ID, no guest_profiles row needed)
--    guest_id column is already nullable, just ensure the index stays
-- No-op: guest_id is already UUID NULL REFERENCES guest_profiles(id) ON DELETE SET NULL
