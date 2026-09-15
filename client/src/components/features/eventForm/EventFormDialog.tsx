import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { createEventSchema, type EventFrequency, type ReminderMode } from "@project/shared";
import { Button, Input, Modal, Spinner, Textarea } from "../../ui";
import { useCreateEventMutation } from "../../../hooks/useCreateEventMutation";
import { useUpdateEventMutation } from "../../../hooks/useUpdateEventMutation";
import { useEventFileUpload } from "../../../hooks/useEventFileUpload";
import { usePushRegistration } from "../../../hooks/usePushRegistration";
import { useUserPreferences } from "../../../hooks/useUserPreferences";
import { useToast } from "../../../hooks/useToast";
import { createDefaultEventFormValues, eventToFormValues } from "../../../utils/eventFormDefaults";
import type { EventFormDialogProps, EventFormValues } from "../../../types/eventForm";
import { AttachmentChip } from "./AttachmentChip";
import { AttachmentsField } from "./AttachmentsField";
import { FrequencyField } from "./FrequencyField";
import { ReminderField } from "./ReminderField";

// react-hook-form's TFieldValues must be the schema's pre-parse *input* type: fields with
// a Zod `.default()` (reminder, mutedUntilArchive, fileIds) are optional going in and only
// become required after zodResolver runs the schema - using the *output* type here (as
// EventFormValues is, for the submitted payload) makes those fields wrongly required on
// the form/register/watch side and fails to type-check against zodResolver/handleSubmit.
type EventFormInput = z.input<typeof createEventSchema>;

