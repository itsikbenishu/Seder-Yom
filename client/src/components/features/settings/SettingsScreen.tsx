import { useTranslation } from "react-i18next";
import { Button } from "../../ui";
import { hasNoSession } from "../../../services/queryClient";
import { useRequireSession } from "../../../hooks/useRequireSession";
import { useGoogleCalendarStatus } from "../../../hooks/useGoogleCalendarStatus";
import { useDisconnectGoogleCalendarMutation } from "../../../hooks/useDisconnectGoogleCalendarMutation";
import { useUserPreferences } from "../../../hooks/useUserPreferences";
import { useUpdateUserPreferencesMutation } from "../../../hooks/useUpdateUserPreferencesMutation";
import { usePushRegistration } from "../../../hooks/usePushRegistration";
import { useSignOutMutation } from "../../../hooks/useSignOutMutation";
import type { SettingsScreenProps } from "../../../types/settings";
import { AppearanceSection } from "./AppearanceSection";
import { GoogleCalendarSection } from "./GoogleCalendarSection";
import { LanguageSection } from "./LanguageSection";
import { NotificationsSection } from "./NotificationsSection";
import { SignOutSection } from "./SignOutSection";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api/v1";

export function SettingsScreen({
  onBack,
  language,
  onLanguageChange,
  isLanguagePending,
  theme,
  onThemeChange,
  isThemePending,
}: SettingsScreenProps) {
  const { t } = useTranslation();

  const { data: googleStatus } = useGoogleCalendarStatus();
  const disconnectGoogleCalendarMutation = useDisconnectGoogleCalendarMutation();

  const { data: userPreferences } = useUserPreferences();
  const updatePreferencesMutation = useUpdateUserPreferencesMutation();
  const { permission: pushPermission, enable: enablePush } = usePushRegistration();

  const signOutMutation = useSignOutMutation();
  const requireSession = useRequireSession();

  function handleConnectGoogleCalendar() {
    requireSession(() => {
      window.location.href = `${API_URL}/gcal/connect`;
    });
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
        <LanguageSection language={language} onChange={onLanguageChange} isPending={isLanguagePending} />
        <AppearanceSection theme={theme} onChange={onThemeChange} isPending={isThemePending} />
        <GoogleCalendarSection
          status={googleStatus ?? { connected: false }}
          onToggleConnected={handleToggleGoogleCalendarConnected}
          onReconnect={handleConnectGoogleCalendar}
          isPending={disconnectGoogleCalendarMutation.isPending}
        />
        <NotificationsSection
          channel={userPreferences?.channels[0] ?? "browser"}
          permission={pushPermission}
          onChange={(channel) => {
            updatePreferencesMutation.mutate({ channels: [channel] });
            if (channel === "browser") enablePush();
          }}
          isPending={updatePreferencesMutation.isPending}
        />
        {!hasNoSession() && (
          <SignOutSection onSignOut={() => signOutMutation.mutate()} isPending={signOutMutation.isPending} />
        )}
      </div>
    </div>
  );
}
