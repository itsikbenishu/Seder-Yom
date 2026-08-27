import { useEffect, useState } from "react";
import type { AppTheme } from "../types/settings";

const THEME_STORAGE_KEY = "sederyom:theme";

function readInitialTheme(): AppTheme {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === "light" || stored === "dark") {
    return stored;
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function useAppTheme(): { theme: AppTheme; setTheme: (theme: AppTheme) => void } {
  const [theme, setThemeState] = useState<AppTheme>(readInitialTheme);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  function setTheme(next: AppTheme): void {
    setThemeState(next);
  }

  return { theme, setTheme };
}
