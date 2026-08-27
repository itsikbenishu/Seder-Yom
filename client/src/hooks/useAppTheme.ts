import { useEffect } from "react";
import type { AppTheme } from "@project/shared";
import { useUserPreferences } from "./useUserPreferences";
import { useUpdateUserPreferencesMutation } from "./useUpdateUserPreferencesMutation";

function prefersDark(): boolean {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

/**
 * Account-level preference — the server is the source of truth once
 * signed in; before that (or if the fetch fails) this falls back to "system". `theme`
 * itself can be a genuine, persisted "system" choice (not just a pre-auth fallback),
 * in which case the applied light/dark class keeps following the OS preference live
 * for as long as the app stays open.
 */
export function useAppTheme(): { theme: AppTheme; setTheme: (theme: AppTheme) => void } {
  const { data } = useUserPreferences();
  const updateMutation = useUpdateUserPreferencesMutation();
  const theme = data?.theme ?? "system";

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
    setTheme: (next) => updateMutation.mutate({ theme: next }),
  };
}
