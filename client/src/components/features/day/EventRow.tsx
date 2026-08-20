import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useTranslation } from "react-i18next";
import { Button } from "../../ui";
import { cn } from "../../../utils/cn";
import type { EventRowProps } from "../../../types/day";
import { FileChip } from "./FileChip";

/** Description+note only clamp (and offer a show-more toggle) past this combined length (design README). */
const CLAMP_THRESHOLD = 80;

export function EventRow({
  event,
  isNextUp,
  isExpanded,
  isDraggable,
  onToggleExpand,
  onMuteToggle,
  onEdit,
  onDelete,
}: EventRowProps) {
  const { t } = useTranslation();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: event.id,
    disabled: !isDraggable,
  });

  const description = event.description ?? "";
  const note = event.note ?? "";
  const hasDetails = description.length > 0 || note.length > 0;
  const shouldClamp = description.length + note.length > CLAMP_THRESHOLD;

  const style = { transform: CSS.Transform.toString(transform), transition };
  const dragProps = isDraggable ? { ...attributes, ...listeners } : {};

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...dragProps}
      className={cn(
        "flex items-start gap-3 rounded-xl border p-3.5",
        event.googleCalendarSynced
          ? "border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/40"
          : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900",
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
          {event.googleCalendarSynced && (
            <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-600 dark:bg-slate-700 dark:text-slate-300">
              {t("day.event.googleSynced")}
            </span>
          )}
        </div>

        {hasDetails && (
          <div className="mt-1.5 text-sm text-slate-600 dark:text-slate-300">
            <p className={cn(shouldClamp && !isExpanded && "line-clamp-2")}>
              {description}
              {description && note && " · "}
              {note}
            </p>
            {shouldClamp && (
              <button
                type="button"
                onClick={() => onToggleExpand(event.id)}
                className="mt-0.5 text-xs font-medium text-violet-600 hover:underline dark:text-violet-400"
              >
                {t(isExpanded ? "day.event.showLess" : "day.event.showMore")}
              </button>
            )}
          </div>
        )}

        {event.files.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {event.files.map((file) => (
              <FileChip key={file.id} file={file} />
            ))}
          </div>
        )}
      </div>

      {!event.googleCalendarSynced && (
        <div className="flex shrink-0 items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onMuteToggle(event.id)}
            aria-label={t(event.mutedUntilArchive ? "day.event.unmuteAria" : "day.event.muteAria")}
          >
            {event.mutedUntilArchive ? "🔕" : "🔔"}
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
