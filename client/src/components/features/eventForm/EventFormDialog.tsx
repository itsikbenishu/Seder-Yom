import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { createEventSchema, type EventFrequency, type ReminderMode } from "@project/shared";
import { Button, Input, Modal, Textarea } from "../../ui";
import { useCreateEventMutation } from "../../../hooks/useCreateEventMutation";
import { useUpdateEventMutation } from "../../../hooks/useUpdateEventMutation";
import { useEventFileUpload } from "../../../hooks/useEventFileUpload";
import { createDefaultEventFormValues, eventToFormValues } from "../../../utils/eventFormDefaults";
import type { EventFormDialogProps, EventFormValues } from "../../../types/eventForm";
import { AttachmentChip } from "./AttachmentChip";
import { AttachmentsField } from "./AttachmentsField";
import { FrequencyField } from "./FrequencyField";
import { ReminderField } from "./ReminderField";

// react-hook-form's TFieldValues must be the schema's pre-parse *input* type: fields with
// a Zod `.default()` (reminder, mutedUntilArchive, fileIds) are optional going in and only
// become required after zodResolver runs the schema — using the *output* type here (as
// EventFormValues is, for the submitted payload) makes those fields wrongly required on
// the form/register/watch side and fails to type-check against zodResolver/handleSubmit.
type EventFormInput = z.input<typeof createEventSchema>;

export function EventFormDialog({ mode, onClose, onSaved }: EventFormDialogProps) {
  const { t } = useTranslation();
  const createMutation = useCreateEventMutation();
  const updateMutation = useUpdateEventMutation();
  const [removedFileIds, setRemovedFileIds] = useState<Set<string>>(new Set());

  const existingFiles = mode.kind === "edit" ? mode.event.files.filter((file) => !removedFileIds.has(file.id)) : [];
  const { attachments, addFiles, removeFile } = useEventFileUpload(existingFiles);

  const defaultValues =
    mode.kind === "create" ? createDefaultEventFormValues(mode.dayOfWeek) : eventToFormValues(mode.event);

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
  const allDay = useWatch({ control, name: "allDay" }) ?? false;
  const frequency = useWatch({ control, name: "frequency" });
  const reminder = useWatch({ control, name: "reminder" }) ?? false;
  const reminderMode = useWatch({ control, name: "reminderMode" });
  const reminderTime = useWatch({ control, name: "reminderTime" });

  function handleAllDayChange(nextAllDay: boolean) {
    setValue("allDay", nextAllDay);
    if (nextAllDay) {
      if (frequency === "once") setValue("frequency", "daily");
      setValue("reminderMode", "time");
    }
  }

  function onSubmit(values: EventFormValues) {
    const uploadedIds = attachments
      .filter((attachment) => attachment.status === "uploaded")
      .map((attachment) => attachment.uploadedFile!.id);
    const payload = { ...values, fileIds: [...existingFiles.map((file) => file.id), ...uploadedIds] };

    if (mode.kind === "create") {
      createMutation.mutate(payload, { onSuccess: onSaved });
      return;
    }
    updateMutation.mutate({ id: mode.event.id, input: payload }, { onSuccess: onSaved });
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal
      open
      onClose={onClose}
      title={mode.kind === "create" ? t("eventForm.dialog.createTitle") : t("eventForm.dialog.editTitle")}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button variant="primary" onClick={handleSubmit(onSubmit)} disabled={isPending}>
            {t("common.save")}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Input
          label={t("eventForm.fields.title")}
          maxLength={80}
          error={formState.errors.title?.message && t(formState.errors.title.message)}
          {...register("title")}
        />

        <Button
          type="button"
          variant={allDay ? "primary" : "secondary"}
          aria-pressed={allDay}
          onClick={() => handleAllDayChange(!allDay)}
        >
          {t("eventForm.fields.allDayToggle")}
        </Button>

        {!allDay && (
          <div className="flex gap-3">
            <Input
              type="time"
              label={t("eventForm.fields.start")}
              error={formState.errors.start?.message && t(formState.errors.start.message)}
              {...register("start")}
            />
            <Input
              type="time"
              label={t("eventForm.fields.end")}
              error={formState.errors.end?.message && t(formState.errors.end.message)}
              {...register("end")}
            />
          </div>
        )}

        <FrequencyField
          allDay={allDay}
          value={frequency as EventFrequency}
          onChange={(value) => setValue("frequency", value)}
        />

        <ReminderField
          allDay={allDay}
          reminder={reminder}
          reminderMode={reminderMode as ReminderMode | undefined}
          reminderTime={reminderTime}
          onReminderChange={(value) => setValue("reminder", value)}
          onReminderModeChange={(value) => setValue("reminderMode", value)}
          onReminderTimeChange={(value) => setValue("reminderTime", value)}
        />

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
    </Modal>
  );
}
