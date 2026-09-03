import { useEffect, useState } from "react";
import type { AppTheme } from "@project/shared";
import { hasNoSession } from "../services/queryClient";
import { useUserPreferences } from "./useUserPreferences";
import { useUpdateUserPreferencesMutation } from "./useUpdateUserPreferencesMutation";

function prefersDark(): boolean {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

/** Account-level once signed in; falls back to local-only state (lost on reload) before that. */
export function useAppTheme(): { theme: AppTheme; setTheme: (theme: AppTheme) => void; isPending: boolean } {
  const { data } = useUserPreferences();
  const updateMutation = useUpdateUserPreferencesMutation();
  const [localTheme, setLocalTheme] = useState<AppTheme | null>(null);
  const theme = data?.theme ?? localTheme ?? "system";

  useEffect(() => {
    function applyResolvedTheme() {
      const isDark = theme === "dark" || (theme === "system" && prefersDark());
      document.documentElement.classList.toggle("dark", isDark);
    }

    applyResolvedTheme();
    if (theme !== "system") return;

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener("change", applyResolvedTheme);
    return () => media.removeEventListener("change", applyResolvedTheme);
  }, [theme]);

  return {
    theme,
    setTheme: (next) => {
      if (hasNoSession()) {
        setLocalTheme(next);
        return;
      }
      updateMutation.mutate({ theme: next });
    },
    isPending: updateMutation.isPending,
  };
}
