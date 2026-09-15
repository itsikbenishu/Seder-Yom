import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import {
  ALLOWED_FILE_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
  MAX_FILES_PER_EVENT,
  MAX_TOTAL_FILES_SIZE_BYTES,
} from "@project/shared";
import type { AttachmentUploadState } from "../types/eventForm";
import { uploadEventFile } from "../services/files.api";

const allowedMimeTypes: readonly string[] = ALLOWED_FILE_MIME_TYPES;

/** Minimal shape of an already-saved attachment (edit mode) that counts against the same caps. */
export interface ExistingAttachment {
  filename: string;
  size: number;
}

/** Mirrors the server's attachFiles checks so a rejection surfaces instantly, client-side. */
function validateFile(
  file: File,
  alreadyQueued: AttachmentUploadState[],
  existingFiles: ExistingAttachment[],
  t: TFunction,
): string | undefined {
  const successful = alreadyQueued.filter((attachment) => attachment.status !== "error");

  if (existingFiles.length + successful.length >= MAX_FILES_PER_EVENT) {
    return t("validation.file.count");
  }

  if (!allowedMimeTypes.includes(file.type)) {
    return t("validation.file.type");
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return t("validation.file.size");
  }

  const existingSize = existingFiles.reduce((sum, existing) => sum + existing.size, 0);
  const queuedSize = successful.reduce((sum, attachment) => sum + attachment.file.size, 0);
  if (existingSize + queuedSize + file.size > MAX_TOTAL_FILES_SIZE_BYTES) {
    return t("validation.file.totalSize");
  }

  const isDuplicate =
    successful.some((attachment) => attachment.file.name === file.name && attachment.file.size === file.size) ||
    existingFiles.some((existing) => existing.filename === file.name && existing.size === file.size);
  if (isDuplicate) {
    return t("validation.file.duplicate");
  }

  return undefined;
}

export interface UseEventFileUploadResult {
  attachments: AttachmentUploadState[];
  addFiles: (files: File[]) => void;
  removeFile: (localId: string) => void;
}

/** Transient per-form upload state, not TanStack Query cache - there's no server cache to invalidate here. */
export function useEventFileUpload(existingFiles: ExistingAttachment[] = []): UseEventFileUploadResult {
  const { t } = useTranslation();
  const [attachments, setAttachments] = useState<AttachmentUploadState[]>([]);

  function addFiles(files: File[]) {
    const batch: AttachmentUploadState[] = [];

    for (const file of files) {
      const localId = crypto.randomUUID();
      const errorMessage = validateFile(file, [...attachments, ...batch], existingFiles, t);

      if (errorMessage) {
        batch.push({ localId, file, status: "error", errorMessage });
        continue;
      }

      batch.push({ localId, file, status: "uploading" });

      uploadEventFile(file)
        .then((uploadedFile) => {
          setAttachments((current) =>
            current.map((attachment) =>
              attachment.localId === localId ? { ...attachment, status: "uploaded", uploadedFile } : attachment,
            ),
          );
        })
        .catch(() => {
          setAttachments((current) =>
            current.map((attachment) =>
              attachment.localId === localId
                ? { ...attachment, status: "error", errorMessage: t("eventForm.attachments.uploadError") }
                : attachment,
            ),
          );
        });
    }

    setAttachments((current) => [...current, ...batch]);
  }

  function removeFile(localId: string) {
    setAttachments((current) => current.filter((attachment) => attachment.localId !== localId));
  }

  return { attachments, addFiles, removeFile };
}
