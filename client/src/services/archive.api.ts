import { ARCHIVE_PAGE_SIZE, type ArchiveResponseData } from "@project/shared";
import { apiRequest } from "./apiClient";

export interface GetArchiveParams {
  offset: number;
}

export function getArchive(params: GetArchiveParams): Promise<ArchiveResponseData> {
  const query = new URLSearchParams({
    limit: String(ARCHIVE_PAGE_SIZE),
    offset: String(params.offset),
  });

  return apiRequest<ArchiveResponseData>(`/archive?${query.toString()}`);
}
