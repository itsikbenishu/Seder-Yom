import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateEventInput, EventFile } from "@project/shared";
import type { CalendarEvent } from "../types/calendarEvent";
import { eventKeys } from "../services/queryKeys";
import { createEvent } from "../services/events.api";

export interface CreateEventArgs {
  input: CreateEventInput;
  /** Already-uploaded files' full metadata - fileIds alone can't rebuild these for the optimistic row. */
  files: EventFile[];
}

interface CreateEventContext {
  previousEvents: CalendarEvent[] | undefined;
}

// Placeholder shown until the server response replaces it on refetch - id/sync are unknowable client-side.
function toOptimisticEvent(input: CreateEventInput, files: EventFile[], tempId: string): CalendarEvent {
  const { fileIds: _fileIds, ...rest } = input;
  return { ...rest, id: tempId, googleCalendarSynced: false, files } as CalendarEvent;
}

export function useCreateEventMutation() {
  const queryClient = useQueryClient();

  return useMutation<CalendarEvent, Error, CreateEventArgs, CreateEventContext>({
    mutationFn: ({ input }) => createEvent(input),
    onMutate: async ({ input, files }) => {
      await queryClient.cancelQueries({ queryKey: eventKeys.week() });

      const previousEvents = queryClient.getQueryData<CalendarEvent[]>(eventKeys.week());
      const optimisticEvent = toOptimisticEvent(input, files, crypto.randomUUID());

      queryClient.setQueryData<CalendarEvent[]>(eventKeys.week(), (events) => [...(events ?? []), optimisticEvent]);

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
