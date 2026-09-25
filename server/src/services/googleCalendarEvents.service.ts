import { eq } from "drizzle-orm";
import { googleCalendarEventSchema, type GoogleCalendarEvent } from "@project/shared";
import { db } from "../db/client.js";
import { googleCalendarTokens } from "../db/schema/index.js";
import { getGoogleOAuthClient } from "../config/googleOAuthClient.js";
import { logger } from "../config/logger.js";
import { AppError } from "../utils/AppError.js";
import { currentWeekRange, dayOfWeekForDate, type WeekRange } from "./weekDates.js";

const REFRESH_MARGIN_MS = 60_000;
const CALENDAR_LIST_URL = "https://www.googleapis.com/calendar/v3/users/me/calendarList";

// The raw wire shape Google's REST API returns - distinct from `GoogleCalendarEvent`
// (the shared/normalized shape our own API returns), which `mapToGoogleCalendarEvent`
// below maps this into.
interface GoogleCalendarApiEvent {
  id: string;
  status?: string;
  summary?: string;
  description?: string;
  start: { date?: string; dateTime?: string };
  end: { date?: string; dateTime?: string };
}

interface GoogleCalendarListEntry {
  id: string;
  selected?: boolean;
  deleted?: boolean;
}

// Refreshes the stored access token when it's missing/expiring soon. Returns undefined
// when the user has never connected (not an error - callers should treat that as "no
// gcal events" rather than surfacing a failure). Throws GOOGLE_CALENDAR_RECONNECT_REQUIRED
// when a stored refresh token is no longer valid (revoked access, or Google's 7-day
// expiry in OAuth consent-screen "Testing" mode) - the row is deleted so /gcal/status
// immereconnectdiately reflects "disconnected".
async function getValidAccessToken(userId: string): Promise<string | undefined> {
  const [row] = await db.select().from(googleCalendarTokens).where(eq(googleCalendarTokens.userId, userId));
  if (!row) {
    return undefined;
  }

  const expiresSoon = Date.now() + REFRESH_MARGIN_MS >= row.accessTokenExpiresAt.getTime();
  if (!expiresSoon) {
    return row.accessToken;
  }

  const client = getGoogleOAuthClient();
  client.setCredentials({ refresh_token: row.refreshToken });

  try {
    const { credentials } = await client.refreshAccessToken();
    if (!credentials.access_token || !credentials.expiry_date) {
      throw new Error("Missing access_token/expiry_date in refresh response");
    }

    await db
      .update(googleCalendarTokens)
      .set({
        accessToken: credentials.access_token,
        refreshToken: credentials.refresh_token ?? row.refreshToken,
        accessTokenExpiresAt: new Date(credentials.expiry_date),
        updatedAt: new Date(),
      })
      .where(eq(googleCalendarTokens.userId, userId));

    return credentials.access_token;
  } catch (error) {
    logger.warn({ userId, err: error }, "Google Calendar token refresh failed - disconnecting");
    await db.delete(googleCalendarTokens).where(eq(googleCalendarTokens.userId, userId));
    throw new AppError(409, "GOOGLE_CALENDAR_RECONNECT_REQUIRED", "Google Calendar connection expired - please reconnect");
  }
}

// Calendar list entries with no explicit `selected` (e.g. the user's own primary calendar
// doesn't always set it) are treated as visible - only an explicit `false` excludes one.
async function listVisibleCalendarIds(accessToken: string): Promise<string[]> {
  const url = new URL(CALENDAR_LIST_URL);
  url.searchParams.set("minAccessRole", "reader");

  const response = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });

  if (!response.ok) {
    throw new AppError(502, "GOOGLE_CALENDAR_API_ERROR", `Google Calendar API request failed (${response.status})`);
  }

  const body = (await response.json()) as { items?: GoogleCalendarListEntry[] };
  return (body.items ?? []).filter((entry) => entry.selected !== false && !entry.deleted).map((entry) => entry.id);
}

