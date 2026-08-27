import { apiRequest } from "./apiClient";

export async function signOut(): Promise<void> {
  await apiRequest<null>("/auth/logout", { method: "POST" });
}
