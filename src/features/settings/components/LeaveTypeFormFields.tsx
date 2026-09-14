import { useCallback } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { InputField } from "@/shared/components";
import { arabicSource } from "@/i18n/source";
import type { NewLeaveTypeForm } from "../types";
import type { LeaveTypeFormErrors } from "../hooks/useLeaveTypeFormValidation";
import SettingsToggle from "./SettingsToggle";
import LeaveTypeAdvancedSections from "./LeaveTypeAdvancedSections";
import { inputCls } from "../styles";

type TLeaveTypeFormFieldsProps = {
  form: NewLeaveTypeForm;
  errors: LeaveTypeFormErrors;
  onFieldChange: (patch: Partial<NewLeaveTypeForm>) => void;
  showAdvanced: boolean;
  onToggleAdvanced: () => void;
  /**
   * Edit only — the read never returns the accrual override itself (see
   * `leaveTypeToEditForm`), only this derived-or-overridden effective rate.
   * Shown as a placeholder so a blank input doesn't look broken.
   */
  currentMonthlyAccrual?: number;
};

/**
 * The basic + advanced field grid shared by the Add and Edit leave type
 * forms — split out so both can wrap it in their own container (inline card
 * vs. modal) without duplicating every field's markup and handlers.
 */
const LeaveTypeFormFields = ({
  form,
  errors,
  onFieldChange,
  showAdvanced,
  onToggleAdvanced,
  currentMonthlyAccrual,
}: TLeaveTypeFormFieldsProps) => {
  const handleNameArChange = useCallback(
    (value: string): void => {
      onFieldChange({ name_ar: value });
    },
    [onFieldChange],
  );

  const handleNameEnChange = useCallback(
    (value: string): void => {
      onFieldChange({ name_en: value });
    },
    [onFieldChange],
  );

  const handleDefaultDaysChange = useCallback(
    (value: string): void => {
      onFieldChange({ default_days_per_year: value === "" ? 0 : Number(value) });
    },
    [onFieldChange],
  );

  const handleAccrualDaysChange = useCallback(
    (value: string): void => {
      onFieldChange({ accrual_days_per_month: value === "" ? 0 : Number(value) });
    },
    [onFieldChange],
  );

  const handleTogglePaid = useCallback((): void => {
    onFieldChange({ is_paid: !form.is_paid });
  }, [onFieldChange, form.is_paid]);

  const handleToggleAccrualEnabled = useCallback((): void => {
    onFieldChange({ accrual_enabled: !form.accrual_enabled });
  }, [onFieldChange, form.accrual_enabled]);

  const handleColorChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>): void => {
      onFieldChange({ color: e.target.value });
    },
    [onFieldChange],
  );

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <InputField
          value={form.name_ar}
          onChange={handleNameArChange}
          placeholder={arabicSource("settings.name_in_arabic")}
          className={inputCls}
        />
        <InputField
          value={form.name_en}
          onChange={handleNameEnChange}
          placeholder={arabicSource("settings.name_english")}
          className={inputCls}
          dir="ltr"
        />
        <InputField
          type="number"
          value={form.default_days_per_year || ""}
          onChange={handleDefaultDaysChange}
          placeholder={arabicSource("settings.days_year")}
          className={inputCls}
        />
        <div className="flex items-center gap-2">
          <SettingsToggle on={form.is_paid} onClick={handleTogglePaid} />
          <span className="text-foreground text-xs">
            {form.is_paid ? arabicSource("settings.leave_paid_label") : arabicSource("settings.leave_unpaid_label")}
          </span>
        </div>
        <input
          type="color"
          value={form.color}
          onChange={handleColorChange}
          className="w-9 h-9 rounded cursor-pointer border-0"
          aria-label={arabicSource("org_structure.color_label")}
        />
      </div>
      {errors.name && <p className="text-destructive text-xs">{errors.name}</p>}

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <SettingsToggle on={form.accrual_enabled} onClick={handleToggleAccrualEnabled} />
          <span className="text-foreground text-xs">{arabicSource("settings.enable_monthly_accrual")}</span>
        </div>
        {form.accrual_enabled && (
          <div>
            <InputField
              type="number"
              value={form.accrual_days_per_month || ""}
              onChange={handleAccrualDaysChange}
              placeholder={
                currentMonthlyAccrual
                  ? String(currentMonthlyAccrual)
                  : arabicSource("settings.accrual_days_per_month")
              }
              className={inputCls}
            />
            <p className="text-muted-foreground mt-1" style={{ fontSize: 11 }}>
              {currentMonthlyAccrual
                ? arabicSource("settings.accrual_days_per_month_edit_hint")
                : arabicSource("settings.accrual_days_per_month_hint")}
            </p>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onToggleAdvanced}
        className="flex items-center gap-1.5 text-primary text-xs cursor-pointer"
      >
        {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        {showAdvanced ? arabicSource("settings.hide_advanced_options") : arabicSource("settings.show_advanced_options")}
      </button>

      {showAdvanced && (
        <LeaveTypeAdvancedSections form={form} errors={errors} onFieldChange={onFieldChange} />
      )}
    </>
  );
};

export default LeaveTypeFormFields;
