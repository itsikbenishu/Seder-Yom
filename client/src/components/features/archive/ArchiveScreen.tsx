import { useState } from "react";
import { useArchiveDays } from "../../../hooks/useArchiveDays";
import type { ArchiveScreenProps } from "../../../types/archive";
import { ArchiveHeader } from "./ArchiveHeader";
import { ArchiveList } from "./ArchiveList";
import { ArchiveListSkeleton } from "./ArchiveListSkeleton";

export function ArchiveScreen({ onBack, onOpenArchivedDay }: ArchiveScreenProps) {
  const [search, setSearch] = useState("");
  const { data, revealMore } = useArchiveDays(search);

  return (
    <div className="flex h-dvh flex-col">
      <ArchiveHeader search={search} onSearchChange={setSearch} onBack={onBack} />
      {data.isPending ? (
        <ArchiveListSkeleton />
      ) : (
        <ArchiveList data={data} onSelect={onOpenArchivedDay} onReachEnd={revealMore} />
      )}
    </div>
  );
}
