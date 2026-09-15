import { Skeleton } from "../../ui";

function DayCardSkeleton() {
  return (
    <div className="flex flex-col gap-2.5 rounded-xl border border-slate-200 p-3.5 dark:border-slate-800">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-6" />
      </div>
      <Skeleton className="h-4 w-3/4 bg-slate-100 dark:bg-slate-800/60" />
      <Skeleton className="h-6 w-full bg-slate-100 dark:bg-slate-800/60" />
    </div>
  );
}

/** Shown while the week's events load for the first time - avoids a flash of empty cards. */
export function WeekGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
      {Array.from({ length: 7 }, (_, i) => (
        <DayCardSkeleton key={i} />
      ))}
    </div>
  );
}
