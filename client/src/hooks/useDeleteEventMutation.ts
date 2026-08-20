import { useMutation, useQueryClient } from "@tanstack/react-query";
import { eventKeys } from "../services/queryKeys";
import { deleteEvent } from "../services/events.api";
import type { CalendarEvent } from "../types/calendarEvent";

interface DeleteEventContext {
  previousEvents: CalendarEvent[] | undefined;
}

export function useDeleteEventMutation() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string, DeleteEventContext>({
    mutationFn: deleteEvent,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: eventKeys.week() });

      const previousEvents = queryClient.getQueryData<CalendarEvent[]>(eventKeys.week());

      queryClient.setQueryData<CalendarEvent[]>(eventKeys.week(), (events) =>
        events?.filter((event) => event.id !== id)
      );

      return { previousEvents };
    },
    onError: (_error, _id, context) => {
      if (context) {
        queryClient.setQueryData(eventKeys.week(), context.previousEvents);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: eventKeys.week() });
    },
  });
}
