import { useMutation, useQueryClient } from "@tanstack/react-query";
import { signOut } from "../services/auth.api";

export function useSignOutMutation() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, void>({
    mutationFn: signOut,
    onSuccess: () => {
      queryClient.clear();
    },
  });
}
