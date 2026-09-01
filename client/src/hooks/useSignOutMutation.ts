import { useMutation } from "@tanstack/react-query";
import { signOut } from "../services/auth.api";
import { endSession } from "../services/queryClient";

export function useSignOutMutation() {
  return useMutation<void, Error, void>({
    mutationFn: signOut,
    onSuccess: endSession,
  });
}