export function EventFormDialog({ mode, onClose, onSaved }: EventFormDialogProps) {
  const { t } = useTranslation();
  const createMutation = useCreateEventMutation();
  const updateMutation = useUpdateEventMutation();
  const [removedFileIds, setRemovedFileIds] = useState<Set<string>>(new Set());
  const { permission: pushPermission } = usePushRegistration();
  const { data: userPreferences } = useUserPreferences();
  const { showToast } = useToast();

  // Fixed for the dialog's lifetime - chosen by which "+" opened it (create) or by the
  // event being edited; there's no in-form toggle (matches the reference design).
  const isAllDay = mode.kind === "create" ? mode.allDay : mode.event.allDay;

  const existingFiles = mode.kind === "edit" ? mode.event.files.filter((file) => !removedFileIds.has(file.id)) : [];
  const { attachments, addFiles, removeFile } = useEventFileUpload(existingFiles);

  const defaultValues =
    mode.kind === "create" ? createDefaultEventFormValues(mode.dayOfWeek, mode.allDay) : eventToFormValues(mode.event);

  const { register, control, setValue, handleSubmit, formState } = useForm<
    EventFormInput,
    unknown,
    EventFormValues
  >({
    resolver: zodResolver(createEventSchema),
    defaultValues,
  });

  // useWatch (not useForm's own `watch()`) so this component stays compatible with the
  // React Compiler: `watch()` is a subscription-based API the compiler can't safely
  // memoize around, while `useWatch` is a proper hook the compiler can analyze normally.
  const frequency = useWatch({ control, name: "frequency" });
  const reminder = useWatch({ control, name: "reminder" }) ?? false;
  const reminderMode = useWatch({ control, name: "reminderMode" });
  const reminderTime = useWatch({ control, name: "reminderTime" });

  function onSubmit(values: EventFormValues) {
    const uploadedIds = attachments
      .filter((attachment) => attachment.status === "uploaded")
      .map((attachment) => attachment.uploadedFile!.id);
    // values.allDay is already correct - seeded once via defaultValues and never
    // touched by setValue/register, since there's no in-form toggle to change it.
    const payload = { ...values, fileIds: [...existingFiles.map((file) => file.id), ...uploadedIds] };

    function onSaveSuccess() {
      const channel = userPreferences?.channels[0] ?? "browser";
      const needsPushSetup = channel === "browser" && pushPermission !== "granted" && pushPermission !== "unsupported";
      if (values.reminder && needsPushSetup) showToast(t("eventForm.reminderPushSetupHint"), "success");
      onSaved();
    }

    if (mode.kind === "create") {
      createMutation.mutate(payload, { onSuccess: onSaveSuccess });
      return;
    }
    updateMutation.mutate({ id: mode.event.id, input: payload }, { onSuccess: onSaveSuccess });
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  // Don't let the dialog close (backdrop/Escape/X/Cancel) while a save is in flight.
  function handleClose() {
    if (!isPending) onClose();
  }

  const title =
    mode.kind === "edit"
      ? t("eventForm.dialog.editTitle")
      : t(isAllDay ? "eventForm.dialog.allDayCreateTitle" : "eventForm.dialog.createTitle");

  return (
    <Modal
      open
      onClose={handleClose}
      title={title}
      className="max-w-3xl"
      footer={
        <>
          <Button variant="ghost" onClick={handleClose} disabled={isPending}>
            {t("common.cancel")}
          </Button>
          <Button variant="primary" onClick={handleSubmit(onSubmit)} disabled={isPending}>
            {isPending && <Spinner className="h-3.5 w-3.5 border-white/40 border-t-white" />}
            {t("common.save")}
          </Button>
        </>
      }
    >
      <fieldset disabled={isPending} className="contents">
        <div className="flex flex-col gap-2">
          <Input
            label={t("eventForm.fields.title")}
            maxLength={80}
            error={formState.errors.title?.message && t(formState.errors.title.message)}
            {...register("title")}
          />

          {!isAllDay && (
            <div className="flex gap-3">
              <div className="flex-1">
                <Input
                  type="time"
                  className="w-full"
                  label={t("eventForm.fields.start")}
                  error={formState.errors.start?.message && t(formState.errors.start.message)}
                  {...register("start")}
                />
              </div>
              <div className="flex-1">
                <Input
                  type="time"
                  className="w-full"
                  label={t("eventForm.fields.end")}
                  error={formState.errors.end?.message && t(formState.errors.end.message)}
                  {...register("end")}
                />
              </div>
            </div>
          )}

          {isAllDay ? (
            <ReminderField
              allDay
              reminder={reminder}
              reminderMode={reminderMode as ReminderMode | undefined}
              reminderTime={reminderTime}
              onReminderChange={(value) => setValue("reminder", value)}
              onReminderModeChange={(value) => setValue("reminderMode", value)}
              onReminderTimeChange={(value) => setValue("reminderTime", value)}
            />
          ) : (
            <div className="flex gap-3">
              <div className="flex-1">
                <FrequencyField
                  allDay={false}
                  value={frequency as EventFrequency}
                  onChange={(value) => setValue("frequency", value)}
                />
              </div>
              <div className="flex-1">
                <ReminderField
                  allDay={false}
                  reminder={reminder}
                  reminderMode={reminderMode as ReminderMode | undefined}
                  reminderTime={reminderTime}
                  onReminderChange={(value) => setValue("reminder", value)}
                  onReminderModeChange={(value) => setValue("reminderMode", value)}
                  onReminderTimeChange={(value) => setValue("reminderTime", value)}
                />
              </div>
            </div>
          )}

          <Textarea
            label={t("eventForm.fields.description")}
            maxLength={200}
            error={formState.errors.description?.message && t(formState.errors.description.message)}
            {...register("description")}
          />

          <Textarea
            label={t("eventForm.fields.note")}
            maxLength={500}
            error={formState.errors.note?.message && t(formState.errors.note.message)}
            {...register("note")}
          />

          {existingFiles.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {existingFiles.map((file) => (
                <AttachmentChip
                  key={file.id}
                  filename={file.filename}
                  status="existing"
                  onRemove={() => setRemovedFileIds((current) => new Set(current).add(file.id))}
                />
              ))}
            </div>
          )}

          <AttachmentsField attachments={attachments} onAdd={addFiles} onRemove={removeFile} />
        </div>
      </fieldset>
    </Modal>
  );
}
