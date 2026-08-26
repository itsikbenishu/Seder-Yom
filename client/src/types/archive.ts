import type { ArchivedDay } from "@project/shared";

/**
 * Assembled data for the Archive screen: `days` is the currently *revealed* slice
 * (grows by 12 near the list bottom, per the design's client-side reveal window over
 * the cached, larger backend pages), not the full cached/fetched set.
 */
export interface ArchiveViewData {
  days: ArchivedDay[];
  hasMore: boolean;
  isLoadingMore: boolean;
}

export interface ArchiveHeaderProps {
  search: string;
  onSearchChange: (value: string) => void;
  onBack: () => void;
}

export interface ArchiveRowProps {
  day: ArchivedDay;
  onSelect: (day: ArchivedDay) => void;
}

export interface ArchiveListProps {
  data: ArchiveViewData;
  onSelect: (day: ArchivedDay) => void;
  /** Fired when the scroll position comes within ~160px of the bottom. */
  onReachEnd: () => void;
}

export interface ArchiveScreenProps {
  onBack: () => void;
  onOpenArchivedDay: (day: ArchivedDay) => void;
}
