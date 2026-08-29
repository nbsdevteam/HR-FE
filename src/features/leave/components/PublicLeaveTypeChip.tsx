import { memo, useCallback } from "react";
import { useLocalizedName } from "@/i18n/useLocalizedName";
import type { PublicLeaveTypeOption } from "../types/publicLeave";

type PublicLeaveTypeChipProps = {
  leaveType: PublicLeaveTypeOption;
  selected: boolean;
  onSelect: (leaveTypeId: number) => void;
};

const PublicLeaveTypeChip = ({ leaveType, selected, onSelect }: PublicLeaveTypeChipProps) => {
  const { primary } = useLocalizedName(leaveType.name_ar, leaveType.name);

  const handleClick = useCallback((): void => {
    onSelect(leaveType.id);
  }, [leaveType.id, onSelect]);

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`px-3.5 py-2 rounded-full border transition-colors cursor-pointer ${
        selected ? "border-primary bg-primary/10 text-primary" : "border-border text-foreground hover:border-primary/50"
      }`}
      style={{ fontSize: 12.5, borderColor: selected ? leaveType.color || undefined : undefined }}
      data-i18n-ignore
    >
      {primary}
    </button>
  );
};

export default memo(PublicLeaveTypeChip);
