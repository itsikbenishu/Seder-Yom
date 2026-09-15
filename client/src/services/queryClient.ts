import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { ApiError } from "./apiClient";

function isSessionExpired(error: unknown): boolean {
  if (!(error instanceof ApiError) || error.status !== 401 || error.code !== "UNAUTHENTICATED") return false;
  // /auth/login and /auth/verify 401 on bad credentials too, not session expiry.
  return !error.path.startsWith("/auth/login") && !error.path.startsWith("/auth/verify");
}

// Set when a query 401s, cleared on success. Not a redirect by itself - just lets
// Settings/Archive check "am I logged in?" before navigating (queries fail silently).
let sessionKnownMissing = false;

export function hasNoSession(): boolean {
  return sessionKnownMissing;
}

// Only mutations trigger the redirect; failed queries render with no data.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // A 401 won't succeed on retry - skip the default backoff for it.
      retry: (failureCount, error) => !isSessionExpired(error) && failureCount < 3,
    },
  },
  queryCache: new QueryCache({
    onSuccess: () => {
      sessionKnownMissing = false;
    },
    onError: (error) => {
      if (isSessionExpired(error)) sessionKnownMissing = true;
    },
  }),
  mutationCache: new MutationCache({
    onError: (error) => {
      if (isSessionExpired(error)) endSession();
    },
  }),
});

type Listener = () => void;
const listeners = new Set<Listener>();

/** Session is gone - mutation 401 or sign-out. Clears the cache, notifies App.tsx. */
export function endSession(): void {
  queryClient.clear();
  listeners.forEach((listener) => listener());
}

/** Subscribe to session-end events. Returns an unsubscribe function. */
export function onSessionEnd(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
