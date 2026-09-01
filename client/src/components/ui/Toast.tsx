import { cn } from "../../utils/cn";

export type ToastVariant = "error" | "success";

export interface ToastProps {
  message: string;
  variant?: ToastVariant;
}

const VARIANT_CLASSES: Record<ToastVariant, string> = {
  error: "bg-rose-600 text-white",
  success: "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900",
};

export function Toast({ message, variant = "error" }: ToastProps) {
  return (
    <div
      role="status"
      className={cn(
        "sy-toast rounded-lg px-4 py-2.5 text-sm font-medium shadow-lg",
        VARIANT_CLASSES[variant],
      )}
    >
      {message}
    </div>
  );
}
