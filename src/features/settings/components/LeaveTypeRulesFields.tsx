import { useCallback } from "react";
import { InputField } from "@/shared/components";
import { arabicSource } from "@/i18n/source";
import { inputCls } from "../styles";
import type { NewLeaveTypeForm } from "../types";
import type { LeaveTypeFormErrors } from "../hooks/useLeaveTypeFormValidation";

type TLeaveTypeRulesFieldsProps = {
  form: NewLeaveTypeForm;
  errors: LeaveTypeFormErrors;
  onFieldChange: (patch: Partial<NewLeaveTypeForm>) => void;
};

const LeaveTypeRulesFields = ({ form, errors, onFieldChange }: TLeaveTypeRulesFieldsProps) => {
  const handleAllowHalfDayChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>): void => {
      onFieldChange({ allow_half_day: e.target.checked });
    },
    [onFieldChange],
  );

  const handleAllowHourlyChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>): void => {
      onFieldChange({ allow_hourly: e.target.checked });
    },
    [onFieldChange],
  );

  const handleRequiresAttachmentChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>): void => {
      onFieldChange({ requires_attachment: e.target.checked });
    },
    [onFieldChange],
  );

  const handleExcuseOnInsufficientBalanceChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>): void => {
      onFieldChange({ excuse_on_insufficient_balance: e.target.checked });
    },
    [onFieldChange],
  );

  const handleMinServiceMonthsChange = useCallback(
    (value: string): void => {
      onFieldChange({ min_service_months: value === "" ? 0 : Number(value) });
    },
    [onFieldChange],
  );

  return (
    <div className="p-3 rounded-lg bg-muted/10 border border-border/20 space-y-3">
      <h4 className="text-muted-foreground text-xs">{arabicSource("settings.advanced_section_leave_rules")}</h4>

      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 cursor-pointer text-xs text-foreground">
          <input type="checkbox" checked={form.allow_half_day} onChange={handleAllowHalfDayChange} className="rounded" />
          {arabicSource("common.half_a_day")}
        </label>
        <label className="flex items-center gap-2 cursor-pointer text-xs text-foreground">
          <input type="checkbox" checked={form.allow_hourly} onChange={handleAllowHourlyChange} className="rounded" />
          {arabicSource("settings.allow_hourly_leave")}
        </label>
        <label className="flex items-center gap-2 cursor-pointer text-xs text-foreground">
          <input type="checkbox" checked={form.requires_attachment} onChange={handleRequiresAttachmentChange} className="rounded" />
          {arabicSource("settings.attachment_required")}
        </label>
      </div>

      <div>
        <InputField
          type="number"
          value={form.min_service_months || ""}
          onChange={handleMinServiceMonthsChange}
          placeholder={arabicSource("settings.min_service_months_label")}
          className={`${inputCls} w-full sm:w-56`}
        />
        {errors.min_service_months && (
          <p className="text-destructive text-xs mt-1">{errors.min_service_months}</p>
        )}
      </div>

      <label className="flex items-start gap-2 cursor-pointer text-xs text-foreground">
        <input
          type="checkbox"
          checked={form.excuse_on_insufficient_balance}
          onChange={handleExcuseOnInsufficientBalanceChange}
          className="rounded mt-0.5"
        />
        <span>
          {arabicSource("settings.manager_excuse_label")}
          <span className="block text-muted-foreground mt-0.5">{arabicSource("settings.manager_excuse_help")}</span>
        </span>
      </label>
    </div>
  );
};

export default LeaveTypeRulesFields;
