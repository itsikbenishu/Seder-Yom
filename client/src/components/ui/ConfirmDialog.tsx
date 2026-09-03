import { Button } from "./Button";
import { Modal } from "./Modal";
import { Spinner } from "./Spinner";

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel: string;
  danger?: boolean;
  confirmPending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  cancelLabel,
  danger,
  confirmPending,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  // Don't let Escape/backdrop/header-X close the dialog while confirming is in flight.
  function handleClose() {
    if (!confirmPending) onCancel();
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={title}
      footer={
        <>
          <Button variant="ghost" onClick={handleClose} disabled={confirmPending}>
            {cancelLabel}
          </Button>
          <Button variant={danger ? "danger" : "primary"} onClick={onConfirm} disabled={confirmPending}>
            {confirmPending && <Spinner className="h-3.5 w-3.5 border-white/40 border-t-white" />}
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm text-slate-600 dark:text-slate-300">{body}</p>
    </Modal>
  );
}
