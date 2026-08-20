import { useMutation, useQueryClient } from "@tanstack/react-query";
import { eventKeys } from "../services/queryKeys";
import { updateEvent, type UpdateEventArgs } from "../services/events.api";
import type { CalendarEvent } from "../types/calendarEvent";

interface UpdateEventContext {
  previousEvents: CalendarEvent[] | undefined;
}

export function useUpdateEventMutation() {
  const queryClient = useQueryClient();

  return useMutation<CalendarEvent, Error, UpdateEventArgs, UpdateEventContext>({
    mutationFn: updateEvent,
    onMutate: async ({ id, input }) => {
      await queryClient.cancelQueries({ queryKey: eventKeys.week() });

      const previousEvents = queryClient.getQueryData<CalendarEvent[]>(eventKeys.week());

      queryClient.setQueryData<CalendarEvent[]>(eventKeys.week(), (events) =>
        events?.map((event) => (event.id === id ? ({ ...event, ...input } as CalendarEvent) : event))
      );

      return { previousEvents };
    },
    onError: (_error, _variables, context) => {
      if (context) {
        queryClient.setQueryData(eventKeys.week(), context.previousEvents);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: eventKeys.week() });
    },
  });
}
