import type { NextFunction, Request, Response } from "express";
import { MulterError } from "multer";
import { logger } from "../../config/logger.js";
import { AppError } from "../../utils/AppError.js";
import { sendError } from "../../utils/apiResponse.js";

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- Express detects error handlers by arity (4 params)
export function errorHandlerMiddleware(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    logger.warn({ correlationId: req.correlationId, code: err.code }, err.message);
    sendError(res, err.statusCode, err.code, err.message);
    return;
  }

  if (err instanceof MulterError) {
    const message = err.code === "LIMIT_FILE_SIZE" ? "validation.file.size" : "validation.invalid";
    logger.warn({ correlationId: req.correlationId, code: err.code }, err.message);
    sendError(res, 400, "VALIDATION_ERROR", message);
    return;
  }

  logger.error({ err, correlationId: req.correlationId }, "Unhandled error");
  sendError(res, 500, "INTERNAL_ERROR", "Internal server error");
}
