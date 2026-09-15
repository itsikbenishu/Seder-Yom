import { useTranslation } from "react-i18next";
import { Spinner } from "../../ui";
import { cn } from "../../../utils/cn";
import type { AttachmentUploadStatus } from "../../../types/eventForm";

export interface AttachmentChipProps {
  filename: string;
  /** "existing" is a previously-saved attachment (edit mode) - no upload state to show. */
  status: AttachmentUploadStatus | "existing";
  errorMessage?: string;
  onRemove: () => void;
}

/**
 * Shared attachment chip for the event form - covers both a file mid-upload in this
 * session (`uploading`/`uploaded`/`error`) and an already-saved file shown in edit mode
 * (`existing`). Kept decoupled from `File`/`EventFile` so both `AttachmentsField` (new
 * uploads) and `EventFormDialog` (existing attachments) can reuse the same chip instead
 * of hand-rolling their own markup (CLAUDE.md §2).
 */
export function AttachmentChip({ filename, status, errorMessage, onRemove }: AttachmentChipProps) {
  const { t } = useTranslation();
  const isError = status === "error";

  return (
    <div
      className={cn(
        "inline-flex max-w-full items-center gap-1.5 rounded-full border px-2 py-1 text-xs",
        isError
          ? "border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-400"
          : "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
      )}
      title={isError ? errorMessage : undefined}
    >
      <span aria-hidden="true">{isError ? "⚠️" : "📎"}</span>
      <span className="truncate">{filename}</span>

      {status === "uploading" && (
        <>
          <Spinner className="h-3 w-3 shrink-0" />
          <span className="sr-only">{t("eventForm.attachments.uploading")}</span>
        </>
      )}

      <button
        type="button"
        onClick={onRemove}
        aria-label={t("eventForm.attachments.removeAria")}
        className="ms-0.5 shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
      >
        ×
      </button>
    </div>
  );
}
