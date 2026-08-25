import { useTranslation } from "react-i18next";
import { Button, Modal } from "../../ui";
import type { AllDayEventDetailProps } from "../../../types/day";
import type { EventFile } from "@project/shared";

const BYTES_PER_UNIT = 1024;
const FILE_SIZE_UNITS = ["B", "KB", "MB", "GB"] as const;

function formatFileSize(bytes: number): string {
  let value = bytes;
  let unitIndex = 0;
  while (value >= BYTES_PER_UNIT && unitIndex < FILE_SIZE_UNITS.length - 1) {
    value /= BYTES_PER_UNIT;
    unitIndex += 1;
  }
  const precision = unitIndex === 0 ? 0 : 1;
  return `${value.toFixed(precision)} ${FILE_SIZE_UNITS[unitIndex]}`;
}

function AttachmentRow({ file }: { file: EventFile }) {
  return (
    <a
      href={file.storagePath}
      download={file.filename}
      className="flex w-full items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-800"
    >
      <span aria-hidden="true">📎</span>
      <span className="min-w-0 flex-1 truncate">{file.filename}</span>
      <span className="shrink-0 text-xs text-slate-500 dark:text-slate-400">{formatFileSize(file.size)}</span>
    </a>
  );
}

export function AllDayEventDetail({ event, onClose, onEdit, onDelete }: AllDayEventDetailProps) {
  const { t } = useTranslation();
  const isLocal = !event.googleCalendarSynced;

  function handleEdit() {
    onEdit(event.id);
    onClose();
  }

  function handleDelete() {
    onDelete(event.id);
    onClose();
  }

  const footer = isLocal ? (
    <div className="flex w-full items-center justify-between">
      <Button variant="ghost" onClick={handleDelete}>
        {t("day.allDay.delete")}
      </Button>
      <Button variant="secondary" onClick={handleEdit}>
        {t("day.allDay.edit")}
      </Button>
    </div>
  ) : undefined;

  return (
    <Modal open title={event.title} onClose={onClose} footer={footer} className="max-w-[440px]">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">
        {t("day.allDay.detailKicker")}
      </p>

      <div className="mb-4 flex flex-wrap items-center gap-1.5">
        {event.googleCalendarSynced && (
          <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-sky-700 dark:bg-sky-500/10 dark:text-sky-300">
            {t("day.allDay.googleSynced")}
          </span>
        )}
        {event.reminder && event.reminderTime && (
          <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">
            {t("day.allDay.reminderAt", { time: event.reminderTime })}
          </span>
        )}
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          {t(event.frequency === "daily" ? "day.allDay.repeatDaily" : "day.allDay.repeatWeekly")}
        </span>
      </div>

      {event.description && (
        <section className="mb-4">
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">
            {t("day.allDay.description")}
          </h3>
          <p className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200">{event.description}</p>
        </section>
      )}

      {event.note && (
        <section className="mb-4">
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">
            {t("day.allDay.note")}
          </h3>
          <p className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200">{event.note}</p>
        </section>
      )}

      {event.files.length > 0 && (
        <section>
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">
            {t("day.allDay.attachments")}
          </h3>
          <ul className="flex flex-col gap-1.5">
            {event.files.map((file) => (
              <li key={file.id}>
                <AttachmentRow file={file} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </Modal>
  );
}
