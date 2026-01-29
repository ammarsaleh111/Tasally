CREATE TABLE "game_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"guest_id" uuid,
	"game_key" text NOT NULL,
	"type" text NOT NULL,
	"score" integer,
	"duration_ms" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "presence_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" uuid,
	"guest_id" uuid,
	"display_name" text,
	"role" text,
	"current_page" text,
	"current_game" text,
	"state" text DEFAULT 'IDLE' NOT NULL,
	"last_heartbeat_at" timestamp NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "display_name" text;--> statement-breakpoint
ALTER TABLE "game_events" ADD CONSTRAINT "game_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_events" ADD CONSTRAINT "game_events_guest_id_guest_profiles_id_fk" FOREIGN KEY ("guest_id") REFERENCES "public"."guest_profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "presence_sessions" ADD CONSTRAINT "presence_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "presence_sessions" ADD CONSTRAINT "presence_sessions_guest_id_guest_profiles_id_fk" FOREIGN KEY ("guest_id") REFERENCES "public"."guest_profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "game_events_game_idx" ON "game_events" USING btree ("game_key","created_at");--> statement-breakpoint
CREATE INDEX "game_events_user_idx" ON "game_events" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "game_events_guest_idx" ON "game_events" USING btree ("guest_id","created_at");--> statement-breakpoint
CREATE INDEX "presence_last_heartbeat_idx" ON "presence_sessions" USING btree ("last_heartbeat_at");--> statement-breakpoint
CREATE INDEX "presence_user_idx" ON "presence_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "presence_guest_idx" ON "presence_sessions" USING btree ("guest_id");