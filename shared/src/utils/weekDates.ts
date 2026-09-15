// Events only carry a day-of-week, not an absolute date - the app only
// ever holds the current week's live events (older days move to the archive). These
// helpers resolve dayOfWeek <-> a concrete date in the current week, using JS's own
// Date.getDay() convention (0 = Sunday .. 6 = Saturday), which is what SPEC's
// `dayOfWeek: number (0-6)` maps onto with no other convention specified.
//
// Shared between server (events.service.ts callers) and client (Week view) so both
// sides resolve "today" and day dates identically.

export function dateForDayOfWeek(dayOfWeek: number): Date {
  const now = new Date();
  const date = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  date.setDate(date.getDate() + (dayOfWeek - date.getDay()));
  return date;
}

export function dayOfWeekForDate(date: Date): number {
  return date.getDay();
}

export interface WeekRange {
  start: Date;
  end: Date;
}

export function currentWeekRange(): WeekRange {
  const start = dateForDayOfWeek(0);
  start.setHours(0, 0, 0, 0);

  const end = dateForDayOfWeek(6);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}
