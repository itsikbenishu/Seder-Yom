import type { CookieOptions, Request, Response } from "express";
import type { LoginRequestInput, VerifyRequestInput } from "@project/shared";
import { ACCESS_TOKEN_COOKIE, login, verify } from "../services/auth.service.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { env } from "../config/env.js";

// SameSite=None without Secure gets silently dropped by browsers; Lax works fine here.
const authCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
};

export async function postLogin(req: Request, res: Response): Promise<void> {
  const { email } = req.body as LoginRequestInput;
  await login(email);
  sendSuccess(res, null);
}

export async function postVerify(req: Request, res: Response): Promise<void> {
  const { email, code } = req.body as VerifyRequestInput;
  const { accessToken, expiresIn } = await verify(email, code);

  res.cookie(ACCESS_TOKEN_COOKIE, accessToken, { ...authCookieOptions, maxAge: expiresIn * 1000 });

  sendSuccess(res, null);
}

export function postLogout(_req: Request, res: Response): void {
  res.clearCookie(ACCESS_TOKEN_COOKIE, authCookieOptions);
  sendSuccess(res, null);
}
