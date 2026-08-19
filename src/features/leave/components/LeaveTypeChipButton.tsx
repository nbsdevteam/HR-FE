import { memo, useCallback } from "react";
import { arabicSource } from "@/i18n/source";
import type { DbLeaveType } from "@/shared/hooks";

type LeaveTypeChipButtonProps = {
  leaveType: DbLeaveType;
  isSelected: boolean;
  onSelect: (leaveType: DbLeaveType) => void;
};

const LeaveTypeChipButton = ({ leaveType, isSelected, onSelect }: LeaveTypeChipButtonProps) => {
  const handleClick = useCallback(() => onSelect(leaveType), [onSelect, leaveType]);

  return (
    <button
      onClick={handleClick}
      className={`px-3 py-2 rounded-lg border transition-all cursor-pointer ${
        isSelected
          ? "border-primary/40 text-primary"
          : "border-border text-muted-foreground hover:border-primary/20"
      }`}
      style={{ fontSize: 13, backgroundColor: isSelected ? leaveType.color + "15" : undefined }}
    >
      {leaveType.name_ar}
      {!leaveType.is_paid && <span className="text-destructive ms-1" style={{ fontSize: 10 }}>{arabicSource("leave.without_salary")}</span>}
    </button>
  );
};

export default memo(LeaveTypeChipButton);
