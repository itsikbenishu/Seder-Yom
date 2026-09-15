import { endSession, hasNoSession } from "../services/queryClient";

/** Wrap opening a dialog whose action would need a session - skip straight to Login instead. */
export function useRequireSession() {
  return (action: () => void) => {
    if (hasNoSession()) {
      endSession();
      return;
    }
    action();
  };
}
