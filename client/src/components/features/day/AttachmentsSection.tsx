import { useTranslation } from "react-i18next";
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

export interface AttachmentsSectionProps {
  files: EventFile[];
}

export function AttachmentsSection({ files }: AttachmentsSectionProps) {
  const { t } = useTranslation();

  if (files.length === 0) {
    return null;
  }

  return (
    <section>
      <h3 className="mb-1 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">
        {t("day.allDay.attachments")}
      </h3>
      <ul className="flex flex-col gap-1.5">
        {files.map((file) => (
          <li key={file.id}>
            <AttachmentRow file={file} />
          </li>
        ))}
      </ul>
    </section>
  );
}
