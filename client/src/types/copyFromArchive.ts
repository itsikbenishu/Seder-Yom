import type { ArchivedDay } from "@project/shared";

/** Assembled data for the copy-from-archive picker's list - no client-side reveal window, unlike the Archive screen. */
export interface CopyFromArchiveViewData {
  days: ArchivedDay[];
  hasMore: boolean;
  isLoadingMore: boolean;
  /** True only on the first-ever load (no cached page yet) - drives the list skeleton. */
  isPending: boolean;
}

export interface CopyFromArchiveFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  date: string;
  onDateChange: (date: string) => void;
}

export interface CopyFromArchiveListProps {
  data: CopyFromArchiveViewData;
  onSelect: (day: ArchivedDay) => void;
  /** Fired when the scroll position comes within ~160px of the bottom. */
  onReachEnd: () => void;
}

export interface CopyFromArchivePickerProps {
  /** The day whose local events get overwritten by the picked archived day's events. */
  dayOfWeek: number;
  onClose: () => void;
}
