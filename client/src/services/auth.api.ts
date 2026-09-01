import { apiRequest } from "./apiClient";

export async function login(email: string): Promise<void> {
  await apiRequest<null>("/auth/login", { method: "POST", body: JSON.stringify({ email }) });
}

export async function signOut(): Promise<void> {
  await apiRequest<null>("/auth/logout", { method: "POST" });
}
