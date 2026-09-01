import { lazy, Suspense, useEffect, useState, useTransition } from "react";
import type { ArchivedDay } from "@project/shared";
import { hasNoSession, onSessionEnd } from "./services/queryClient";

const ArchiveScreen = lazy(() =>
  import("./components/features/archive").then((m) => ({ default: m.ArchiveScreen })),
);
const ArchiveDayScreen = lazy(() =>
  import("./components/features/archiveDay").then((m) => ({ default: m.ArchiveDayScreen })),
);
const DayScreen = lazy(() => import("./components/features/day").then((m) => ({ default: m.DayScreen })));
const LoginScreen = lazy(() => import("./components/features/login").then((m) => ({ default: m.LoginScreen })));
const SettingsScreen = lazy(() =>
  import("./components/features/settings").then((m) => ({ default: m.SettingsScreen })),
);
const TwoFaScreen = lazy(() => import("./components/features/twofa").then((m) => ({ default: m.TwoFaScreen })));
const WeekScreen = lazy(() => import("./components/features/week").then((m) => ({ default: m.WeekScreen })));

type Screen =
  | { screen: "week" }
  | { screen: "day"; dayOfWeek: number }
  | { screen: "archive" }
  | { screen: "archiveDay"; day: ArchivedDay }
  | { screen: "settings" }
  | { screen: "login" }
  | { screen: "twofa"; email: string };

function App() {
  const [screen, setScreen] = useState<Screen>({ screen: "week" });
  const [, startTransition] = useTransition();

  // No upfront auth check — Login only appears once a mutation 401s.
  useEffect(() => onSessionEnd(() => startTransition(() => setScreen({ screen: "login" }))), [startTransition]);

  // Settings/Archive have no query of their own to catch a missing session, so check first.
  function goToDataScreen(target: Screen) {
    startTransition(() => setScreen(hasNoSession() ? { screen: "login" } : target));
  }

  const fallback = (
    <div className="flex min-h-svh items-center justify-center">
      <span className="text-sm text-neutral-500">Loading…</span>
    </div>
  );

  return (
    <Suspense fallback={fallback}>
      {screen.screen === "login" && (
        <LoginScreen
          onLoginSuccess={(email) => startTransition(() => setScreen({ screen: "twofa", email }))}
        />
      )}

      {screen.screen === "twofa" && (
        <TwoFaScreen
          email={screen.email}
          onVerifySuccess={() => startTransition(() => setScreen({ screen: "week" }))}
        />
      )}

      {screen.screen === "settings" && (
        <SettingsScreen onBack={() => startTransition(() => setScreen({ screen: "week" }))} />
      )}

      {screen.screen === "archiveDay" && (
        <ArchiveDayScreen
          day={screen.day}
          onBackToArchive={() => startTransition(() => setScreen({ screen: "archive" }))}
        />
      )}

      {screen.screen === "archive" && (
        <ArchiveScreen
          onBack={() => startTransition(() => setScreen({ screen: "week" }))}
          onOpenArchivedDay={(day) => startTransition(() => setScreen({ screen: "archiveDay", day }))}
        />
      )}

      {screen.screen === "day" && (
        <DayScreen
          dayOfWeek={screen.dayOfWeek}
          onBackToWeek={() => startTransition(() => setScreen({ screen: "week" }))}
          onNavigateDay={(dayOfWeek) => startTransition(() => setScreen({ screen: "day", dayOfWeek }))}
          onOpenArchive={() => goToDataScreen({ screen: "archive" })}
        />
      )}

      {screen.screen === "week" && (
        <WeekScreen
          onSelectDay={(dayOfWeek) => startTransition(() => setScreen({ screen: "day", dayOfWeek }))}
          onOpenArchive={() => goToDataScreen({ screen: "archive" })}
          onOpenSettings={() => goToDataScreen({ screen: "settings" })}
        />
      )}
    </Suspense>
  );
}

export default App;
