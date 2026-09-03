import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { signOut } from "../services/auth.api";
import { endSession } from "../services/queryClient";
import { useToast } from "./useToast";

export function useSignOutMutation() {
  const { t } = useTranslation();
  const { showToast } = useToast();

  return useMutation<void, Error, void>({
    mutationFn: signOut,
    onSuccess: endSession,
    onError: () => showToast(t("settings.signOut.error"), "error"),
  });
}
