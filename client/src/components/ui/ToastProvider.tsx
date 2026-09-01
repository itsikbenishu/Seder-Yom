import { useCallback, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ToastContext } from "../../hooks/useToast";
import { Toast, type ToastVariant } from "./Toast";

const TOAST_DURATION_MS = 4000;

interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, variant: ToastVariant = "error") => {
    const id = crypto.randomUUID();
    setToasts((current) => [...current, { id, message, variant }]);
    setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, TOAST_DURATION_MS);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {createPortal(
        <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4">
          {toasts.map((toast) => (
            <Toast key={toast.id} message={toast.message} variant={toast.variant} />
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}
