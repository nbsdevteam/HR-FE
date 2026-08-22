import { memo } from "react";
import { stageColors } from "../constants/recruitment";

type ApplicantStageButtonProps = {
  stage: string;
  isActive: boolean;
  // onSelect: (stage: string) => void;
};

const ApplicantStageButton = ({
  stage,
  isActive,
  // onSelect,
}: ApplicantStageButtonProps) => (
  <span
    // onClick={() => onSelect(stage)}
    className={`px-3 py-1.5 rounded-lg border transition-all cursor-not-allowed ${isActive ? stageColors[stage] : "border-border/30 text-muted-foreground hover:bg-muted/20"}`}
    style={{ fontSize: 12 }}
  >
    {stage}
  </span>
);

export default memo(ApplicantStageButton);
