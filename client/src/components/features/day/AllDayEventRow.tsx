import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useTranslation } from "react-i18next";
import { Button, GoogleSyncedBadge } from "../../ui";
import { cn } from "../../../utils/cn";
import type { AllDayEventRowProps } from "../../../types/day";

export function AllDayEventRow({ id, title, isSynced, isDraggable, onOpenDetail }: AllDayEventRowProps) {
  const { t } = useTranslation();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
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
        "flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2",
        "dark:border-slate-800 dark:bg-slate-900",
        isDraggable && "touch-none",
        isDragging && "opacity-60",
      )}
    >
      <span className="shrink-0 text-base" aria-hidden="true">
        📅
      </span>
      <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-800 dark:text-slate-100">
        {title}
      </span>
      {isSynced && <GoogleSyncedBadge />}
      <Button variant="ghost" size="icon" className="shrink-0" onClick={onOpenDetail} aria-label={t("day.allDay.infoAria")}>
        ⓘ
      </Button>
    </div>
  );
}
