import { cn } from "../../utils/cn";

export interface SkeletonProps {
  className?: string;
}

/** A single pulsing placeholder block - compose these into a loading skeleton. */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div className={cn("animate-pulse rounded bg-slate-200 dark:bg-slate-800", className)} aria-hidden="true" />
  );
}
