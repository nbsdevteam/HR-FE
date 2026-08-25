import { memo, useCallback } from "react";
import { Button } from "@/shared/components";
import { arabicSource } from "@/i18n/source";
import { useLocalizedName } from "@/i18n/useLocalizedName";
import type { DbLeaveType } from "@/shared/hooks";

type LeaveTypeChipButtonProps = {
  leaveType: DbLeaveType;
  isSelected: boolean;
  onSelect: (leaveType: DbLeaveType) => void;
};

const LeaveTypeChipButton = ({ leaveType, isSelected, onSelect }: LeaveTypeChipButtonProps) => {
  const { primary } = useLocalizedName(leaveType.name_ar, leaveType.name_en);
  const handleClick = useCallback(() => onSelect(leaveType), [onSelect, leaveType]);

  return (
    <Button
      variant="chip"
      active={isSelected}
      size="unstyled"
      rounded="rounded-lg"
      onClick={handleClick}
      className="px-3 py-2"
      style={{ fontSize: 13, backgroundColor: isSelected ? leaveType.color + "15" : undefined }}
    >
      <span data-i18n-ignore>{primary}</span>
      {!leaveType.is_paid && <span className="text-destructive ms-1" style={{ fontSize: 10 }}>{arabicSource("leave.without_salary")}</span>}
    </Button>
  );
};

export default memo(LeaveTypeChipButton);
