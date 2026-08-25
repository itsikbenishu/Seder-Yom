import { useRef, type ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import { ALLOWED_FILE_MIME_TYPES, MAX_FILES_PER_EVENT } from "@project/shared";
import { Button } from "../../ui";
import type { AttachmentsFieldProps } from "../../../types/eventForm";
import { AttachmentChip } from "./AttachmentChip";

const ACCEPT = ALLOWED_FILE_MIME_TYPES.join(",");

/** Attachments field for the event form dialog (SPEC.md §7): picker + upload-progress chips. */
export function AttachmentsField({ attachments, onAdd, onRemove }: AttachmentsFieldProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const successfulCount = attachments.filter((attachment) => attachment.status !== "error").length;

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (files.length > 0) {
      onAdd(files);
    }
    // Reset so picking the exact same file again still fires a change event.
    event.target.value = "";
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <Button
          type="button"
          variant="secondary"
          onClick={() => inputRef.current?.click()}
          aria-label={t("eventForm.attachments.addAria")}
        >
          <span aria-hidden="true">📎</span>
          {t("eventForm.attachments.addAria")}
        </Button>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {t("eventForm.attachments.countLabel", { count: successfulCount, max: MAX_FILES_PER_EVENT })}
        </span>
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPT}
        onChange={handleChange}
        className="hidden"
        tabIndex={-1}
        aria-hidden="true"
      />

      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {attachments.map((attachment) => (
            <AttachmentChip
              key={attachment.localId}
              filename={attachment.file.name}
              status={attachment.status}
              errorMessage={attachment.errorMessage}
              onRemove={() => onRemove(attachment.localId)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
