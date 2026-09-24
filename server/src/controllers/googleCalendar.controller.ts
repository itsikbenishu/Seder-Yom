import type { Request, Response } from "express";
import type { GoogleCalendarCallbackQuery, GoogleCalendarEventsQuery } from "@project/shared";
import {
  GOOGLE_CALENDAR_OAUTH_STATE_COOKIE,
  buildConnectUrl,
  disconnectGoogleCalendar,
  exchangeCodeForTokens,
  generateState,
  getGoogleCalendarStatus,
  upsertGoogleCalendarTokens,
} from "../services/googleCalendarAuth.service.js";
import { listGoogleCalendarEvents, listGoogleCalendarEventsForDate } from "../services/googleCalendarEvents.service.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";

const STATE_COOKIE_OPTIONS = {
  httpOnly: true,
  // Mirrors the auth cookie's derivation (auth.controller.ts) - SameSite=None without Secure is rejected by browsers.
  secure: env.NODE_ENV === "production" || env.AUTH_COOKIE_SAME_SITE === "none",
  sameSite: env.AUTH_COOKIE_SAME_SITE,
  path: "/api/v1/gcal",
  maxAge: 5 * 60 * 1000,
};

export function getConnect(_req: Request, res: Response): void {
  const state = generateState();
  res.cookie(GOOGLE_CALENDAR_OAUTH_STATE_COOKIE, state, STATE_COOKIE_OPTIONS);
  res.redirect(buildConnectUrl(state));
}

export async function getCallback(req: Request, res: Response): Promise<void> {
  const { code, state, error } = req.query as unknown as GoogleCalendarCallbackQuery;
  const cookieState = req.cookies?.[GOOGLE_CALENDAR_OAUTH_STATE_COOKIE] as string | undefined;

  res.clearCookie(GOOGLE_CALENDAR_OAUTH_STATE_COOKIE, { path: "/api/v1/gcal" });

  const stateIsValid = Boolean(cookieState) && cookieState === state;
  if (error || !code || !stateIsValid) {
    logger.warn({ correlationId: req.correlationId, error, stateIsValid }, "Google Calendar OAuth callback rejected");
    res.redirect(`${env.CORS_ORIGIN}/?gcal=error`);
    return;
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    await upsertGoogleCalendarTokens(req.userId, tokens);
    res.redirect(`${env.CORS_ORIGIN}/?gcal=connected`);
  } catch (err) {
    logger.error({ correlationId: req.correlationId, err }, "Google Calendar OAuth token exchange failed");
    res.redirect(`${env.CORS_ORIGIN}/?gcal=error`);
  }
}

export async function getStatus(req: Request, res: Response): Promise<void> {
  const status = await getGoogleCalendarStatus(req.userId);
  sendSuccess(res, status);
}

export async function getEvents(req: Request, res: Response): Promise<void> {
  const query = req.query as unknown as GoogleCalendarEventsQuery;
  const events =
    query.year !== undefined && query.month !== undefined && query.day !== undefined
      ? await listGoogleCalendarEventsForDate(req.userId, new Date(query.year, query.month, query.day))
      : await listGoogleCalendarEvents(req.userId);
  sendSuccess(res, events);
}

export async function postDisconnect(req: Request, res: Response): Promise<void> {
  await disconnectGoogleCalendar(req.userId);
  sendSuccess(res, null);
}
