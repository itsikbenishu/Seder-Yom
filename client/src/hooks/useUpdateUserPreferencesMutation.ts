import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { UpdateUserPreferencesInput, UserPreferences } from "@project/shared";
import { preferencesKeys } from "../services/queryKeys";
import { updateUserPreferences } from "../services/preferences.api";

interface MutationContext {
  previous?: UserPreferences;
}

export function useUpdateUserPreferencesMutation() {
  const queryClient = useQueryClient();

  return useMutation<UserPreferences, Error, UpdateUserPreferencesInput, MutationContext>({
    mutationFn: updateUserPreferences,
    onMutate: async (patch) => {
      await queryClient.cancelQueries({ queryKey: preferencesKeys.detail() });
      const previous = queryClient.getQueryData<UserPreferences>(preferencesKeys.detail());
      if (previous) {
        queryClient.setQueryData<UserPreferences>(preferencesKeys.detail(), { ...previous, ...patch });
      }
      return { previous };
    },
    onError: (_error, _patch, context) => {
      if (context?.previous) {
        queryClient.setQueryData(preferencesKeys.detail(), context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: preferencesKeys.detail() });
    },
  });
}
