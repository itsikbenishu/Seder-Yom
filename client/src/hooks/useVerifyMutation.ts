import { useMutation } from "@tanstack/react-query";
import { verify } from "../services/auth.api";

interface VerifyInput {
  email: string;
  code: string;
}

export function useVerifyMutation() {
  return useMutation<void, Error, VerifyInput>({
    mutationFn: ({ email, code }) => verify(email, code),
  });
}
