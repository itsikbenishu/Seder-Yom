import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { signOut } from "../services/auth.api";
import { clearPushRegistration } from "../services/pushDevices.api";
import { endSession } from "../services/queryClient";
import { useToast } from "./useToast";

export function useSignOutMutation() {
  const { t } = useTranslation();
  const { showToast } = useToast();

  return useMutation<void, Error, void>({
    // Remove this device's push token while the session cookie is still valid,
    // then end the session.
    mutationFn: async () => {
      await clearPushRegistration();
      await signOut();
    },
    onSuccess: endSession,
    onError: () => showToast(t("settings.signOut.error"), "error"),
  });
}
