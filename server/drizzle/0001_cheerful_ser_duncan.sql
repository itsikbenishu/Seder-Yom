CREATE TABLE "google_calendar_tokens" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"access_token" text NOT NULL,
	"refresh_token" text NOT NULL,
	"access_token_expires_at" timestamp NOT NULL,
	"scope" text NOT NULL,
	"connected_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "google_calendar_tokens" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "google_calendar_tokens" ADD CONSTRAINT "google_calendar_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "google_calendar_tokens_crud_own_row" ON "google_calendar_tokens" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select auth.uid()) = "google_calendar_tokens"."user_id") WITH CHECK ((select auth.uid()) = "google_calendar_tokens"."user_id");