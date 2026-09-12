import type { CreateEventInput, EventFile, EventFrequency, ReminderMode } from "@project/shared";
import type { CalendarEvent } from "./calendarEvent";

/** Reused as-is for both create and edit — only the submit handler differs, not the shape. */
export type EventFormValues = CreateEventInput;

export type EventFormMode =
  | { kind: "create"; dayOfWeek: number; allDay: boolean }
  | { kind: "edit"; event: CalendarEvent };

export interface EventFormDialogProps {
  mode: EventFormMode;
  onClose: () => void;
  onSaved: () => void;
}

/** Both timed and all-day events offer once|daily|weekly. */
export interface FrequencyFieldProps {
  allDay: boolean;
  value: EventFrequency;
  onChange: (value: EventFrequency) => void;
}

/** All-day events force `reminderMode: "time"` and hide the offset menu — only `reminderTime` applies. */
export interface ReminderFieldProps {
  allDay: boolean;
  reminder: boolean;
  reminderMode: ReminderMode | undefined;
  reminderTime: string | undefined; // HH:mm
  onReminderChange: (reminder: boolean) => void;
  onReminderModeChange: (mode: ReminderMode) => void;
  onReminderTimeChange: (time: string) => void;
}

export type AttachmentUploadStatus = "uploading" | "uploaded" | "error";

/** Files upload immediately on picking, not deferred to save — this tracks per-file progress. */
export interface AttachmentUploadState {
  localId: string;
  file: File;
  status: AttachmentUploadStatus;
  uploadedFile?: EventFile;
  errorMessage?: string;
}

/** Caps enforced client-side to match validation (≤5 files, ≤10MB/file, ≤25MB total, duplicate name+size blocked). */
export interface AttachmentsFieldProps {
  attachments: AttachmentUploadState[];
  onAdd: (files: File[]) => void;
  onRemove: (localId: string) => void;
}
