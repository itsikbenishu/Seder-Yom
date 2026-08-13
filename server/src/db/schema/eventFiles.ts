import { pgTable, uuid, text, integer, timestamp, index, uniqueIndex, pgPolicy } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { authUsers, authenticatedRole, authUid } from "drizzle-orm/supabase";
import { events } from "./events.js";

export const eventFiles = pgTable("event_files", {
  id: uuid().primaryKey().defaultRandom(),
  userId: uuid().notNull().references(() => authUsers.id, { onDelete: "cascade" }),
  // null = uploaded but not yet attached to a saved event
  eventId: uuid().references(() => events.id, { onDelete: "cascade" }),
  storagePath: text().notNull(),
  filename: text().notNull(),
  size: integer().notNull(),
  mimeType: text().notNull(),
  uploadedAt: timestamp().notNull().defaultNow(),
}, (t) => [
  index("event_files_user_idx").on(t.userId),
  index("event_files_event_idx").on(t.eventId),
  uniqueIndex("event_files_event_filename_size_unique").on(t.eventId, t.filename, t.size),
  pgPolicy("event_files_crud_own_rows", {
    for: "all",
    to: authenticatedRole,
    using: sql`${authUid} = ${t.userId}`,
    withCheck: sql`${authUid} = ${t.userId}`,
  }),
]).enableRLS();
