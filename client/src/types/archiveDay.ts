import type { ArchivedDay, GoogleCalendarEvent } from "@project/shared";
import type { AllDayCalendarEvent, TimedCalendarEvent } from "./calendarEvent";

// GoogleCalendarEvent isn't a discriminated union on `allDay` (plain boolean,
// not a `true`/`false` literal split), so it can't be `Extract`-narrowed like
// CalendarEvent — these unions stay loose; partitioning is done by runtime
// filtering on `.allDay` in buildArchiveDayViewData, not by the type system.
export type ArchiveDayTimedEvent = TimedCalendarEvent | GoogleCalendarEvent;
export type ArchiveDayAllDayEvent = AllDayCalendarEvent | GoogleCalendarEvent;

/** Single canonical `gcal` discriminant check — used by every archiveDay row/detail component. */
export function isGoogleCalendarEvent(
  event: ArchiveDayTimedEvent | ArchiveDayAllDayEvent,
): event is GoogleCalendarEvent {
  return "gcal" in event;
}

export interface ArchiveDayViewData {
  day: ArchivedDay;
  timedEvents: ArchiveDayTimedEvent[]; // local snapshot + live-fetched gcal, merged, sorted by start
  allDayEvents: ArchiveDayAllDayEvent[];
}

export interface ArchiveDayHeaderProps {
  day: ArchivedDay;
  onBackToArchive: () => void;
}

export interface ArchiveDayEventRowProps {
  event: ArchiveDayTimedEvent;
  /** desc/note "show more"/"show less" state, only relevant when combined length > 80 chars. */
  isExpanded: boolean;
  onToggleExpand: (eventId: string) => void;
}

export interface ArchiveDayAllDayEventDetailProps {
  event: ArchiveDayAllDayEvent;
  onClose: () => void;
}

export interface ArchiveDayEventListProps {
  data: ArchiveDayViewData;
  expandedEventIds: Record<string, boolean>;
  onToggleExpand: (eventId: string) => void;
  onOpenAllDayDetail: (eventId: string) => void;
}

export interface ArchiveDayScreenProps {
  day: ArchivedDay;
  onBackToArchive: () => void;
}
