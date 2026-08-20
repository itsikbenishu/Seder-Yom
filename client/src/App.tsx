import { useState } from "react";
import { DayScreen } from "./components/features/day";
import { WeekScreen } from "./components/features/week";

type Screen = { screen: "week" } | { screen: "day"; dayOfWeek: number };

function App() {
  const [screen, setScreen] = useState<Screen>({ screen: "week" });

  if (screen.screen === "day") {
    return (
      <DayScreen
        dayOfWeek={screen.dayOfWeek}
        onBackToWeek={() => setScreen({ screen: "week" })}
        onNavigateDay={(dayOfWeek) => setScreen({ screen: "day", dayOfWeek })}
        onOpenArchive={() => {}}
        onAddEvent={() => {}}
        onEditEvent={() => {}}
      />
    );
  }

  return <WeekScreen onSelectDay={(dayOfWeek) => setScreen({ screen: "day", dayOfWeek })} />;
}

export default App;
