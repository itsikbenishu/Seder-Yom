import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateEventInput } from "@project/shared";
import type { CalendarEvent } from "../types/calendarEvent";
import { eventKeys } from "../services/queryKeys";
import { createEvent } from "../services/events.api";

// Server generates the id and resolves fileIds — can't guess the result, just refetch on success.
export function useCreateEventMutation() {
  const queryClient = useQueryClient();

  return useMutation<CalendarEvent, Error, CreateEventInput>({
    mutationFn: createEvent,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: eventKeys.week() });
    },
  });
}
