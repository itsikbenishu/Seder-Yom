ALTER TYPE "public"."reminder_lead" RENAME TO "reminder_timing";--> statement-breakpoint
ALTER TABLE "events" RENAME COLUMN "reminder_lead" TO "reminder_timing";--> statement-breakpoint
ALTER TABLE "events" RENAME CONSTRAINT "events_all_day_reminder_lead" TO "events_all_day_reminder_timing";
