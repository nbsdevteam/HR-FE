import { memo, useCallback } from "react";
import { Button } from "@/shared/components";
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
    <Button
      variant="chip"
      active={isSelected}
      size="unstyled"
      rounded="rounded-lg"
      onClick={handleClick}
      className="px-3 py-1.5"
      style={{ fontSize: 13 }}
    >
      {label}
    </Button>
  );
};

export default memo(LeaveDurationOptionButton);
