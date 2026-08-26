import type { ApiResponse, EventFile } from "@project/shared";

// Duplicated from apiClient.ts's API_URL rather than importing it: this call must bypass
// `apiRequest` entirely (see below), so there is no shared helper left to import from there.
const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api/v1";

/**
 * Uploads a single picked file immediately (`POST /files/upload`), before the
 * event form is saved. Returns the created `EventFile` row (`eventId: null` until it is
 * attached via `fileIds` on `POST /events` / `PATCH /events/:id`).
 *
 * Deliberately does not go through `apiClient.ts`'s `apiRequest` helper: that helper
 * unconditionally sets `Content-Type: application/json` before spreading `init.headers`,
 * which would override the multipart boundary the browser needs to set itself for a
 * `FormData` body. Calling `fetch` directly here avoids that.
 */
export async function uploadEventFile(file: File): Promise<EventFile> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_URL}/files/upload`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  const body = (await response.json()) as ApiResponse<EventFile>;

  if (!body.success) {
    throw new Error(`${body.error.code}: ${body.error.message}`);
  }

  return body.data;
}
