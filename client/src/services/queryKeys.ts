import type { ArchivedDay } from "@project/shared";

export const eventKeys = {
  all: ["events"] as const,
  week: () => [...eventKeys.all, "week"] as const,
};

export const archiveKeys = {
  all: ["archive"] as const,
  list: (search: string) => [...archiveKeys.all, "list", search] as const,
};

export const googleCalendarKeys = {
  all: ["googleCalendar"] as const,
  forArchivedDay: (day: ArchivedDay) => [...googleCalendarKeys.all, day.year, day.month, day.dayOfMonth] as const,
};
