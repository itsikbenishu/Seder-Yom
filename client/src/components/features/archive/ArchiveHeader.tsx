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

export function ArchiveHeader({ search, onSearchChange, onBack }: ArchiveHeaderProps) {
  const { t } = useTranslation();

  return (
    <header className="flex items-center gap-3 p-4">
      <Button variant="ghost" size="icon" onClick={onBack} aria-label={t("archive.backAria")}>
        <GridIcon />
      </Button>
      <h1 className="text-xl font-semibold">{t("archive.title")}</h1>
      <div className="relative ms-auto max-w-xs flex-1">
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
    </header>
  );
}
