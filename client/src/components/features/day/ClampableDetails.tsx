import { useTranslation } from "react-i18next";
import { cn } from "../../../utils/cn";

/** Description+note only clamp (and offer a show-more toggle) past this combined length (design README). */
const CLAMP_THRESHOLD = 80;

export interface ClampableDetailsProps {
  description: string;
  note: string;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export function ClampableDetails({ description, note, isExpanded, onToggleExpand }: ClampableDetailsProps) {
  const { t } = useTranslation();

  if (description.length === 0 && note.length === 0) {
    return null;
  }

  const shouldClamp = description.length + note.length > CLAMP_THRESHOLD;

  return (
    <div className="mt-1.5 text-sm text-slate-600 dark:text-slate-300">
      <p className={cn(shouldClamp && !isExpanded && "line-clamp-2")}>
        {description}
        {description && note && " · "}
        {note}
      </p>
      {shouldClamp && (
        <button
          type="button"
          onClick={onToggleExpand}
          className="mt-0.5 text-xs font-medium text-violet-600 hover:underline dark:text-violet-400"
        >
          {t(isExpanded ? "day.event.showLess" : "day.event.showMore")}
        </button>
      )}
    </div>
  );
}
