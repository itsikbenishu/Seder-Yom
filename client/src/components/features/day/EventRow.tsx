import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useTranslation } from "react-i18next";
import { Button, GoogleSyncedBadge, Spinner } from "../../ui";
import { cn } from "../../../utils/cn";
import { isGoogleCalendarEvent } from "../../../types/calendarEvent";
import type { EventRowProps } from "../../../types/day";
import { ClampableDetails } from "./ClampableDetails";
import { FileChip } from "./FileChip";

export function EventRow({
  event,
  isNextUp,
  isExpanded,
  isDraggable,
  onToggleExpand,
  onMuteToggle,
  isMuteTogglePending,
  onEdit,
  onDelete,
}: EventRowProps) {
  const { t } = useTranslation();
  const isGoogle = isGoogleCalendarEvent(event);
  const isGoogleSynced = isGoogle || event.googleCalendarSynced;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: event.id,
    disabled: !isDraggable,
  });

  const style = { transform: CSS.Transform.toString(transform), transition };
  const dragProps = isDraggable ? { ...attributes, ...listeners } : {};

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...dragProps}
      className={cn(
        "flex items-start gap-3 rounded-xl border p-3.5",
        isGoogleSynced
          ? "border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/40"
          : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900",
        // dnd-kit's PointerSensor needs touch gestures on the drag source itself, not the
        // browser's native scroll/pan, to reach its activation distance - without this,
        // touch drags on mobile get swallowed as a page scroll before the drag can start.
        isDraggable && "touch-none",
        isDragging && "opacity-60",
      )}
    >
      <div className="w-16 shrink-0 text-start text-sm text-slate-500 dark:text-slate-400">
        <div>{event.start}</div>
        <div>{event.end}</div>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[16px] font-semibold break-words [overflow-wrap:anywhere]">{event.title}</span>
          {isNextUp && (
            <span className="rounded-full border border-violet-300 bg-violet-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-violet-600 dark:border-violet-500/40 dark:bg-violet-500/10 dark:text-violet-400">
              {t("day.event.nextUp")}
            </span>
          )}
          {isGoogleSynced && <GoogleSyncedBadge />}
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

      {!isGoogle && !event.googleCalendarSynced && (
        <div className="flex shrink-0 items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onMuteToggle(event.id)}
            disabled={isMuteTogglePending}
            aria-label={t(event.mutedUntilArchive ? "day.event.unmuteAria" : "day.event.muteAria")}
          >
            {isMuteTogglePending ? <Spinner className="h-3.5 w-3.5" /> : event.mutedUntilArchive ? "🔕" : "🔔"}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onEdit(event.id)} aria-label={t("day.event.editAria")}>
            ✏️
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onDelete(event.id)} aria-label={t("day.event.deleteAria")}>
            🗑️
          </Button>
        </div>
      )}
    </div>
  );
}
