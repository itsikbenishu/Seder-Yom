import { cn } from "../../utils/cn";

export interface SpinnerProps {
  className?: string;
}

export function Spinner({ className }: SpinnerProps) {
  return (
    <div
      className={cn(
        "h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-violet-600 dark:border-slate-600 dark:border-t-violet-400",
        className,
      )}
      aria-hidden="true"
    />
  );
}
