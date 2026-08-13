import { z } from "zod";

export const dayOfWeekSchema = z
  .number()
  .int()
  .min(0)
  .max(6);

export const timeStringSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "validation.time.invalid");

export const ALLOWED_FILE_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/csv",
  "text/plain",
] as const;

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
export const MAX_FILES_PER_EVENT = 5;
export const MAX_TOTAL_FILES_SIZE_BYTES = 25 * 1024 * 1024;

export const eventFileSchema = z.object({
  id: z.uuid(),
  eventId: z.uuid().nullable(),
  storagePath: z.string().min(1),
  filename: z.string().min(1, "validation.file.name.required"),
  size: z
    .number()
    .int()
    .positive()
    .max(MAX_FILE_SIZE_BYTES, "validation.file.size"),
  mimeType: z.enum(ALLOWED_FILE_MIME_TYPES, "validation.file.type"),
  uploadedAt: z.iso.datetime(),
});

export type EventFile = z.infer<typeof eventFileSchema>;

export const eventFilesSchema = z
  .array(eventFileSchema)
  .max(MAX_FILES_PER_EVENT, "validation.file.count")
  .superRefine((files, ctx) => {
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    if (totalSize > MAX_TOTAL_FILES_SIZE_BYTES) {
      ctx.addIssue({
        code: "custom",
        message: "validation.file.totalSize",
      });
    }

    const seen = new Set<string>();
    files.forEach((file, index) => {
      const key = `${file.filename}:${file.size}`;
      if (seen.has(key)) {
        ctx.addIssue({
          code: "custom",
          message: "validation.file.duplicate",
          path: [index],
        });
      }
      seen.add(key);
    });
  });
