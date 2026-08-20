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

const fieldCls = "w-full px-3 py-2 bg-muted/30 border border-border/40 rounded-lg text-foreground focus:outline-none focus:border-primary";

const ShiftFormFields = ({
  form,
  onFieldChange,
  onDayChange,
}: TShiftFormFieldsProps) => (
  <>
    <InputField
      label={arabicSource("common.name")}
      value={form.name}
      onChange={(value) => onFieldChange({ name: value })}
      className={fieldCls}
      placeholder={arabicSource("settings.the_name_of_the_shift")}
    />

    <InputField
      label={arabicSource("common.description")}
      value={form.description}
      onChange={(value) => onFieldChange({ description: value })}
      className={fieldCls}
      placeholder={arabicSource("settings.description_of_the_shift")}
    />

    <div className="grid grid-cols-3 gap-4">
      <InputField
        label={arabicSource("common.leniency_minutes")}
        type="number"
        value={form.grace_minutes}
        onChange={(value) =>
          onFieldChange({ grace_minutes: parseInt(value) || 0 })
        }
        className={fieldCls}
      />
      <InputField
        label={arabicSource("common.late_hours_for_absence")}
        type="number"
        value={form.late_to_absent_hours}
        onChange={(value) =>
          onFieldChange({
            late_to_absent_hours: parseInt(value) || 0,
          })
        }
        className={fieldCls}
      />
      <InputField
        label={arabicSource("common.daily_working_hours")}
        type="number"
        value={form.target_hours_per_day}
        onChange={(value) =>
          onFieldChange({
            target_hours_per_day: parseInt(value) || 0,
          })
        }
        className={fieldCls}
        step="0.5"
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
            onChange={(patch) => onDayChange(d.key, patch)}
          />
        ))}
      </div>
    </div>
  </>
);

export default ShiftFormFields;
