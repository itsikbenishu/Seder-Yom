CREATE TYPE "public"."app_language" AS ENUM('he', 'en');--> statement-breakpoint
CREATE TYPE "public"."app_theme" AS ENUM('light', 'dark', 'system');--> statement-breakpoint
ALTER TABLE "notification_preferences" RENAME TO "user_preferences";--> statement-breakpoint
ALTER TABLE "user_preferences" RENAME CONSTRAINT "notification_preferences_user_id_users_id_fk" TO "user_preferences_user_id_users_id_fk";--> statement-breakpoint
ALTER POLICY "notification_preferences_crud_own_row" ON "user_preferences" RENAME TO "user_preferences_crud_own_row";--> statement-breakpoint
ALTER TABLE "user_preferences" ADD COLUMN "language" "app_language" NOT NULL DEFAULT 'he';--> statement-breakpoint
ALTER TABLE "user_preferences" ADD COLUMN "theme" "app_theme" NOT NULL DEFAULT 'system';
