import { z } from "zod";
import { archivedDaySchema } from "./archivedDay.schema.js";

export const ARCHIVE_PAGE_SIZE = 50;

export const archiveQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(ARCHIVE_PAGE_SIZE).default(ARCHIVE_PAGE_SIZE),
  offset: z.coerce.number().int().nonnegative().default(0),
  search: z.string().optional(),
});

// Set only to resolve a day that was already archived for this calendar date: "merge" adds the
// newly archived events to the existing snapshot, "overwrite" replaces it entirely. Omitted, the
// request fails with ARCHIVE_ALREADY_EXISTS so the client can ask the user which one they want.
export const archiveConflictResolutionSchema = z.enum(["merge", "overwrite"]);
export const archiveDayQuerySchema = z.object({
  onConflict: archiveConflictResolutionSchema.optional(),
});

export const archiveResponseDataSchema = z.object({
  days: z.array(archivedDaySchema),
  total_count: z.number().int().nonnegative(),
  has_more: z.boolean(),
});

export type ArchiveQuery = z.infer<typeof archiveQuerySchema>;
export type ArchiveConflictResolution = z.infer<typeof archiveConflictResolutionSchema>;
export type ArchiveDayQuery = z.infer<typeof archiveDayQuerySchema>;
export type ArchiveResponseData = z.infer<typeof archiveResponseDataSchema>;
