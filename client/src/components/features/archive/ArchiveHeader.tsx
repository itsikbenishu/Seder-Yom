import { useTranslation } from "react-i18next";
import { Button, Input } from "../../ui";
import type { ArchiveHeaderProps } from "../../../types/archive";

function GridIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      className="h-4 w-4"
      aria-hidden="true"
    >
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
    </svg>
  );
}

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

export function ArchiveHeader({ search, onSearchChange, date, onDateChange, onBack }: ArchiveHeaderProps) {
  const { t } = useTranslation();

  return (
    <header className="flex flex-wrap items-center gap-3 p-4">
      <Button variant="ghost" size="icon" onClick={onBack} aria-label={t("archive.backAria")}>
        <GridIcon />
      </Button>
      <h1 className="text-xl font-semibold">{t("archive.title")}</h1>
      <div className="flex w-full items-center gap-2 sm:w-auto sm:flex-1">
        <div className="relative flex-1 sm:max-w-xs">
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
    </header>
  );
}
