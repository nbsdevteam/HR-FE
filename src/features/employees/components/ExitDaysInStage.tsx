import { memo } from "react";
import { AlertTriangle } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import { EXIT_DAYS_TONE_CLASSES, exitDaysTone } from "../utils/exitProgress";

type ExitDaysInStageProps = {
  /** Null for a completed or cancelled process, which has no stage clock. */
  days: number | null;
};

/** Days in the current stage: plain below 3, amber from 3, red from 7. */
const ExitDaysInStage = ({ days }: ExitDaysInStageProps) => {
  if (days === null) return <span className="text-muted-foreground">—</span>;

  const tone = exitDaysTone(days);

  return (
    <span className={`inline-flex items-center gap-1 ${EXIT_DAYS_TONE_CLASSES[tone]}`} style={{ fontSize: 13 }} data-exit-days-tone={tone}>
      <span dir="ltr">{days}</span> {arabicSource("common.days_2")}
      {tone !== "normal" && <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />}
    </span>
  );
};

export default memo(ExitDaysInStage);
