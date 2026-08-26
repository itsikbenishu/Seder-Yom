import { useEffect, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { archiveKeys } from "../services/queryKeys";
import { getArchive } from "../services/archive.api";
import type { ArchiveViewData } from "../types/archive";

const REVEAL_STEP = 12;
const DEBOUNCE_MS = 300;

export interface UseArchiveDaysResult {
  data: ArchiveViewData;
  revealMore: () => void;
}

export function useArchiveDays(search: string): UseArchiveDaysResult {
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [revealCount, setRevealCount] = useState(REVEAL_STEP);
  const [revealResetKey, setRevealResetKey] = useState(debouncedSearch);

  useEffect(() => {
    const timeoutId = setTimeout(() => setDebouncedSearch(search), DEBOUNCE_MS);
    return () => clearTimeout(timeoutId);
  }, [search]);

  // Reset the reveal window whenever the debounced search changes. Derived during
  // render (React's "adjust state during render" pattern) rather than in an effect,
  // so the reset is not one render late.
  if (revealResetKey !== debouncedSearch) {
    setRevealResetKey(debouncedSearch);
    setRevealCount(REVEAL_STEP);
  }

  const { data, hasNextPage, isFetchingNextPage, fetchNextPage } = useInfiniteQuery({
    queryKey: archiveKeys.list(debouncedSearch),
    queryFn: ({ pageParam }) => getArchive({ search: debouncedSearch, offset: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((sum, page) => sum + page.days.length, 0);
      return lastPage.has_more ? loaded : undefined;
    },
  });

  const flattenedDays = data?.pages.flatMap((page) => page.days) ?? [];
  const revealedDays = flattenedDays.slice(0, revealCount);

  function revealMore(): void {
    const nextRevealCount = revealCount + REVEAL_STEP;
    setRevealCount(nextRevealCount);

    const shouldFetchMore =
      nextRevealCount >= flattenedDays.length && Boolean(hasNextPage) && !isFetchingNextPage;
    if (shouldFetchMore) {
      void fetchNextPage();
    }
  }

  return {
    data: {
      days: revealedDays,
      hasMore: revealCount < flattenedDays.length || Boolean(hasNextPage),
      isLoadingMore: isFetchingNextPage,
    },
    revealMore,
  };
}
