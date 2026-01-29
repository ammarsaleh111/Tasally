ALTER TABLE "users" ADD COLUMN "role" text DEFAULT 'USER' NOT NULL;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_seen_at" timestamp;
