import type { UpdateUserPreferencesInput, UserPreferences } from "@project/shared";
import { apiRequest } from "./apiClient";

export function getUserPreferences(): Promise<UserPreferences> {
  return apiRequest<UserPreferences>("/preferences");
}

export function updateUserPreferences(input: UpdateUserPreferencesInput): Promise<UserPreferences> {
  return apiRequest<UserPreferences>("/preferences", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
