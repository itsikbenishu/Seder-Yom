import type { Request, Response } from "express";
import { uploadEventFile } from "../services/files.service.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { ValidationError } from "../utils/AppError.js";

export async function postFileUpload(req: Request, res: Response): Promise<void> {
  if (!req.file) {
    throw new ValidationError("validation.file.required");
  }

  const result = await uploadEventFile(req.userId, req.file);
  sendSuccess(res, result, 201);
}