// encodeURIComponent is required, not cosmetic - subscribed calendar ids (e.g. the
// "Holidays in Israel" calendar) contain a literal `#`, which truncates the URL as a
// fragment if left unencoded.
function calendarEventsUrl(calendarId: string): string {
  return `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`;
}

async function fetchGoogleEvents(accessToken: string, calendarId: string, range: WeekRange): Promise<GoogleCalendarApiEvent[]> {
  const url = new URL(calendarEventsUrl(calendarId));
  url.searchParams.set("timeMin", range.start.toISOString());
  url.searchParams.set("timeMax", range.end.toISOString());
  url.searchParams.set("singleEvents", "true");
  url.searchParams.set("orderBy", "startTime");

  const response = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });

  if (!response.ok) {
    throw new AppError(502, "GOOGLE_CALENDAR_API_ERROR", `Google Calendar API request failed (${response.status})`);
  }

  const body = (await response.json()) as { items?: GoogleCalendarApiEvent[] };
  return body.items ?? [];
}

function timeStringFromDate(date: Date): string {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

// Pure - no I/O - so it's directly testable with hand-built fixtures. `calendarId` is used
// only for the id prefix - two different calendars can independently mint the same raw id.
export function mapToGoogleCalendarEvent(event: GoogleCalendarApiEvent, calendarId: string): GoogleCalendarEvent {
  if (event.start.date && !event.start.dateTime) {
    const startDate = new Date(`${event.start.date}T00:00:00`);
    return googleCalendarEventSchema.parse({
      id: `gcal_${calendarId}_${event.id}`,
      dayOfWeek: dayOfWeekForDate(startDate),
      title: event.summary ?? "",
      description: event.description,
      start: "00:00",
      end: "23:59",
      allDay: true,
      gcal: true,
    });
  }

  const { dateTime: startDateTime } = event.start;
  const { dateTime: endDateTime } = event.end;
  if (!startDateTime || !endDateTime) {
    throw new AppError(502, "GOOGLE_CALENDAR_API_ERROR", "Google Calendar event is missing a start/end time");
  }

  const startDate = new Date(startDateTime);
  const endDate = new Date(endDateTime);

  return googleCalendarEventSchema.parse({
    id: `gcal_${calendarId}_${event.id}`,
    dayOfWeek: dayOfWeekForDate(startDate),
    title: event.summary ?? "",
    description: event.description,
    start: timeStringFromDate(startDate),
    end: timeStringFromDate(endDate),
    allDay: false,
    gcal: true,
  });
}

async function fetchAndMapGoogleEvents(accessToken: string, range: WeekRange): Promise<GoogleCalendarEvent[]> {
  const calendarIds = await listVisibleCalendarIds(accessToken);

  const results = await Promise.allSettled(
    calendarIds.map((calendarId) =>
      fetchGoogleEvents(accessToken, calendarId, range).then((events) => ({ calendarId, events })),
    ),
  );

  const mapped: GoogleCalendarEvent[] = [];
  for (const result of results) {
    if (result.status === "rejected") {
      logger.warn({ err: result.reason }, "Google Calendar: skipping one calendar after a fetch failure");
      continue;
    }
    const { calendarId, events } = result.value;
    mapped.push(
      ...events.filter((event) => event.status !== "cancelled").map((event) => mapToGoogleCalendarEvent(event, calendarId)),
    );
  }
  return mapped;
}

export async function listGoogleCalendarEvents(userId: string): Promise<GoogleCalendarEvent[]> {
  const accessToken = await getValidAccessToken(userId);
  if (!accessToken) {
    return [];
  }

  return fetchAndMapGoogleEvents(accessToken, currentWeekRange());
}

export async function listGoogleCalendarEventsForDate(userId: string, date: Date): Promise<GoogleCalendarEvent[]> {
  const accessToken = await getValidAccessToken(userId);
  if (!accessToken) {
    return [];
  }

  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  return fetchAndMapGoogleEvents(accessToken, { start, end });
}
