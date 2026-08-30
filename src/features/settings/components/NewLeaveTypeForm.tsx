import { useState, useCallback, useEffect } from "react";
import { motion } from "motion/react";
import { ChevronDown, ChevronUp, Save } from "lucide-react";
import { Button, InputField } from "@/shared/components";
import { arabicSource } from "@/i18n/source";
import type { NewLeaveTypeForm as NewLeaveTypeFormState } from "../types";
import { useLeaveTypeFormValidation } from "../hooks/useLeaveTypeFormValidation";
import SettingsToggle from "./SettingsToggle";
import LeaveTypeAdvancedSections from "./LeaveTypeAdvancedSections";
import { CONTAINER_CLASS, inputCls } from "../styles";
import { EXPAND_MOTION } from "../constants/settings";

type TNewLeaveTypeFormProps = {
  form: NewLeaveTypeFormState;
  onFieldChange: (patch: Partial<NewLeaveTypeFormState>) => void;
  onSave: () => void;
  onCancel: () => void;
};

/**
 * Basic fields up front, everything else behind "Advanced options" (backend
 * hand-off "Leave Type Settings — Add Leave Type form refactor"). Bespoke
 * tree instead of the generic `NewTypeForm` — the conditional-field logic
 * here (accrual/carryover/encashment sub-fields) isn't something the flat
 * `TypeFormRowConfig` system can express.
 */
const NewLeaveTypeForm = ({
  form,
  onFieldChange,
  onSave,
  onCancel,
}: TNewLeaveTypeFormProps) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { errors, isValid, hasAdvancedError } = useLeaveTypeFormValidation(form);

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

  const handleToggleAdvanced = useCallback((): void => {
    setShowAdvanced((prev) => !prev);
  }, []);

  // A validation error on an Advanced-only field (encashment %, days-per-request
  // range) means Save is disabled for a reason the user can't see while the
  // section is collapsed — auto-expand so it's never a mystery.
  useEffect(() => {
    if (hasAdvancedError) setShowAdvanced(true);
  }, [hasAdvancedError]);

  return (
    <motion.div {...EXPAND_MOTION} className={CONTAINER_CLASS}>
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
              placeholder={arabicSource("settings.accrual_days_per_month")}
              className={inputCls}
            />
            <p className="text-muted-foreground mt-1" style={{ fontSize: 11 }}>
              {arabicSource("settings.accrual_days_per_month_hint")}
            </p>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={handleToggleAdvanced}
        className="flex items-center gap-1.5 text-primary text-xs cursor-pointer"
      >
        {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        {showAdvanced ? arabicSource("settings.hide_advanced_options") : arabicSource("settings.show_advanced_options")}
      </button>

      {showAdvanced && (
        <LeaveTypeAdvancedSections form={form} errors={errors} onFieldChange={onFieldChange} />
      )}

      <div className="flex gap-2">
        <Button
          size="sm"
          icon={Save}
          onClick={onSave}
          disabled={!isValid}
          className="cursor-pointer"
        >
          {arabicSource("common.save")}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onCancel}
          className="cursor-pointer"
        >
          {arabicSource("common.cancel")}
        </Button>
      </div>
    </motion.div>
  );
};

export default NewLeaveTypeForm;
