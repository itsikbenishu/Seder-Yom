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

export function useArchiveDays(search: string): UseArchiveDaysResult {
  const [revealCount, setRevealCount] = useState(REVEAL_STEP);
  const [revealResetKey, setRevealResetKey] = useState(search);

  // Reset the reveal window whenever the search text changes. Derived during
  // render (React's "adjust state during render" pattern) rather than in an effect,
  // so the reset is not one render late.
  if (revealResetKey !== search) {
    setRevealResetKey(search);
    setRevealCount(REVEAL_STEP);
  }

  const debouncedSearch = useDebouncedValue(search.trim(), 300);

  const { data, hasNextPage, isFetchingNextPage, fetchNextPage } = useInfiniteQuery({
    queryKey: archiveKeys.list(debouncedSearch),
    queryFn: ({ pageParam }) => getArchive({ offset: pageParam, search: debouncedSearch }),
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
    },
    revealMore,
  };
}
