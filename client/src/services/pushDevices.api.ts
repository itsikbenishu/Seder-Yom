import type { DevicePlatform } from "@project/shared";
import { apiRequest } from "./apiClient";

// Last token we successfully registered with the backend - lets the hook skip a
// redundant POST on every load, and the sign-out flow know what to remove.
export const PUSH_TOKEN_STORAGE_KEY = "sy.push.token";

export function registerPushDevice(input: { token: string; platform: DevicePlatform }): Promise<null> {
  return apiRequest<null>("/devices", { method: "POST", body: JSON.stringify(input) });
}

export function unregisterPushDevice(token: string): Promise<null> {
  return apiRequest<null>("/devices", { method: "DELETE", body: JSON.stringify({ token }) });
}

// Best-effort: called while still authenticated, just before sign-out.
export async function clearPushRegistration(): Promise<void> {
  const token = localStorage.getItem(PUSH_TOKEN_STORAGE_KEY);
  if (!token) return;
  localStorage.removeItem(PUSH_TOKEN_STORAGE_KEY);
  try {
    await unregisterPushDevice(token);
  } catch {
    // token row is orphaned server-side; the worker prunes it on the next failed send
  }
}
