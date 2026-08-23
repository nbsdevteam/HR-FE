import { motion } from "motion/react";
import { Save, X } from "lucide-react";
import { InputField } from "@/shared/components";
import { arabicSource } from "@/i18n/source";
import type { NewHolidayForm as NewHolidayFormState } from "../types";
import SettingsToggle from "./SettingsToggle";

type TNewHolidayFormProps = {
  form: NewHolidayFormState;
  onFieldChange: (patch: Partial<NewHolidayFormState>) => void;
  onSave: () => void;
  onCancel: () => void;
};

const fieldCls = "w-full px-3 py-2 bg-background border border-border/60 rounded-lg text-foreground focus:outline-none focus:border-primary";

const NewHolidayForm = ({
  form,
  onFieldChange,
  onSave,
  onCancel,
}: TNewHolidayFormProps) => {
  const handleNameArChange = (value: string): void => {
    onFieldChange({ name_ar: value });
  };

  const handleNameEnChange = (value: string): void => {
    onFieldChange({ name_en: value });
  };

  const handleDateChange = (value: string): void => {
    onFieldChange({ date: value });
  };

  const handleRecurringToggle = (): void => {
    onFieldChange({ is_recurring: !form.is_recurring });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-4 bg-muted/20 rounded-lg border border-border/20 space-y-4"
    >
      <h4 className="text-foreground">{arabicSource("settings.new_holiday")}</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputField
          label={arabicSource("settings.name_arabic")}
          value={form.name_ar}
          onChange={handleNameArChange}
          className={fieldCls}
          placeholder={arabicSource("settings.eid_al_fitr")}
        />
        <InputField
          label={arabicSource("settings.name_english")}
          value={form.name_en}
          onChange={handleNameEnChange}
          className={fieldCls}
          placeholder={arabicSource("settings.eid_al_fitr")}
        />
        <InputField
          label={arabicSource("common.date_2")}
          type="date"
          value={form.date}
          onChange={handleDateChange}
          className={fieldCls}
        />
        <div className="flex items-center gap-3 p-3 bg-muted/10 rounded-lg">
          <label className="text-foreground text-sm">
            {arabicSource("settings.annual_frequency_2")}
          </label>
          <SettingsToggle on={form.is_recurring} onClick={handleRecurringToggle} />
        </div>
      </div>
      <div className="flex gap-2 pt-2">
        <button
          onClick={onSave}
          className="flex items-center gap-2 px-4 py-2 bg-green-600/20 border border-green-500/50 text-green-400 hover:bg-green-600/30 rounded-lg transition-colors text-sm"
        >
          <Save className="w-4 h-4" />
          {arabicSource("common.save")}
        </button>
        <button
          onClick={onCancel}
          className="flex items-center gap-2 px-4 py-2 bg-muted/30 border border-border/40 text-foreground hover:bg-muted/40 rounded-lg transition-colors text-sm"
        >
          <X className="w-4 h-4" />
          {arabicSource("common.cancel")}
        </button>
      </div>
    </motion.div>
  );
};

export default NewHolidayForm;
