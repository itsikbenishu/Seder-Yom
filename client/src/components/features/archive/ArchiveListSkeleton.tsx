import { Skeleton } from "../../ui";

function ArchiveRowSkeleton() {
  return (
    <div className="flex items-start justify-between gap-3 px-4 py-3">
      <div className="min-w-0 flex-1 space-y-1.5">
        <Skeleton className="h-3 w-14" />
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3.5 w-56 bg-slate-100 dark:bg-slate-800/60" />
      </div>
      <Skeleton className="h-3.5 w-12 shrink-0" />
    </div>
  );
}

/** Shown while the archive list loads for the first time - avoids a flash of the empty state. */
export function ArchiveListSkeleton() {
  return (
    <div className="flex-1 divide-y divide-slate-100 overflow-y-auto dark:divide-slate-800">
      {Array.from({ length: 8 }, (_, i) => (
        <ArchiveRowSkeleton key={i} />
      ))}
    </div>
  );
}
