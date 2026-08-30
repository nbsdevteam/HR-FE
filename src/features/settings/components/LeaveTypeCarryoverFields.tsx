import { useCallback } from "react";
import { InputField } from "@/shared/components";
import { arabicSource } from "@/i18n/source";
import { inputCls } from "../styles";
import type { NewLeaveTypeForm } from "../types";
import type { LeaveTypeFormErrors } from "../hooks/useLeaveTypeFormValidation";

type TLeaveTypeCarryoverFieldsProps = {
  form: NewLeaveTypeForm;
  errors: LeaveTypeFormErrors;
  onFieldChange: (patch: Partial<NewLeaveTypeForm>) => void;
};

const LeaveTypeCarryoverFields = ({ form, errors, onFieldChange }: TLeaveTypeCarryoverFieldsProps) => {
  const handleCarryoverAllowedChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>): void => {
      onFieldChange({ is_carryover_allowed: e.target.checked });
    },
    [onFieldChange],
  );

  const handleMaxCarryoverDaysChange = useCallback(
    (value: string): void => {
      onFieldChange({ max_carryover_days: value === "" ? 0 : Number(value) });
    },
    [onFieldChange],
  );

  const handleEncashableChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>): void => {
      onFieldChange({ is_encashable: e.target.checked });
    },
    [onFieldChange],
  );

  const handleEncashmentPercentageChange = useCallback(
    (value: string): void => {
      onFieldChange({ encashment_percentage: value === "" ? 0 : Number(value) });
    },
    [onFieldChange],
  );

  return (
    <div className="p-3 rounded-lg bg-muted/10 border border-border/20 space-y-3">
      <h4 className="text-muted-foreground text-xs">{arabicSource("settings.advanced_section_carryover_encashment")}</h4>

      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 cursor-pointer text-xs text-foreground">
          <input type="checkbox" checked={form.is_carryover_allowed} onChange={handleCarryoverAllowedChange} className="rounded" />
          {arabicSource("common.relay")}
        </label>
        {form.is_carryover_allowed && (
          <InputField
            type="number"
            value={form.max_carryover_days || ""}
            onChange={handleMaxCarryoverDaysChange}
            placeholder={arabicSource("settings.carryover_days_label")}
            className={inputCls}
          />
        )}
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 cursor-pointer text-xs text-foreground">
          <input type="checkbox" checked={form.is_encashable} onChange={handleEncashableChange} className="rounded" />
          {arabicSource("common.exchangeable")}
        </label>
        {form.is_encashable && (
          <div>
            <InputField
              type="number"
              min={0}
              max={100}
              value={form.encashment_percentage || ""}
              onChange={handleEncashmentPercentageChange}
              placeholder={arabicSource("settings.encashment_percentage_label")}
              className={inputCls}
            />
            {errors.encashment_percentage && (
              <p className="text-destructive text-xs mt-1">{errors.encashment_percentage}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaveTypeCarryoverFields;
