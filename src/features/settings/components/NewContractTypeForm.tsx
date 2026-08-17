import { arabicSource } from "@/i18n/source";
import type { NewContractTypeForm as NewContractTypeFormState } from "../types";

type NewContractTypeFormProps = {
  form: NewContractTypeFormState;
  onFieldChange: (patch: Partial<NewContractTypeFormState>) => void;
  onSave: () => void;
};

export const NewContractTypeForm = ({ form, onFieldChange, onSave }: NewContractTypeFormProps) => (
  <div className="mb-4 p-4 rounded-lg bg-muted/20 border border-border/30 space-y-3">
    <div className="grid grid-cols-2 gap-3">
      <input
        placeholder={arabicSource("settings.species_name_arabic")}
        value={form.name_ar}
        onChange={e => onFieldChange({ name_ar: e.target.value })}
        className="p-2 rounded-lg bg-input border border-border/50 text-foreground text-sm"
      />
      <input
        placeholder={arabicSource("settings.name_english")}
        value={form.name_en}
        onChange={e => onFieldChange({ name_en: e.target.value })}
        className="p-2 rounded-lg bg-input border border-border/50 text-foreground text-sm"
      />
    </div>
    <div className="grid grid-cols-3 gap-3">
      <input
        placeholder={arabicSource("common.code")}
        value={form.code}
        onChange={e => onFieldChange({ code: e.target.value })}
        className="p-2 rounded-lg bg-input border border-border/50 text-foreground text-sm"
      />
      <input
        type="number"
        placeholder={arabicSource("settings.duration_months")}
        value={form.default_duration_months}
        onChange={e => onFieldChange({ default_duration_months: +e.target.value })}
        className="p-2 rounded-lg bg-input border border-border/50 text-foreground text-sm"
      />
      <input
        type="number"
        placeholder={arabicSource("settings.trial_period_days")}
        value={form.probation_days}
        onChange={e => onFieldChange({ probation_days: +e.target.value })}
        className="p-2 rounded-lg bg-input border border-border/50 text-foreground text-sm"
      />
    </div>
    <div className="grid grid-cols-2 gap-3">
      <input
        type="number"
        placeholder={arabicSource("settings.notice_period_days")}
        value={form.notice_period_days}
        onChange={e => onFieldChange({ notice_period_days: +e.target.value })}
        className="p-2 rounded-lg bg-input border border-border/50 text-foreground text-sm"
      />
      <input
        placeholder={arabicSource("common.description")}
        value={form.description}
        onChange={e => onFieldChange({ description: e.target.value })}
        className="p-2 rounded-lg bg-input border border-border/50 text-foreground text-sm"
      />
    </div>
    <div className="flex items-center gap-4">
      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        <input
          type="checkbox"
          checked={form.is_renewable}
          onChange={e => onFieldChange({ is_renewable: e.target.checked })}
          className="accent-primary"
        />
        {arabicSource("settings.renewable_2")}
      </label>
    </div>
    <button
      onClick={onSave}
      className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors cursor-pointer"
    >
      {arabicSource("settings.add_a_contract_type")}
    </button>
  </div>
);
