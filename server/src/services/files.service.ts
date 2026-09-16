import { randomUUID } from "node:crypto";
import { eventFileSchema, type EventFile } from "@project/shared";
import { db } from "../db/client.js";
import { eventFiles } from "../db/schema/index.js";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import { supabaseStorageClient } from "../config/supabaseClient.js";
import { AppError, ValidationError } from "../utils/AppError.js";

type EventFileRow = typeof eventFiles.$inferSelect;

const uploadedFileMetaSchema = eventFileSchema.pick({ filename: true, size: true, mimeType: true });

// Storage keys need ASCII-safe names - original filenames (WhatsApp exports especially) can carry
// bidi-control or other characters S3-compatible keys reject; the display `filename` stays untouched.
function toSafeStorageSegment(originalName: string): string {
  const safe = originalName.replace(/[^A-Za-z0-9._-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  return safe || "file";
}

export function toApiEventFile(row: EventFileRow): EventFile {
  return eventFileSchema.parse({
    id: row.id,
    eventId: row.eventId,
    storagePath: row.storagePath,
    filename: row.filename,
    size: row.size,
    mimeType: row.mimeType,
    uploadedAt: row.uploadedAt.toISOString(),
  });
}

export async function removeStorageObjects(storagePaths: string[]): Promise<void> {
  if (storagePaths.length === 0) {
    return;
  }

  const { error } = await supabaseStorageClient.storage.from(env.SUPABASE_STORAGE_BUCKET).remove(storagePaths);
  if (error) {
    logger.error({ storagePaths, error: error.message }, "Failed to remove storage objects");
  }
}

export async function uploadEventFile(userId: string, file: Express.Multer.File): Promise<EventFile> {
  // Busboy (Multer's parser) decodes multipart header fields as latin1 by default, so a UTF-8
  // filename (Hebrew, emoji, etc.) arrives byte-mangled - re-decode it back to the real UTF-8 text.
  const filename = Buffer.from(file.originalname, "latin1").toString("utf8");

  const parsed = uploadedFileMetaSchema.safeParse({
    filename,
    size: file.size,
    mimeType: file.mimetype,
  });
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "validation.invalid");
  }

  const storagePath = `${userId}/${randomUUID()}-${toSafeStorageSegment(filename)}`;

  const { error: uploadError } = await supabaseStorageClient.storage
    .from(env.SUPABASE_STORAGE_BUCKET)
    .upload(storagePath, file.buffer, { contentType: file.mimetype });

  if (uploadError) {
    throw new AppError(502, "STORAGE_UPLOAD_FAILED", uploadError.message);
  }

  try {
    const [row] = await db
      .insert(eventFiles)
      .values({ userId, storagePath, filename, size: file.size, mimeType: file.mimetype })
      .returning();

    return toApiEventFile(row);
  } catch (error) {
    await removeStorageObjects([storagePath]);
    throw error;
  }
}
