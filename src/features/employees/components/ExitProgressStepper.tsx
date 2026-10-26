import { memo } from "react";
import { formatDate } from "@/i18n/format";
import { arabicSource } from "@/i18n/source";
import type { ExitProgressStage } from "@/shared/hooks";
import ExitProgressStepDot from "./ExitProgressStepDot";

type ExitProgressStepperProps = {
  stages: ExitProgressStage[];
  statusLabels: Record<string, string>;
  size: "sm" | "lg";
  /** Shown under the current stage on the large stepper. */
  daysInStage?: number | null;
  /** When each stage began, keyed by stage; shown under the finished ones on the large stepper. */
  dates?: Record<string, string | null>;
};

type CaptionContext = Pick<ExitProgressStepperProps, "daysInStage" | "dates">;

const stageCaption = (stage: ExitProgressStage, { daysInStage, dates }: CaptionContext): string | undefined => {
  switch (stage.state) {
    case "current":
      return daysInStage === null || daysInStage === undefined
        ? undefined
        : `${daysInStage} ${arabicSource("common.days_2")}`;
    case "done": {
      const began = dates?.[stage.key];
      return began ? formatDate(began) : undefined;
    }
    case "skipped":
      return arabicSource("lifecycle.exit_stage_skipped");
    case "cancelled":
      return arabicSource("lifecycle.exit_stage_cancelled_here");
    default:
      return undefined;
  }
};

/**
 * The five stages as dots, by the `progress.stages` the backend sends. The
 * small one sits in the list row; the large one heads the record, with dates
 * and the days in the current stage under the dots.
 */
const ExitProgressStepper = ({ stages, statusLabels, size, daysInStage, dates }: ExitProgressStepperProps) => {
  if (stages.length === 0) return null;

  return (
    <ol className={size === "sm" ? "flex items-center" : "flex items-start w-full"} data-exit-stepper={size}>
      {stages.map((stage, index) => (
        <ExitProgressStepDot
          key={stage.key}
          stage={stage}
          label={statusLabels[stage.key] ?? stage.key}
          size={size}
          isLast={index === stages.length - 1}
          caption={size === "lg" ? stageCaption(stage, { daysInStage, dates }) : undefined}
        />
      ))}
    </ol>
  );
};

export default memo(ExitProgressStepper);
