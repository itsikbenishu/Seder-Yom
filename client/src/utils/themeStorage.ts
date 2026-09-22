import type { AppTheme } from "@project/shared";

const THEME_STORAGE_KEY = "sy-theme";

/**
 * Last-known account theme, cached locally so index.html's inline bootstrap script
 * can guess right on the next page load instead of a plain OS-preference guess -
 * avoids a light/dark flash while `GET /preferences` is still in flight. That
 * script can't import this module (it must stay a plain blocking `<script>`, not
 * app code, to run before first paint) - keep its read logic in sync with this key
 * and format if either changes.
 */
export function writeCachedTheme(theme: AppTheme): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Best effort only - a stale/missing cache just means the next load falls back to the OS guess.
  }
}
