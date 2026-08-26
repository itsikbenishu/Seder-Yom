import { useState } from "react";
import type { ArchivedDay } from "@project/shared";
import { ArchiveScreen } from "./components/features/archive";
import { ArchiveDayScreen } from "./components/features/archiveDay";
import { DayScreen } from "./components/features/day";
import { WeekScreen } from "./components/features/week";

type Screen =
  | { screen: "week" }
  | { screen: "day"; dayOfWeek: number }
  | { screen: "archive" }
  | { screen: "archiveDay"; day: ArchivedDay };

function App() {
  const [screen, setScreen] = useState<Screen>({ screen: "week" });

  if (screen.screen === "archiveDay") {
    return (
      <ArchiveDayScreen day={screen.day} onBackToArchive={() => setScreen({ screen: "archive" })} />
    );
  }

  if (screen.screen === "archive") {
    return (
      <ArchiveScreen
        onBack={() => setScreen({ screen: "week" })}
        onOpenArchivedDay={(day) => setScreen({ screen: "archiveDay", day })}
      />
    );
  }

  if (screen.screen === "day") {
    return (
      <DayScreen
        dayOfWeek={screen.dayOfWeek}
        onBackToWeek={() => setScreen({ screen: "week" })}
        onNavigateDay={(dayOfWeek) => setScreen({ screen: "day", dayOfWeek })}
        onOpenArchive={() => setScreen({ screen: "archive" })}
      />
    );
  }

  return (
    <WeekScreen
      onSelectDay={(dayOfWeek) => setScreen({ screen: "day", dayOfWeek })}
      onOpenArchive={() => setScreen({ screen: "archive" })}
    />
  );
}

export default App;
