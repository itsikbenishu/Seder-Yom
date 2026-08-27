import { useQuery } from "@tanstack/react-query";
import type { UserPreferences } from "@project/shared";
import { preferencesKeys } from "../services/queryKeys";
import { getUserPreferences } from "../services/preferences.api";

export function useUserPreferences() {
  return useQuery<UserPreferences>({
    queryKey: preferencesKeys.detail(),
    queryFn: getUserPreferences,
  });
}
