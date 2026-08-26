import { useState } from "react";
import { ArchiveScreen } from "./components/features/archive";
import { DayScreen } from "./components/features/day";
import { WeekScreen } from "./components/features/week";

type Screen = { screen: "week" } | { screen: "day"; dayOfWeek: number } | { screen: "archive" };

function App() {
  const [screen, setScreen] = useState<Screen>({ screen: "week" });

  if (screen.screen === "archive") {
    return (
      <ArchiveScreen
        onBack={() => setScreen({ screen: "week" })}
        onOpenArchivedDay={() => {}}
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
