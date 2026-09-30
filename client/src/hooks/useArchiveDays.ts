import { useState } from "react";
import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";
import { archiveKeys } from "../services/queryKeys";
import { getArchive } from "../services/archive.api";
import { useDebouncedValue } from "./useDebouncedValue";
import type { ArchiveViewData } from "../types/archive";

const REVEAL_STEP = 12;

export interface UseArchiveDaysResult {
  data: ArchiveViewData;
  revealMore: () => void;
}

export function useArchiveDays(search: string, date: string): UseArchiveDaysResult {
  const [revealCount, setRevealCount] = useState(REVEAL_STEP);
  const revealResetKeyValue = `${search}|${date}`;
  const [revealResetKey, setRevealResetKey] = useState(revealResetKeyValue);

  // Resets the reveal window on search/date change - derived during render so it's not one render late.
  if (revealResetKey !== revealResetKeyValue) {
    setRevealResetKey(revealResetKeyValue);
    setRevealCount(REVEAL_STEP);
  }

  const debouncedSearch = useDebouncedValue(search.trim(), 300);

  const { data, hasNextPage, isFetchingNextPage, isPending, isFetching, isPlaceholderData, fetchNextPage } = useInfiniteQuery({
    queryKey: archiveKeys.list(debouncedSearch, date),
    queryFn: ({ pageParam }) => getArchive({ offset: pageParam, search: debouncedSearch, date }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((sum, page) => sum + page.days.length, 0);
      return lastPage.has_more ? loaded : undefined;
    },
    placeholderData: keepPreviousData,
  });

  const flattenedDays = data?.pages.flatMap((page) => page.days) ?? [];

  const trimmedSearch = search.trim().toLowerCase();
  const filteredDays =
    trimmedSearch === ""
      ? flattenedDays
      : flattenedDays.filter((day) => day.summary.toLowerCase().includes(trimmedSearch));

  const revealedDays = filteredDays.slice(0, revealCount);

  // Fetching this key means cached data may be stale; isPlaceholderData excludes keepPreviousData's cross-search case.
  const isResolvingFirstPage = isPending || (isFetching && !isFetchingNextPage && !isPlaceholderData);

  function revealMore(): void {
    const nextRevealCount = revealCount + REVEAL_STEP;
    setRevealCount(nextRevealCount);

    const shouldFetchMore =
      nextRevealCount >= filteredDays.length && Boolean(hasNextPage) && !isFetchingNextPage;
    if (shouldFetchMore) {
      void fetchNextPage();
    }
  }

  return {
    data: {
      days: revealedDays,
      hasMore: revealCount < filteredDays.length || Boolean(hasNextPage),
      isLoadingMore: isFetchingNextPage,
      isPending: isResolvingFirstPage,
    },
    revealMore,
  };
}
