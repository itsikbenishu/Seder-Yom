import { useTranslation } from "react-i18next";
import { cn } from "../../../utils/cn";
import { isGoogleCalendarEvent, type ArchiveDayEventRowProps } from "../../../types/archiveDay";
import { ClampableDetails } from "../day/ClampableDetails";
import { FileChip } from "../day/FileChip";

export function ArchiveDayEventRow({ event, isExpanded, onToggleExpand }: ArchiveDayEventRowProps) {
  const { t } = useTranslation();
  const isGoogle = isGoogleCalendarEvent(event);
  const isGoogleSynced = isGoogle || event.googleCalendarSynced;

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border p-3.5",
        isGoogleSynced
          ? "border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/40"
          : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900",
      )}
    >
      <div className="w-16 shrink-0 text-start text-sm text-slate-500 dark:text-slate-400">
        <div>{event.start}</div>
        <div>{event.end}</div>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[16px] font-semibold break-words [overflow-wrap:anywhere]">{event.title}</span>
          {isGoogleSynced && (
            <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-600 dark:bg-slate-700 dark:text-slate-300">
              {t("day.event.googleSynced")}
            </span>
          )}
        </div>

        <ClampableDetails
          description={event.description ?? ""}
          note={isGoogle ? "" : (event.note ?? "")}
          isExpanded={isExpanded}
          onToggleExpand={() => onToggleExpand(event.id)}
        />

        {!isGoogle && event.files.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {event.files.map((file) => (
              <FileChip key={file.id} file={file} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
