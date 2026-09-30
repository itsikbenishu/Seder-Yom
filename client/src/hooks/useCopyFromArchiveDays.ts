import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";
import { copyFromArchiveKeys } from "../services/queryKeys";
import { getArchive } from "../services/archive.api";
import { useDebouncedValue } from "./useDebouncedValue";
import type { CopyFromArchiveViewData } from "../types/copyFromArchive";

const COPY_PICKER_PAGE_SIZE = 20;

export interface UseCopyFromArchiveDaysResult {
  data: CopyFromArchiveViewData;
  fetchMore: () => void;
}

/**
 * List-fetching hook for the copy-from-archive picker. Unlike useArchiveDays, there is no
 * client-side reveal window - the 20-item server page size IS the render/fetch step, and
 * resetting on open is handled by the picker unmounting/remounting (fresh hook state);
 * resetting on filter change happens for free since the query key changes with it.
 */
export function useCopyFromArchiveDays(search: string, date: string): UseCopyFromArchiveDaysResult {
  const debouncedSearch = useDebouncedValue(search.trim(), 300);

  const { data, hasNextPage, isFetchingNextPage, isPending, isFetching, isPlaceholderData, fetchNextPage } = useInfiniteQuery({
    queryKey: copyFromArchiveKeys.list(debouncedSearch, date),
    queryFn: ({ pageParam }) =>
      getArchive({ offset: pageParam, search: debouncedSearch, date, limit: COPY_PICKER_PAGE_SIZE }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((sum, page) => sum + page.days.length, 0);
      return lastPage.has_more ? loaded : undefined;
    },
    placeholderData: keepPreviousData,
  });

  const days = data?.pages.flatMap((page) => page.days) ?? [];

  // Fetching this key means cached data may be stale; isPlaceholderData excludes keepPreviousData's cross-search case.
  const isResolvingFirstPage = isPending || (isFetching && !isFetchingNextPage && !isPlaceholderData);

  function fetchMore(): void {
    if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
  }

  return {
    data: {
      days,
      hasMore: Boolean(hasNextPage),
      isLoadingMore: isFetchingNextPage,
      isPending: isResolvingFirstPage,
    },
    fetchMore,
  };
}
