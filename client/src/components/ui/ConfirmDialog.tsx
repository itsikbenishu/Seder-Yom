import { Button } from "./Button";
import { Modal } from "./Modal";
import { Spinner } from "./Spinner";

export interface ConfirmDialogSecondaryAction {
  label: string;
  pending?: boolean;
  onClick: () => void;
}

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
  /** Optional alternative resolution rendered between Cancel and the primary confirm button. */
  secondaryAction?: ConfirmDialogSecondaryAction;
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
  secondaryAction,
}: ConfirmDialogProps) {
  const anyActionPending = confirmPending || secondaryAction?.pending;

  // Don't let Escape/backdrop/header-X close the dialog while confirming is in flight.
  function handleClose() {
    if (!anyActionPending) onCancel();
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={title}
      footer={
        <>
          <Button variant="ghost" onClick={handleClose} disabled={anyActionPending}>
            {cancelLabel}
          </Button>
          {secondaryAction && (
            <Button variant="secondary" onClick={secondaryAction.onClick} disabled={anyActionPending}>
              {secondaryAction.pending && <Spinner className="h-3.5 w-3.5" />}
              {secondaryAction.label}
            </Button>
          )}
          <Button variant={danger ? "danger" : "primary"} onClick={onConfirm} disabled={anyActionPending}>
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
