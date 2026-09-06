import { useCallback } from "react";
import { InputField } from "@/shared/components";
import { arabicSource } from "@/i18n/source";
import { DAYS_OF_WEEK } from "../constants/settings";
import type { ShiftDaySchedule, ShiftEditState } from "../types";
import ShiftDayEditorRow from "./ShiftDayEditorRow";

type TShiftFormFieldsProps = {
  form: ShiftEditState;
  onFieldChange: (patch: Partial<ShiftEditState>) => void;
  onDayChange: (dayKey: string, patch: Partial<ShiftDaySchedule>) => void;
};

const fieldCls =
  "w-full px-3 py-2 bg-muted/30 border border-border/40 rounded-lg text-foreground focus:outline-none focus:border-primary";

const ShiftFormFields = ({
  form,
  onFieldChange,
  onDayChange,
}: TShiftFormFieldsProps) => {
  const handleNameChange = useCallback(
    (value: string): void => {
      onFieldChange({ name: value });
    },
    [onFieldChange],
  );

  const handleDescriptionChange = useCallback(
    (value: string): void => {
      onFieldChange({ description: value });
    },
    [onFieldChange],
  );

  const handleGraceMinutesChange = useCallback(
    (value: string): void => {
      onFieldChange({ grace_minutes: parseInt(value) || 0 });
    },
    [onFieldChange],
  );

  const handleLateToAbsentHoursChange = useCallback(
    (value: string): void => {
      onFieldChange({ late_to_absent_hours: parseInt(value) || 0 });
    },
    [onFieldChange],
  );

  const handleTargetHoursPerDayChange = useCallback(
    (value: string): void => {
      onFieldChange({ target_hours_per_day: parseFloat(value) || 0 });
    },
    [onFieldChange],
  );

  const handleDayChange =
    (dayKey: string) =>
    (patch: Partial<ShiftDaySchedule>): void => {
      onDayChange(dayKey, patch);
    };

  return (
    <>
      <InputField
        label={arabicSource("common.name")}
        value={form.name}
        onChange={handleNameChange}
        className={fieldCls}
        placeholder={arabicSource("settings.the_name_of_the_shift")}
      />

      <InputField
        label={arabicSource("common.description")}
        value={form.description}
        onChange={handleDescriptionChange}
        className={fieldCls}
        placeholder={arabicSource("settings.description_of_the_shift")}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <InputField
          label={arabicSource("common.leniency_minutes")}
          type="number"
          value={form.grace_minutes}
          onChange={handleGraceMinutesChange}
          className={fieldCls}
          min={1}
        />
        <InputField
          label={arabicSource("common.late_hours_for_absence")}
          type="number"
          value={form.late_to_absent_hours}
          onChange={handleLateToAbsentHoursChange}
          className={fieldCls}
          min={1}
        />
        <InputField
          label={arabicSource("common.daily_working_hours")}
          type="number"
          value={form.target_hours_per_day}
          onChange={handleTargetHoursPerDayChange}
          className={fieldCls}
          step="0.5"
          min={0.5}
        />
      </div>

      <div>
        <label className="block text-foreground text-sm mb-3">
          {arabicSource("common.working_days")}
        </label>
        <div className="space-y-3">
          {DAYS_OF_WEEK.map((d) => (
            <ShiftDayEditorRow
              key={d.key}
              dayKey={d.key}
              label={d.label}
              value={form.days[d.key]}
              onChange={handleDayChange(d.key)}
            />
          ))}
        </div>
      </div>
    </>
  );
};

export default ShiftFormFields;
