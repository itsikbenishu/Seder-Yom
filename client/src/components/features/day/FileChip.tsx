import type { EventFile } from "@project/shared";

export interface FileChipProps {
  file: EventFile;
}

export function FileChip({ file }: FileChipProps) {
  return (
    <a
      href={file.storagePath}
      download={file.filename}
      className="inline-flex max-w-full items-center gap-1 truncate rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
    >
      <span aria-hidden="true">📎</span>
      <span className="truncate">{file.filename}</span>
    </a>
  );
}
