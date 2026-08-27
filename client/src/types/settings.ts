import type { GoogleCalendarConnectionStatus } from "@project/shared";

export type AppLanguage = "he" | "en";
export type AppTheme = "light" | "dark";

/** Mirrors notificationPreferencesSchema's `channels` enum (shared/notificationPreferences.schema.ts) — not re-exported from there, so kept as a literal union here. */
export type NotificationChannel = "browser" | "mobile";

export interface LanguageSectionProps {
  language: AppLanguage;
  onChange: (language: AppLanguage) => void;
}

export interface AppearanceSectionProps {
  theme: AppTheme;
  onChange: (theme: AppTheme) => void;
}

export interface GoogleCalendarSectionProps {
  status: GoogleCalendarConnectionStatus;
  onToggleConnected: (connected: boolean) => void;
  onReconnect: () => void;
}

/**
 * UI picks one channel via a 2-way segmented control (design README §7); the
 * schema's `channels` field is an array capped at length 1 — wrapping/unwrapping
 * that array is the mutation hook's concern, not this component's.
 */
export interface NotificationsSectionProps {
  channel: NotificationChannel;
  onChange: (channel: NotificationChannel) => void;
}

export interface SignOutSectionProps {
  onSignOut: () => void;
}

export interface SettingsScreenProps {
  onBack: () => void;
}
