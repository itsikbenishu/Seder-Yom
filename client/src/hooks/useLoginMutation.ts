import { useMutation } from "@tanstack/react-query";
import { login } from "../services/auth.api";

export function useLoginMutation() {
  return useMutation<void, Error, string>({
    mutationFn: login,
  });
}
