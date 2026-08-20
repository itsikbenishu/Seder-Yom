import { useMutation, useQueryClient } from "@tanstack/react-query";
import { eventKeys } from "../services/queryKeys";
import { unmuteDay } from "../services/events.api";
import type { CalendarEvent } from "../types/calendarEvent";

interface UnmuteDayContext {
  previousEvents: CalendarEvent[] | undefined;
}

export function useUnmuteDayMutation() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, number, UnmuteDayContext>({
    mutationFn: unmuteDay,
    onMutate: async (dayOfWeek) => {
      await queryClient.cancelQueries({ queryKey: eventKeys.week() });

      const previousEvents = queryClient.getQueryData<CalendarEvent[]>(eventKeys.week());

      queryClient.setQueryData<CalendarEvent[]>(eventKeys.week(), (events) =>
        events?.map((event) =>
          // all-day events have no mute control (SPEC.md), so only timed events are updated
          event.allDay === false && event.dayOfWeek === dayOfWeek
            ? { ...event, mutedUntilArchive: false }
            : event
        )
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
