import { arabicSource } from "@/i18n/source";
import { DAYS_OF_WEEK } from "../constants/settings";
import type { ShiftDaySchedule, ShiftEditState } from "../types";
import { ShiftDayEditorRow } from "./ShiftDayEditorRow";

type ShiftFormFieldsProps = {
  form: ShiftEditState;
  onFieldChange: (patch: Partial<ShiftEditState>) => void;
  onDayChange: (dayKey: string, patch: Partial<ShiftDaySchedule>) => void;
};

export const ShiftFormFields = ({ form, onFieldChange, onDayChange }: ShiftFormFieldsProps) => (
  <>
    <div>
      <label className="block text-foreground text-sm mb-2">{arabicSource("common.name")}</label>
      <input
        type="text"
        value={form.name}
        onChange={(e) => onFieldChange({ name: e.target.value })}
        className="w-full px-3 py-2 bg-muted/30 border border-border/40 rounded-lg text-foreground focus:outline-none focus:border-primary"
        placeholder={arabicSource("settings.the_name_of_the_shift")}
      />
    </div>

    <div>
      <label className="block text-foreground text-sm mb-2">{arabicSource("common.description")}</label>
      <input
        type="text"
        value={form.description}
        onChange={(e) => onFieldChange({ description: e.target.value })}
        className="w-full px-3 py-2 bg-muted/30 border border-border/40 rounded-lg text-foreground focus:outline-none focus:border-primary"
        placeholder={arabicSource("settings.description_of_the_shift")}
      />
    </div>

    <div className="grid grid-cols-3 gap-4">
      <div>
        <label className="block text-foreground text-sm mb-2">{arabicSource("common.leniency_minutes")}</label>
        <input
          type="number"
          value={form.grace_minutes}
          onChange={(e) => onFieldChange({ grace_minutes: parseInt(e.target.value) || 0 })}
          className="w-full px-3 py-2 bg-muted/30 border border-border/40 rounded-lg text-foreground focus:outline-none focus:border-primary"
        />
      </div>
      <div>
        <label className="block text-foreground text-sm mb-2">{arabicSource("common.late_hours_for_absence")}</label>
        <input
          type="number"
          value={form.late_to_absent_hours}
          onChange={(e) => onFieldChange({ late_to_absent_hours: parseInt(e.target.value) || 0 })}
          className="w-full px-3 py-2 bg-muted/30 border border-border/40 rounded-lg text-foreground focus:outline-none focus:border-primary"
        />
      </div>
      <div>
        <label className="block text-foreground text-sm mb-2">{arabicSource("common.daily_working_hours")}</label>
        <input
          type="number"
          value={form.target_hours_per_day}
          onChange={(e) => onFieldChange({ target_hours_per_day: parseInt(e.target.value) || 0 })}
          className="w-full px-3 py-2 bg-muted/30 border border-border/40 rounded-lg text-foreground focus:outline-none focus:border-primary"
          step="0.5"
        />
      </div>
    </div>

    <div>
      <label className="block text-foreground text-sm mb-3">{arabicSource("common.working_days")}</label>
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
