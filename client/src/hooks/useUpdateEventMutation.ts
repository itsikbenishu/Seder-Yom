import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { EventFile, UpdateEventInput } from "@project/shared";
import { eventKeys } from "../services/queryKeys";
import { updateEvent } from "../services/events.api";
import type { CalendarEvent } from "../types/calendarEvent";

export interface UpdateEventArgs {
  id: string;
  input: UpdateEventInput;
  /** Full attachment metadata for the fileIds in `input` - the optimistic row can't rebuild these from ids alone. */
  files: EventFile[];
}

interface UpdateEventContext {
  previousEvents: CalendarEvent[] | undefined;
}

export function useUpdateEventMutation() {
  const queryClient = useQueryClient();

  return useMutation<CalendarEvent, Error, UpdateEventArgs, UpdateEventContext>({
    mutationFn: ({ id, input }) => updateEvent({ id, input }),
    onMutate: async ({ id, input, files }) => {
      await queryClient.cancelQueries({ queryKey: eventKeys.week() });

      const previousEvents = queryClient.getQueryData<CalendarEvent[]>(eventKeys.week());
      const { fileIds: _fileIds, ...rest } = input;

      queryClient.setQueryData<CalendarEvent[]>(eventKeys.week(), (events) =>
        events?.map((event) => (event.id === id ? ({ ...event, ...rest, files } as CalendarEvent) : event))
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
