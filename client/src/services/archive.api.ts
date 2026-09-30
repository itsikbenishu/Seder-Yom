import { ARCHIVE_PAGE_SIZE, type ArchiveResponseData } from "@project/shared";
import { apiRequest } from "./apiClient";

export interface GetArchiveParams {
  offset: number;
  search?: string;
  date?: string;
  /** Page size override - defaults to ARCHIVE_PAGE_SIZE (used by the copy-from-archive picker's smaller pages). */
  limit?: number;
}

export function getArchive(params: GetArchiveParams): Promise<ArchiveResponseData> {
  const query = new URLSearchParams({
    limit: String(params.limit ?? ARCHIVE_PAGE_SIZE),
    offset: String(params.offset),
  });

  const search = params.search?.trim();
  if (search) {
    query.set("search", search);
  }

  const date = params.date?.trim();
  if (date) {
    query.set("date", date);
  }

  return apiRequest<ArchiveResponseData>(`/archive?${query.toString()}`);
}

export async function deleteArchivedDay(id: string): Promise<void> {
  await apiRequest<null>(`/archive/${id}`, { method: "DELETE" });
}

export async function copyArchivedDayToDay(archivedDayId: string, dayOfWeek: number): Promise<void> {
  await apiRequest<null>(`/archive/${archivedDayId}/copy/${dayOfWeek}`, { method: "POST" });
}
