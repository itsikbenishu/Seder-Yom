CREATE TYPE "public"."event_frequency" AS ENUM('once', 'daily', 'weekly');--> statement-breakpoint
CREATE TYPE "public"."reminder_lead" AS ENUM('15m', '30m', '1h', '1d', 'time');--> statement-breakpoint
CREATE TYPE "public"."notification_channel" AS ENUM('browser', 'mobile');--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"day_of_week" smallint NOT NULL,
	"title" varchar(80) NOT NULL,
	"description" varchar(200),
	"note" varchar(500),
	"start" time NOT NULL,
	"end" time NOT NULL,
	"all_day" boolean DEFAULT false NOT NULL,
	"frequency" "event_frequency" NOT NULL,
	"reminder" boolean DEFAULT false NOT NULL,
	"reminder_lead" "reminder_lead",
	"reminder_lead_time" time,
	"files" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"google_calendar_synced" boolean DEFAULT false NOT NULL,
	CONSTRAINT "events_day_of_week_range" CHECK ("events"."day_of_week" >= 0 AND "events"."day_of_week" <= 6),
	CONSTRAINT "events_all_day_frequency" CHECK ("events"."all_day" = false OR "events"."frequency" <> 'once'),
	CONSTRAINT "events_all_day_reminder_lead" CHECK ("events"."all_day" = false OR "events"."reminder_lead" IS NULL OR "events"."reminder_lead" = 'time')
);
--> statement-breakpoint
ALTER TABLE "events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "archived_days" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"day_of_week" smallint NOT NULL,
	"month" smallint NOT NULL,
	"day_of_month" smallint NOT NULL,
	"year" smallint NOT NULL,
	"summary" text NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"events" jsonb DEFAULT '[]'::jsonb NOT NULL,
	CONSTRAINT "archived_days_day_of_week_range" CHECK ("archived_days"."day_of_week" >= 0 AND "archived_days"."day_of_week" <= 6),
	CONSTRAINT "archived_days_month_range" CHECK ("archived_days"."month" >= 0 AND "archived_days"."month" <= 11),
	CONSTRAINT "archived_days_day_of_month_range" CHECK ("archived_days"."day_of_month" >= 1 AND "archived_days"."day_of_month" <= 31)
);
--> statement-breakpoint
ALTER TABLE "archived_days" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "notification_preferences" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"reminder_enabled" boolean DEFAULT true NOT NULL,
	"channels" "notification_channel"[] DEFAULT '{"browser"}' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "notification_preferences" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "archived_days" ADD CONSTRAINT "archived_days_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "events_user_day_idx" ON "events" USING btree ("user_id","day_of_week");--> statement-breakpoint
CREATE INDEX "archived_days_user_year_month_day_idx" ON "archived_days" USING btree ("user_id" DESC NULLS LAST,"year" DESC NULLS LAST,"month" DESC NULLS LAST,"day_of_month" DESC NULLS LAST);--> statement-breakpoint
CREATE UNIQUE INDEX "archived_days_user_year_month_day_unique" ON "archived_days" USING btree ("user_id","year","month","day_of_month");--> statement-breakpoint
CREATE POLICY "events_crud_own_rows" ON "events" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select auth.uid()) = "events"."user_id") WITH CHECK ((select auth.uid()) = "events"."user_id");--> statement-breakpoint
CREATE POLICY "archived_days_crud_own_rows" ON "archived_days" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select auth.uid()) = "archived_days"."user_id") WITH CHECK ((select auth.uid()) = "archived_days"."user_id");--> statement-breakpoint
CREATE POLICY "notification_preferences_crud_own_row" ON "notification_preferences" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select auth.uid()) = "notification_preferences"."user_id") WITH CHECK ((select auth.uid()) = "notification_preferences"."user_id");