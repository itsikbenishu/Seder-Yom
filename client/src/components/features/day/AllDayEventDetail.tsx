import { useTranslation } from "react-i18next";
import { Button, Modal } from "../../ui";
import { isGoogleCalendarEvent } from "../../../types/calendarEvent";
import type { AllDayEventDetailProps } from "../../../types/day";
import { AttachmentsSection } from "./AttachmentsSection";

export function AllDayEventDetail({ event, onClose, onEdit, onDelete }: AllDayEventDetailProps) {
  const { t } = useTranslation();
  const isGoogle = isGoogleCalendarEvent(event);
  const isLocal = !isGoogle;

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
        {isGoogle ? (
          <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-sky-700 dark:bg-sky-500/10 dark:text-sky-300">
            {t("day.allDay.googleSynced")}
          </span>
        ) : (
          <>
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
            {event.frequency !== "once" && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {t(event.frequency === "daily" ? "day.allDay.repeatDaily" : "day.allDay.repeatWeekly")}
              </span>
            )}
          </>
        )}
      </div>

      {event.description && (
        <section className="mb-4">
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">
            {t("day.allDay.description")}
          </h3>
          <p className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200">{event.description}</p>
        </section>
      )}

      {isLocal && (
        <>
          {event.note && (
            <section className="mb-4">
              <h3 className="mb-1 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">
                {t("day.allDay.note")}
              </h3>
              <p className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200">{event.note}</p>
            </section>
          )}

          <AttachmentsSection files={event.files} />
        </>
      )}
    </Modal>
  );
}
