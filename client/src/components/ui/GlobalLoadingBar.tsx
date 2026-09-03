import { useIsFetching, useIsMutating } from "@tanstack/react-query";

/** Slim top-of-viewport bar shown whenever any query or mutation is in flight. */
export function GlobalLoadingBar() {
  const isActive = useIsFetching() + useIsMutating() > 0;

  if (!isActive) return null;

  return <div className="fixed inset-x-0 top-0 z-[100] h-0.5 animate-pulse bg-violet-600" />;
}
