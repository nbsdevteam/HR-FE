import { memo, useCallback } from "react";
import type { LeaveDurationUnit } from "../hooks/useLeaveHourlyAttachment";

type LeaveDurationOptionButtonProps = {
  unit: LeaveDurationUnit;
  label: string;
  isSelected: boolean;
  onSelect: (unit: LeaveDurationUnit) => void;
};

const LeaveDurationOptionButton = ({ unit, label, isSelected, onSelect }: LeaveDurationOptionButtonProps) => {
  const handleClick = useCallback(() => onSelect(unit), [onSelect, unit]);

  return (
    <button
      onClick={handleClick}
      className={`px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
        isSelected ? "border-primary/40 text-primary bg-primary/10" : "border-border text-muted-foreground hover:border-primary/20"
      }`}
      style={{ fontSize: 13 }}
    >
      {label}
    </button>
  );
};

export default memo(LeaveDurationOptionButton);
