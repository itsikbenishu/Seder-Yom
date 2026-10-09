import type { GoogleCalendarEvent } from "@project/shared";
import { isGoogleCalendarEvent, type AllDayCalendarEvent, type TimedCalendarEvent } from "./calendarEvent";

export type DayTimedEvent = TimedCalendarEvent | GoogleCalendarEvent;
export type DayAllDayEvent = AllDayCalendarEvent | GoogleCalendarEvent;

// Google all-day events have no reminder fields at all, and a locally-synced one is excluded the
// same way timed Google events are - this is the one canonical check for "sortable/draggable by reminder".
export function hasAllDayReminder(
  event: DayAllDayEvent,
): event is AllDayCalendarEvent & { reminder: true; reminderTime: string } {
  return !isGoogleCalendarEvent(event) && !event.googleCalendarSynced && event.reminder && Boolean(event.reminderTime);
}

export interface DayDate {
  yr: number;
  month: number; // 0-11
  day: number; // 1-31
}

export interface DayViewData {
  dayOfWeek: number; // 0-6
  date: DayDate;
  timedEvents: DayTimedEvent[]; // local + live-fetched gcal, merged, sorted by start
  allDayEvents: DayAllDayEvent[];
  /** Derived: true only when every timed event for this day has mutedUntilArchive === true. */
  isMuted: boolean;
  /** The nearest upcoming timed event, if any - drives the "Next up" tag. */
  nextUpEventId: string | null;
}

/**
 * ⋯ menu items. "openArchive" and "openSettings" navigate to other screens;
 * "copyFromArchive" opens a picker overlay owned by the Day screen itself;
 * the rest act on this day's events.
 */
export type DayMenuAction =
  | "toggleMute"
  | "archiveDay"
  | "clearDay"
  | "openArchive"
  | "copyFromArchive"
  | "openSettings";

/** Pending destructive action for the generic confirm dialog - archiving has its own flow (useArchiveDayFlow). */
export type DayConfirmTarget = { kind: "clearDay" } | { kind: "deleteEvent"; eventId: string };

export interface DayHeaderProps {
  dayOfWeek: number;
  date: DayDate;
  isMuted: boolean;
  onBackToWeek: () => void;
  onPrevDay: () => void;
  onNextDay: () => void;
  onMenuAction: (action: DayMenuAction) => void;
}

export interface EventRowProps {
  event: DayTimedEvent;
  isNextUp: boolean;
  /** desc/note "show more"/"show less" state, only relevant when combined length > 80 chars. */
  isExpanded: boolean;
  /** false for Google-synced events - never draggable, no edit/delete.*/
  isDraggable: boolean;
  onToggleExpand: (eventId: string) => void;
  onMuteToggle: (eventId: string) => void;
  isMuteTogglePending: boolean;
  onEdit: (eventId: string) => void;
  onDelete: (eventId: string) => void;
}

export interface AllDayEventRowProps {
  id: string;
  title: string;
  isSynced: boolean;
  /** true only for local, non-synced events with a reminder - the only ones orderable by reminderTime. */
  isDraggable: boolean;
  onOpenDetail: () => void;
}

export interface AllDayEventDetailProps {
  event: DayAllDayEvent;
  onClose: () => void;
  onEdit: (eventId: string) => void;
  onDelete: (eventId: string) => void;
}

export interface EventListProps {
  data: DayViewData;
  expandedEventIds: Record<string, boolean>;
  onToggleExpand: (eventId: string) => void;
  onMuteToggleEvent: (eventId: string) => void;
  isMuteTogglePending: (eventId: string) => boolean;
  onEditEvent: (eventId: string) => void;
  onDeleteEvent: (eventId: string) => void;
  onSwap: (firstId: string, firstStart: string, firstEnd: string, secondId: string, secondStart: string, secondEnd: string) => void;
}

/**
 * Top-level Day screen. Navigation (back/prev/next/archive) is owned by the parent
 * (App-level screen switcher) - DayScreen itself derives DayViewData from the shared
 * week-events cache via buildDayViewData, and owns the event form dialog locally
 * (same pattern as its ConfirmDialog/AllDayEventDetail overlays).
 */
export interface DayScreenProps {
  dayOfWeek: number;
  onBackToWeek: () => void;
  onNavigateDay: (dayOfWeek: number) => void;
  onOpenArchive: () => void;
  onOpenSettings: () => void;
}
