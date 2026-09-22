import type { AppLanguage, AppTheme, GoogleCalendarConnectionStatus, NotificationChannel } from "@project/shared";
import type { PushPermission } from "../hooks/usePushRegistration";

export type { AppLanguage, AppTheme, NotificationChannel };

export interface LanguageSectionProps {
  language: AppLanguage;
  onChange: (language: AppLanguage) => void;
  isPending?: boolean;
}

export interface AppearanceSectionProps {
  theme: AppTheme;
  onChange: (theme: AppTheme) => void;
  isPending?: boolean;
}

export interface GoogleCalendarSectionProps {
  status: GoogleCalendarConnectionStatus;
  onToggleConnected: (connected: boolean) => void;
  onReconnect: () => void;
  isPending?: boolean;
}

/**
 * UI picks one channel via a 2-way segmented control (design README §7); the
 * schema's `channels` field is an array capped at length 1 - wrapping/unwrapping
 * that array is the mutation hook's concern, not this component's.
 */
export interface NotificationsSectionProps {
  channel: NotificationChannel;
  onChange: (channel: NotificationChannel) => void;
  permission: PushPermission;
  isPending?: boolean;
}

export interface SignOutSectionProps {
  onSignOut: () => void;
  isPending?: boolean;
}

export interface SettingsScreenProps {
  onBack: () => void;
  language: AppLanguage;
  onLanguageChange: (language: AppLanguage) => void;
  isLanguagePending: boolean;
  theme: AppTheme;
  onThemeChange: (theme: AppTheme) => void;
  isThemePending: boolean;
}
