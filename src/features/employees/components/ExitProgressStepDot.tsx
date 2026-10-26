import { memo } from "react";
import { Check, X } from "lucide-react";
import type { ExitProgressStage } from "@/shared/hooks";
import { EXIT_STAGE_DOT_CLASSES } from "../utils/exitProgress";

type ExitProgressStepDotProps = {
  stage: ExitProgressStage;
  label: string;
  size: "sm" | "lg";
  isLast: boolean;
  /** Under a large dot: the date it began, the days in it, or "Skipped" / "Cancelled here". */
  caption?: string;
};

/** The glyph inside a dot: a check once done, a cross where a cancelled process stopped. */
const DotGlyph = ({ state, iconClass }: { state: ExitProgressStage["state"]; iconClass: string }) => {
  if (state === "done") return <Check className={iconClass} />;
  if (state === "cancelled") return <X className={iconClass} />;
  return null;
};

/** One stage of the stepper, drawn from the state the backend sent. */
const ExitProgressStepDot = ({ stage, label, size, isLast, caption }: ExitProgressStepDotProps) => {
  const { state } = stage;
  const dotClass = `shrink-0 rounded-full border-2 flex items-center justify-center ${EXIT_STAGE_DOT_CLASSES[state]}`;

  if (size === "sm") {
    return (
      <li className="flex items-center" data-exit-stage={stage.key} data-exit-stage-state={state} title={label}>
        <span className={`${dotClass} w-3.5 h-3.5`} aria-label={label}>
          <DotGlyph state={state} iconClass="w-2 h-2" />
        </span>
        {!isLast && <span className="w-3 h-px bg-border" aria-hidden="true" />}
      </li>
    );
  }

  return (
    <li
      className="relative flex-1 flex flex-col items-center gap-1 text-center"
      data-exit-stage={stage.key}
      data-exit-stage-state={state}
      aria-current={state === "current" ? "step" : undefined}
    >
      {!isLast && <span className="absolute top-3 start-1/2 w-full h-px bg-border" aria-hidden="true" />}
      <span className={`${dotClass} relative w-6 h-6 bg-background`}>
        <DotGlyph state={state} iconClass="w-3.5 h-3.5" />
      </span>
      <span
        className={state === "current" ? "text-foreground font-semibold" : "text-muted-foreground"}
        style={{ fontSize: 12 }}
      >
        {label}
      </span>
      {caption && <span className="text-muted-foreground" style={{ fontSize: 11 }}>{caption}</span>}
    </li>
  );
};

export default memo(ExitProgressStepDot);
