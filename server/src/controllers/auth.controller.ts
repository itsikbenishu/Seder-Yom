import type { Request, Response } from "express";
import type { LoginRequestInput, VerifyRequestInput } from "@project/shared";
import { ACCESS_TOKEN_COOKIE, login, verify } from "../services/auth.service.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { env } from "../config/env.js";

export async function postLogin(req: Request, res: Response): Promise<void> {
  const { email } = req.body as LoginRequestInput;
  await login(email);
  sendSuccess(res, null);
}

export async function postVerify(req: Request, res: Response): Promise<void> {
  const { email, code } = req.body as VerifyRequestInput;
  const { accessToken, expiresIn } = await verify(email, code);

  res.cookie(ACCESS_TOKEN_COOKIE, accessToken, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: env.NODE_ENV === "production" ? "lax" : "none",
    path: "/",
    maxAge: expiresIn * 1000,
  });

  sendSuccess(res, null);
}
