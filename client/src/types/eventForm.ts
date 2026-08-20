import type { CreateEventInput, EventFile, EventFrequency, ReminderLead } from "@project/shared";
import type { CalendarEvent } from "./calendarEvent";

/**
 * The Event Form's full runtime value shape — reused as-is for both create and edit
 * (edit mode pre-populates these values from the existing event; only the submit
 * handler/API call differs between modes, not the form schema). Matches CLAUDE.md's
 * "derive types directly from schemas" rule — this is `createEventSchema`'s inferred
 * type, the same discriminated union (`allDay: false | true`) that already enforces the
 * start<end and allDay↔frequency/reminderLead cross-field business rules via
 * `eventWriteSchema`'s `superRefine` (SPEC.md §3).
 */
export type EventFormValues = CreateEventInput;

/** "create" opens a blank form for a given day; "edit" pre-populates from an existing event. */
export type EventFormMode = { kind: "create"; dayOfWeek: number } | { kind: "edit"; event: CalendarEvent };

export interface EventFormDialogProps {
  mode: EventFormMode;
  onClose: () => void;
  /** Called after a successful create/update so the caller can close the dialog and toast. */
  onSaved: () => void;
}

/**
 * Frequency segmented control. Options depend on `allDay`:
 * timed events offer once | daily | weekly; all-day events offer daily | weekly only
 * (no "once" — SPEC.md §3). Opening the form for a *new* all-day event defaults this to
 * "daily"; toggling all-day on for an existing "once" selection must reconcile it to a
 * valid all-day frequency.
 */
export interface FrequencyFieldProps {
  allDay: boolean;
  value: EventFrequency;
  onChange: (value: EventFrequency) => void;
}

/**
 * Reminder on/off + lead-time control. Timed events offer the full offset menu
 * (15m/30m/1h/1d/time); all-day events are always effectively "time" — a fixed
 * clock-time picker, no offset options (SPEC.md §3) — `reminderLead` is forced to
 * `"time"` and only `reminderLeadTime` is user-editable when `allDay` is true.
 */
export interface ReminderFieldProps {
  allDay: boolean;
  reminder: boolean;
  reminderLead: ReminderLead | undefined;
  reminderLeadTime: string | undefined; // HH:mm
  onReminderChange: (reminder: boolean) => void;
  onReminderLeadChange: (lead: ReminderLead) => void;
  onReminderLeadTimeChange: (time: string) => void;
}

export type AttachmentUploadStatus = "uploading" | "uploaded" | "error";

/**
 * One picked file's client-side upload state. Files upload to Storage immediately on
 * picking (`POST /files/upload`, not deferred to form save — SPEC.md §7), so the form
 * tracks upload progress per file; `uploadedFile.id` is what ultimately feeds the
 * submitted `fileIds` array once `status === "uploaded"`.
 */
export interface AttachmentUploadState {
  localId: string;
  file: File;
  status: AttachmentUploadStatus;
  uploadedFile?: EventFile;
  errorMessage?: string;
}

/** Caps enforced client-side to match SPEC.md §4 validation (≤5 files, ≤10MB/file, ≤25MB total, duplicate name+size blocked). */
export interface AttachmentsFieldProps {
  attachments: AttachmentUploadState[];
  onAdd: (files: File[]) => void;
  onRemove: (localId: string) => void;
}
