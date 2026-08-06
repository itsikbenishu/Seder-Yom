import { randomUUID } from "node:crypto";
import type { NextFunction, Request, Response } from "express";

const CORRELATION_ID_HEADER = "x-correlation-id";

export function correlationIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const incoming = req.header(CORRELATION_ID_HEADER);
  const correlationId = incoming && incoming.length > 0 ? incoming : randomUUID();

  req.correlationId = correlationId;
  res.setHeader(CORRELATION_ID_HEADER, correlationId);
  next();
}
