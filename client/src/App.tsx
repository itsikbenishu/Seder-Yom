import { lazy, Suspense, useState, useTransition } from "react";
import type { ArchivedDay } from "@project/shared";

const ArchiveScreen = lazy(() =>
  import("./components/features/archive").then((m) => ({ default: m.ArchiveScreen })),
);
const ArchiveDayScreen = lazy(() =>
  import("./components/features/archiveDay").then((m) => ({ default: m.ArchiveDayScreen })),
);
const DayScreen = lazy(() =>
  import("./components/features/day").then((m) => ({ default: m.DayScreen })),
);
const SettingsScreen = lazy(() =>
  import("./components/features/settings").then((m) => ({ default: m.SettingsScreen })),
);
const WeekScreen = lazy(() =>
  import("./components/features/week").then((m) => ({ default: m.WeekScreen })),
);

type Screen =
  | { screen: "week" }
  | { screen: "day"; dayOfWeek: number }
  | { screen: "archive" }
  | { screen: "archiveDay"; day: ArchivedDay }
  | { screen: "settings" };

function App() {
  const [screen, setScreen] = useState<Screen>({ screen: "week" });
  const [, startTransition] = useTransition();

  const fallback = (
    <div className="flex min-h-svh items-center justify-center">
      <span className="text-sm text-neutral-500">Loading…</span>
    </div>
  );

  return (
    <Suspense fallback={fallback}>
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
          onOpenArchive={() => startTransition(() => setScreen({ screen: "archive" }))}
        />
      )}

      {screen.screen === "week" && (
        <WeekScreen
          onSelectDay={(dayOfWeek) => startTransition(() => setScreen({ screen: "day", dayOfWeek }))}
          onOpenArchive={() => startTransition(() => setScreen({ screen: "archive" }))}
          onOpenSettings={() => startTransition(() => setScreen({ screen: "settings" }))}
        />
      )}
    </Suspense>
  );
}

export default App;
