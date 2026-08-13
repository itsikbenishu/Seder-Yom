import { randomUUID } from "node:crypto";
import { eventFileSchema, type EventFile } from "@project/shared";
import { db } from "../db/client.js";
import { eventFiles } from "../db/schema/index.js";
import { env } from "../config/env.js";
import { supabaseStorageClient } from "../config/supabaseClient.js";
import { AppError, ValidationError } from "../utils/AppError.js";

type EventFileRow = typeof eventFiles.$inferSelect;

const uploadedFileMetaSchema = eventFileSchema.pick({ filename: true, size: true, mimeType: true });

function toApiEventFile(row: EventFileRow): EventFile {
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

export async function uploadEventFile(userId: string, file: Express.Multer.File): Promise<EventFile> {
  const parsed = uploadedFileMetaSchema.safeParse({
    filename: file.originalname,
    size: file.size,
    mimeType: file.mimetype,
  });
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "validation.invalid");
  }

  const storagePath = `${userId}/${randomUUID()}-${file.originalname}`;

  const { error: uploadError } = await supabaseStorageClient.storage
    .from(env.SUPABASE_STORAGE_BUCKET)
    .upload(storagePath, file.buffer, { contentType: file.mimetype });

  if (uploadError) {
    throw new AppError(502, "STORAGE_UPLOAD_FAILED", uploadError.message);
  }

  try {
    const [row] = await db
      .insert(eventFiles)
      .values({ userId, storagePath, filename: file.originalname, size: file.size, mimeType: file.mimetype })
      .returning();

    return toApiEventFile(row);
  } catch (error) {
    await supabaseStorageClient.storage.from(env.SUPABASE_STORAGE_BUCKET).remove([storagePath]);
    throw error;
  }
}
