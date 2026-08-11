import { supabaseAuthClient } from "../config/supabaseClient.js";
import { AppError, UnauthorizedError } from "../utils/AppError.js";

export const ACCESS_TOKEN_COOKIE = "access_token";

export async function login(email: string): Promise<void> {
  const { error } = await supabaseAuthClient.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true },
  });

  if (error) {
    throw new AppError(error.status ?? 400, "AUTH_LOGIN_FAILED", error.message);
  }
}

export async function verify(email: string, code: string): Promise<{ accessToken: string; expiresIn: number }> {
  const { data, error } = await supabaseAuthClient.auth.verifyOtp({
    email,
    token: code,
    type: "email",
  });

  if (error || !data.session) {
    throw new UnauthorizedError("Invalid or expired code");
  }

  return { accessToken: data.session.access_token, expiresIn: data.session.expires_in };
}

export async function getUserIdFromAccessToken(accessToken: string): Promise<string> {
  const { data, error } = await supabaseAuthClient.auth.getUser(accessToken);

  if (error || !data.user) {
    throw new UnauthorizedError("Invalid or expired session");
  }

  return data.user.id;
}
