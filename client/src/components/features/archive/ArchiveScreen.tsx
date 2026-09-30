import { useState } from "react";
import { useArchiveDays } from "../../../hooks/useArchiveDays";
import type { ArchiveScreenProps } from "../../../types/archive";
import { ArchiveHeader } from "./ArchiveHeader";
import { ArchiveList } from "./ArchiveList";
import { ArchiveListSkeleton } from "./ArchiveListSkeleton";

export function ArchiveScreen({ onBack, onOpenArchivedDay }: ArchiveScreenProps) {
  const [search, setSearch] = useState("");
  const [date, setDate] = useState("");
  const { data, revealMore } = useArchiveDays(search, date);

  return (
    <div className="flex h-dvh flex-col">
      <ArchiveHeader
        search={search}
        onSearchChange={setSearch}
        date={date}
        onDateChange={setDate}
        onBack={onBack}
      />
      {data.isPending ? (
        <ArchiveListSkeleton />
      ) : (
        <ArchiveList data={data} onSelect={onOpenArchivedDay} onReachEnd={revealMore} />
      )}
    </div>
  );
}
