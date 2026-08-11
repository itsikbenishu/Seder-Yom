import type { NextFunction, Request, Response } from "express";
import { ACCESS_TOKEN_COOKIE, getUserIdFromAccessToken } from "../../services/auth.service.js";
import { UnauthorizedError } from "../../utils/AppError.js";

export async function requireAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const token = req.cookies?.[ACCESS_TOKEN_COOKIE] as string | undefined;

  if (!token) {
    throw new UnauthorizedError("Missing access token");
  }

  req.userId = await getUserIdFromAccessToken(token);
  next();
}
