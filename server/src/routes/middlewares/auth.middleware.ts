import type { NextFunction, Request, Response } from "express";
import { AppError } from "../../utils/AppError.js";

// TEMPORARY: reads the authenticated user from an `x-user-id` header so the
// events endpoints are testable before Login/2FA + JWT-in-httpOnly-cookie auth
// exists (SPEC.md §10). Replace with real JWT verification once that's built —
// per CLAUDE.md's build order, auth is the last backend layer.
export function authMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const userId = req.header("x-user-id");

  if (!userId) {
    throw new AppError(401, "UNAUTHENTICATED", "Missing x-user-id header");
  }

  req.userId = userId;
  next();
}
