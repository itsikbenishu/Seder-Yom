ALTER TYPE "public"."reminder_timing" RENAME TO "reminder_mode";--> statement-breakpoint
ALTER TABLE "events" RENAME COLUMN "reminder_timing" TO "reminder_mode";--> statement-breakpoint
ALTER TABLE "events" RENAME CONSTRAINT "events_all_day_reminder_timing" TO "events_all_day_reminder_mode";--> statement-breakpoint
ALTER TABLE "events" RENAME COLUMN "reminder_clock_time" TO "reminder_time";
