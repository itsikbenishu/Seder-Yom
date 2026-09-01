import { Router } from "express";
import multer, { type FileFilterCallback } from "multer";
import type { Request } from "express";
import { ALLOWED_FILE_MIME_TYPES, MAX_FILE_SIZE_BYTES } from "@project/shared";
import { postFileUpload } from "../controllers/files.controller.js";
import { rateLimitMiddleware } from "./middlewares/rateLimit.middleware.js";
import { requireAuth } from "./middlewares/requireAuth.middleware.js";
import { ValidationError } from "../utils/AppError.js";

const allowedMimeTypes: readonly string[] = ALLOWED_FILE_MIME_TYPES;

function fileFilter(_req: Request, file: Express.Multer.File, callback: FileFilterCallback): void {
  if (!allowedMimeTypes.includes(file.mimetype)) {
    callback(new ValidationError("validation.file.type"));
    return;
  }
  callback(null, true);
}

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_FILE_SIZE_BYTES }, fileFilter });

export const filesRouter = Router();

filesRouter.use(requireAuth);
filesRouter.use(rateLimitMiddleware);

filesRouter.post("/upload", upload.single("file"), postFileUpload);
