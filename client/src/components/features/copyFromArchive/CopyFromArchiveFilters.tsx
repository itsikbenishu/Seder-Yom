import { useTranslation } from "react-i18next";
import { Button, Input } from "../../ui";
import type { CopyFromArchiveFiltersProps } from "../../../types/copyFromArchive";

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

// Mirrors ArchiveHeader's filter row, minus the back button/title (the Modal's own header covers those).
export function CopyFromArchiveFilters({ search, onSearchChange, date, onDateChange }: CopyFromArchiveFiltersProps) {
  const { t } = useTranslation();

  return (
    <div className="flex w-full items-center gap-2">
      <div className="relative flex-1">
        <span
          className="pointer-events-none absolute inset-y-0 start-3 flex items-center text-slate-400"
          aria-hidden="true"
        >
          🔍
        </span>
        <Input
          className="ps-9"
          type="search"
          placeholder={t("archive.searchPlaceholder")}
          aria-label={t("archive.searchAria")}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Input
          className="min-w-[140px]"
          type="date"
          aria-label={t("archive.dateAria")}
          value={date}
          onChange={(e) => onDateChange(e.target.value)}
        />
        {date && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDateChange("")}
            aria-label={t("archive.clearDateAria")}
          >
            <CloseIcon />
          </Button>
        )}
      </div>
    </div>
  );
}
