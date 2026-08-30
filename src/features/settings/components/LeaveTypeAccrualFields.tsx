import { useCallback } from "react";
import { Select } from "@/shared/components";
import { arabicSource } from "@/i18n/source";
import { ACCRUAL_OPTIONS } from "../constants/settings";
import type { NewLeaveTypeForm } from "../types";

type TLeaveTypeAccrualFieldsProps = {
  form: NewLeaveTypeForm;
  onFieldChange: (patch: Partial<NewLeaveTypeForm>) => void;
};

const LeaveTypeAccrualFields = ({ form, onFieldChange }: TLeaveTypeAccrualFieldsProps) => {
  const handleAccrualMethodChange = useCallback(
    (value: string): void => {
      onFieldChange({ accrual_method: value });
    },
    [onFieldChange],
  );

  return (
    <div className="p-3 rounded-lg bg-muted/10 border border-border/20 space-y-2">
      <h4 className="text-muted-foreground text-xs">{arabicSource("settings.advanced_section_accrual")}</h4>
      <Select
        value={form.accrual_method}
        onChange={handleAccrualMethodChange}
        options={ACCRUAL_OPTIONS}
        className="h-9 px-3 w-full sm:w-56"
      />
    </div>
  );
};

export default LeaveTypeAccrualFields;
