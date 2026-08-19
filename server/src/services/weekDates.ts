// Pure date-math for resolving dayOfWeek <-> a concrete date in the current week now
// lives in shared/ (client's Week view needs the same logic). Re-exported here so the
// existing importers (archive.service.ts, googleCalendarEvents.service.ts, reminderTime.ts)
// don't need to change.
export { dateForDayOfWeek, dayOfWeekForDate, currentWeekRange } from "@project/shared";
export type { WeekRange } from "@project/shared";
