import { useMutation, useQueryClient } from "@tanstack/react-query";
import { eventKeys } from "../services/queryKeys";
import { clearDay } from "../services/events.api";
import type { CalendarEvent } from "../types/calendarEvent";

interface ClearDayContext {
  previousEvents: CalendarEvent[] | undefined;
}

// Google-synced events are excluded server-side (same as archiveDay) — they
// stay in the cache untouched, only local events for this dayOfWeek are optimistically removed.
export function useClearDayMutation() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, number, ClearDayContext>({
    mutationFn: clearDay,
    onMutate: async (dayOfWeek) => {
      await queryClient.cancelQueries({ queryKey: eventKeys.week() });

      const previousEvents = queryClient.getQueryData<CalendarEvent[]>(eventKeys.week());

      queryClient.setQueryData<CalendarEvent[]>(eventKeys.week(), (events) =>
        events?.filter((event) => event.dayOfWeek !== dayOfWeek || event.googleCalendarSynced)
      );

      return { previousEvents };
    },
    onError: (_error, _dayOfWeek, context) => {
      if (context) {
        queryClient.setQueryData(eventKeys.week(), context.previousEvents);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: eventKeys.week() });
    },
  });
}
