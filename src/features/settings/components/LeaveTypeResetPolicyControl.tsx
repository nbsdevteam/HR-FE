import { useCallback } from "react";
import { Select } from "@/shared/components";
import { arabicSource } from "@/i18n/source";
import type { DbLeaveType, LeaveBalanceResetPolicy } from "@/shared/hooks";
import { BALANCE_RESET_POLICY_OPTIONS } from "../constants/settings";

type TLeaveTypeResetPolicyControlProps = {
  leaveType: DbLeaveType;
  /** `false` renders a read-only badge — the same fact, without the control. */
  canManage: boolean;
  onChange: (leaveTypeId: string, policy: LeaveBalanceResetPolicy) => void;
};

const LeaveTypeResetPolicyControl = ({
  leaveType,
  canManage,
  onChange,
}: TLeaveTypeResetPolicyControlProps) => {
  const handleChange = useCallback(
    (value: string): void => {
      if (value === leaveType.balance_reset_policy) return;
      onChange(leaveType.id, value as LeaveBalanceResetPolicy);
    },
    [leaveType.id, leaveType.balance_reset_policy, onChange],
  );

  if (!canManage) {
    return (
      <span className="text-muted-foreground text-xs">
        {leaveType.balance_reset_policy === "reset_yearly"
          ? arabicSource("settings.balance_reset_every_year")
          : arabicSource("settings.balance_accumulate_across_years")}
      </span>
    );
  }

  return (
    <Select
      value={leaveType.balance_reset_policy}
      onChange={handleChange}
      options={BALANCE_RESET_POLICY_OPTIONS}
      title={arabicSource("settings.balance_at_year_end_label")}
      aria-label={arabicSource("settings.balance_at_year_end_label")}
      className="h-6 px-1.5 text-xs max-w-56"
    />
  );
};

export default LeaveTypeResetPolicyControl;
