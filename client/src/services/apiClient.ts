import type { ApiResponse } from "@project/shared";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api/v1";

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  });

  const body = (await response.json()) as ApiResponse<T>;

  if (!body.success) {
    throw new Error(`${body.error.code}: ${body.error.message}`);
  }

  return body.data;
}
