import { useTranslation } from "react-i18next";
import { Button } from "../../ui";
import { useAppLanguage } from "../../../hooks/useAppLanguage";
import { useAppTheme } from "../../../hooks/useAppTheme";
import { useGoogleCalendarStatus } from "../../../hooks/useGoogleCalendarStatus";
import { useDisconnectGoogleCalendarMutation } from "../../../hooks/useDisconnectGoogleCalendarMutation";
import { useNotificationPreferences } from "../../../hooks/useNotificationPreferences";
import { useUpdateNotificationChannelMutation } from "../../../hooks/useUpdateNotificationChannelMutation";
import { useSignOutMutation } from "../../../hooks/useSignOutMutation";
import type { SettingsScreenProps } from "../../../types/settings";
import { AppearanceSection } from "./AppearanceSection";
import { GoogleCalendarSection } from "./GoogleCalendarSection";
import { LanguageSection } from "./LanguageSection";
import { NotificationsSection } from "./NotificationsSection";
import { SignOutSection } from "./SignOutSection";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api/v1";

export function SettingsScreen({ onBack }: SettingsScreenProps) {
  const { t } = useTranslation();
  const { language, setLanguage } = useAppLanguage();
  const { theme, setTheme } = useAppTheme();

  const { data: googleStatus } = useGoogleCalendarStatus();
  const disconnectGoogleCalendarMutation = useDisconnectGoogleCalendarMutation();

  const { data: notificationPreferences } = useNotificationPreferences();
  const updateNotificationChannelMutation = useUpdateNotificationChannelMutation();

  const signOutMutation = useSignOutMutation();

  function handleConnectGoogleCalendar() {
    window.location.href = `${API_URL}/gcal/connect`;
  }

  function handleToggleGoogleCalendarConnected(connected: boolean) {
    if (connected) {
      handleConnectGoogleCalendar();
      return;
    }
    disconnectGoogleCalendarMutation.mutate();
  }

  return (
    <div className="flex h-svh flex-col">
      <header className="flex items-center gap-1.5 p-4">
        <Button variant="ghost" size="icon" className="text-2xl" onClick={onBack} aria-label={t("day.header.backAria")}>
          &lt;
        </Button>
        <h1 className="text-xl font-semibold">{t("week.settingsAria")}</h1>
      </header>

      <div className="sy-scroll me-auto flex w-full max-w-[540px] flex-1 flex-col gap-6 overflow-y-auto p-4">
        <LanguageSection language={language} onChange={setLanguage} />
        <AppearanceSection theme={theme} onChange={setTheme} />
        <GoogleCalendarSection
          status={googleStatus ?? { connected: false }}
          onToggleConnected={handleToggleGoogleCalendarConnected}
          onReconnect={handleConnectGoogleCalendar}
        />
        <NotificationsSection
          channel={notificationPreferences?.channels[0] ?? "browser"}
          onChange={(channel) => updateNotificationChannelMutation.mutate(channel)}
        />
        <SignOutSection onSignOut={() => signOutMutation.mutate()} />
      </div>
    </div>
  );
}
