import type { AllDayCalendarEvent, TimedCalendarEvent } from "./calendarEvent";

export interface DayDate {
  yr: number;
  month: number; // 0-11
  day: number; // 1-31
}

export interface DayViewData {
  dayOfWeek: number; // 0-6
  date: DayDate;
  timedEvents: TimedCalendarEvent[]; // sorted by start
  allDayEvents: AllDayCalendarEvent[];
  /** Derived: true only when every timed event for this day has mutedUntilArchive === true. */
  isMuted: boolean;
  /** The nearest upcoming timed event, if any — drives the "Next up" tag. */
  nextUpEventId: string | null;
}

/** ⋯ menu items. "openArchive" navigates; the rest act on this day's events. */
export type DayMenuAction = "toggleMute" | "archiveDay" | "clearDay" | "openArchive";

/** Pending destructive action awaiting the generic confirm dialog (SPEC.md §5 Overlays). */
export type DayConfirmTarget = { kind: "archiveDay" } | { kind: "clearDay" } | { kind: "deleteEvent"; eventId: string };

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
  event: TimedCalendarEvent;
  isNextUp: boolean;
  /** desc/note "show more"/"show less" state, only relevant when combined length > 80 chars. */
  isExpanded: boolean;
  /** false for Google-synced events — never draggable, no edit/delete (SPEC.md §5). */
  isDraggable: boolean;
  onToggleExpand: (eventId: string) => void;
  onMuteToggle: (eventId: string) => void;
  onEdit: (eventId: string) => void;
  onDelete: (eventId: string) => void;
}

export interface AllDayEventRowProps {
  event: AllDayCalendarEvent;
  onOpenDetail: (eventId: string) => void;
}

export interface AllDayEventDetailProps {
  event: AllDayCalendarEvent;
  onClose: () => void;
  onEdit: (eventId: string) => void;
  onDelete: (eventId: string) => void;
}

export interface EventListProps {
  data: DayViewData;
  expandedEventIds: Record<string, boolean>;
  onToggleExpand: (eventId: string) => void;
  onMuteToggleEvent: (eventId: string) => void;
  onEditEvent: (eventId: string) => void;
  onDeleteEvent: (eventId: string) => void;
  onOpenAllDayDetail: (eventId: string) => void;
  onReorder: (eventId: string, newStart: string) => void;
}

/**
 * Top-level Day screen. Navigation (back/prev/next/archive) is owned by the parent
 * (App-level screen switcher) — DayScreen itself derives DayViewData from the shared
 * week-events cache via buildDayViewData, and owns the event form dialog locally
 * (same pattern as its ConfirmDialog/AllDayEventDetail overlays).
 */
export interface DayScreenProps {
  dayOfWeek: number;
  onBackToWeek: () => void;
  onNavigateDay: (dayOfWeek: number) => void;
  onOpenArchive: () => void;
}
