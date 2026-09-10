import { useCallback } from "react";
import { Select } from "@/shared/components";
import { arabicSource } from "@/i18n/source";
import { BALANCE_RESET_POLICY_OPTIONS } from "../constants/settings";
import type { LeaveBalanceResetPolicy, NewLeaveTypeForm } from "../types";

type TLeaveTypeCarryoverFieldsProps = {
  form: NewLeaveTypeForm;
  onFieldChange: (patch: Partial<NewLeaveTypeForm>) => void;
};

const LeaveTypeCarryoverFields = ({ form, onFieldChange }: TLeaveTypeCarryoverFieldsProps) => {
  const handleBalanceResetPolicyChange = useCallback(
    (value: string): void => {
      onFieldChange({ balance_reset_policy: value as LeaveBalanceResetPolicy });
    },
    [onFieldChange],
  );

  return (
    <div className="p-3 rounded-lg bg-muted/10 border border-border/20 space-y-3">
      <h4 className="text-muted-foreground text-xs">{arabicSource("settings.advanced_section_carryover_encashment")}</h4>

      <div>
        <Select
          label={arabicSource("settings.balance_at_year_end_label")}
          labelClassName="text-foreground text-xs block mb-1.5"
          value={form.balance_reset_policy}
          onChange={handleBalanceResetPolicyChange}
          options={BALANCE_RESET_POLICY_OPTIONS}
          className="h-9 px-3 w-full sm:w-80"
        />
        <p className="text-muted-foreground/70 text-xs mt-1">
          {arabicSource("settings.balance_at_year_end_hint")}
        </p>
      </div>
    </div>
  );
};

export default LeaveTypeCarryoverFields;
