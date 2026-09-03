import type { CalendarEvent } from "./calendarEvent";

export interface WeekDayDate {
  yr: number;
  month: number; // 0-11
  day: number; // 1-31
}

export interface WeekDay {
  dayOfWeek: number; // 0-6
  date: WeekDayDate;
  isToday: boolean;
  /** Derived: true only when every timed event for this day has mutedUntilArchive === true. */
  isMuted: boolean;
  events: CalendarEvent[];
  nearestEvent: CalendarEvent | null;
}

export interface WeekRange {
  start: Date;
  end: Date;
}

export interface WeekViewData {
  weekRange: WeekRange;
  days: WeekDay[];
}

export interface WeekGridProps {
  days: WeekDay[];
  onSelectDay: (dayOfWeek: number) => void;
  onMuteDay: (dayOfWeek: number) => void;
  onAddEvent: (dayOfWeek: number) => void;
  onArchiveDay: (dayOfWeek: number) => void;
  isMutePending: (dayOfWeek: number) => boolean;
}

export interface DayCardProps {
  day: WeekDay;
  onSelect: (dayOfWeek: number) => void;
  onMuteDay: (dayOfWeek: number) => void;
  onAddEvent: (dayOfWeek: number) => void;
  onArchiveDay: (dayOfWeek: number) => void;
  isMutePending: boolean;
}
