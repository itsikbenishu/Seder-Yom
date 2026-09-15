import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import type { GoogleCalendarConnectionStatus } from "@project/shared";
import { db } from "../db/client.js";
import { googleCalendarTokens } from "../db/schema/index.js";
import { getGoogleOAuthClient, GOOGLE_CALENDAR_READONLY_SCOPE } from "../config/googleOAuthClient.js";
import { AppError } from "../utils/AppError.js";

export const GOOGLE_CALENDAR_OAUTH_STATE_COOKIE = "google_calendar_oauth_state";

export function generateState(): string {
  return randomBytes(24).toString("hex");
}

export function buildConnectUrl(state: string): string {
  const client = getGoogleOAuthClient();
  return client.generateAuthUrl({
    access_type: "offline",
    // Forces Google to always re-issue a refresh token, not just on the user's
    // very first-ever consent - required for "reconnect" to work reliably.
    prompt: "consent",
    scope: [GOOGLE_CALENDAR_READONLY_SCOPE],
    state,
  });
}

interface ExchangedTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date;
  scope: string;
}

export async function exchangeCodeForTokens(code: string): Promise<ExchangedTokens> {
  const client = getGoogleOAuthClient();
  const { tokens } = await client.getToken(code);

  if (!tokens.access_token || !tokens.expiry_date) {
    throw new AppError(502, "GOOGLE_CALENDAR_API_ERROR", "Google did not return a valid token response");
  }

  return {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token ?? undefined,
    expiresAt: new Date(tokens.expiry_date),
    scope: tokens.scope ?? GOOGLE_CALENDAR_READONLY_SCOPE,
  };
}

export async function upsertGoogleCalendarTokens(userId: string, tokens: ExchangedTokens): Promise<void> {
  const [existing] = await db.select().from(googleCalendarTokens).where(eq(googleCalendarTokens.userId, userId));

  // Google omits refresh_token on a re-consent where one was already issued for this
  // client+user - never overwrite a previously-stored one with undefined.
  const refreshToken = tokens.refreshToken ?? existing?.refreshToken;
  if (!refreshToken) {
    throw new AppError(502, "GOOGLE_CALENDAR_API_ERROR", "Google did not return a refresh token");
  }

  await db
    .insert(googleCalendarTokens)
    .values({
      userId,
      accessToken: tokens.accessToken,
      refreshToken,
      accessTokenExpiresAt: tokens.expiresAt,
      scope: tokens.scope,
    })
    .onConflictDoUpdate({
      target: googleCalendarTokens.userId,
      set: {
        accessToken: tokens.accessToken,
        refreshToken,
        accessTokenExpiresAt: tokens.expiresAt,
        scope: tokens.scope,
        updatedAt: new Date(),
      },
    });
}

export async function getGoogleCalendarStatus(userId: string): Promise<GoogleCalendarConnectionStatus> {
  const [row] = await db.select().from(googleCalendarTokens).where(eq(googleCalendarTokens.userId, userId));

  if (!row) {
    return { connected: false };
  }

  return { connected: true, scope: row.scope, connectedAt: row.connectedAt.toISOString() };
}

export async function disconnectGoogleCalendar(userId: string): Promise<void> {
  await db.delete(googleCalendarTokens).where(eq(googleCalendarTokens.userId, userId));
}
