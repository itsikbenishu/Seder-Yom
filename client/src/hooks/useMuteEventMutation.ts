import { useMutation, useQueryClient } from "@tanstack/react-query";
import { eventKeys } from "../services/queryKeys";
import { updateEvent } from "../services/events.api";
import type { CalendarEvent } from "../types/calendarEvent";

interface MuteEventArgs {
  id: string;
  muted: boolean;
}

interface MuteEventContext {
  previousEvents: CalendarEvent[] | undefined;
}

export function useMuteEventMutation() {
  const queryClient = useQueryClient();

  return useMutation<CalendarEvent, Error, MuteEventArgs, MuteEventContext>({
    mutationFn: ({ id, muted }) => updateEvent({ id, input: { mutedUntilArchive: muted } }),
    onMutate: async ({ id, muted }) => {
      await queryClient.cancelQueries({ queryKey: eventKeys.week() });

      const previousEvents = queryClient.getQueryData<CalendarEvent[]>(eventKeys.week());

      queryClient.setQueryData<CalendarEvent[]>(eventKeys.week(), (events) =>
        events?.map((event) => (event.id === id ? { ...event, mutedUntilArchive: muted } : event))
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
