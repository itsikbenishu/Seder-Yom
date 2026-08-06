import { z } from "zod";
import { archivedDaySchema } from "./archivedDay.schema.js";

export const ARCHIVE_PAGE_SIZE = 50;

export const archiveQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(ARCHIVE_PAGE_SIZE).default(ARCHIVE_PAGE_SIZE),
  offset: z.coerce.number().int().nonnegative().default(0),
  search: z.string().optional(),
});

export const archiveResponseDataSchema = z.object({
  days: z.array(archivedDaySchema),
  total_count: z.number().int().nonnegative(),
  has_more: z.boolean(),
});

export type ArchiveQuery = z.infer<typeof archiveQuerySchema>;
export type ArchiveResponseData = z.infer<typeof archiveResponseDataSchema>;
