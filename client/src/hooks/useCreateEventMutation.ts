import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateEventInput } from "@project/shared";
import type { CalendarEvent } from "../types/calendarEvent";
import { eventKeys } from "../services/queryKeys";
import { createEvent } from "../services/events.api";

interface CreateEventContext {
  previousEvents: CalendarEvent[] | undefined;
}

// Placeholder shown until the server response replaces it on refetch — id/files/sync are unknowable client-side.
function toOptimisticEvent(input: CreateEventInput, tempId: string): CalendarEvent {
  const { fileIds: _fileIds, ...rest } = input;
  return { ...rest, id: tempId, googleCalendarSynced: false, files: [] } as CalendarEvent;
}

export function useCreateEventMutation() {
  const queryClient = useQueryClient();

  return useMutation<CalendarEvent, Error, CreateEventInput, CreateEventContext>({
    mutationFn: createEvent,
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: eventKeys.week() });

      const previousEvents = queryClient.getQueryData<CalendarEvent[]>(eventKeys.week());
      const optimisticEvent = toOptimisticEvent(input, crypto.randomUUID());

      queryClient.setQueryData<CalendarEvent[]>(eventKeys.week(), (events) => [...(events ?? []), optimisticEvent]);

      return { previousEvents };
    },
    onError: (_error, _input, context) => {
      if (context) {
        queryClient.setQueryData(eventKeys.week(), context.previousEvents);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: eventKeys.week() });
    },
  });
}
