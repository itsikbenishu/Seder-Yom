import { DayCard } from "./DayCard";
import type { WeekGridProps } from "../../../types/week";

export function WeekGrid({ days, onSelectDay, onMuteDay, onAddEvent, onArchiveDay, isMutePending }: WeekGridProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
      {days.map((day) => (
        <DayCard
          key={day.dayOfWeek}
          day={day}
          onSelect={onSelectDay}
          onMuteDay={onMuteDay}
          onAddEvent={onAddEvent}
          onArchiveDay={onArchiveDay}
          isMutePending={isMutePending(day.dayOfWeek)}
        />
      ))}
    </div>
  );
}
