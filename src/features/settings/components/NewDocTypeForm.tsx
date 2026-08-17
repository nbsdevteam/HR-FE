import { arabicSource } from "@/i18n/source";
import type { NewDocTypeForm as NewDocTypeFormState } from "../types";

type NewDocTypeFormProps = {
  form: NewDocTypeFormState;
  onFieldChange: (patch: Partial<NewDocTypeFormState>) => void;
  onSave: () => void;
};

const NewDocTypeForm = ({ form, onFieldChange, onSave }: NewDocTypeFormProps) => (
  <div className="mb-4 p-4 rounded-lg bg-muted/20 border border-border/30 space-y-3">
    <div className="grid grid-cols-2 gap-3">
      <input
        placeholder={arabicSource("settings.document_name_arabic")}
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
    <div className="grid grid-cols-2 gap-3">
      <input
        placeholder={arabicSource("common.code")}
        value={form.code}
        onChange={e => onFieldChange({ code: e.target.value })}
        className="p-2 rounded-lg bg-input border border-border/50 text-foreground text-sm"
      />
      <input
        type="number"
        placeholder={arabicSource("settings.alert_days_before_expiry")}
        value={form.expiry_warning_days}
        onChange={e => onFieldChange({ expiry_warning_days: +e.target.value })}
        className="p-2 rounded-lg bg-input border border-border/50 text-foreground text-sm"
      />
    </div>
    <div className="flex items-center gap-6">
      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        <input
          type="checkbox"
          checked={form.has_expiry}
          onChange={e => onFieldChange({ has_expiry: e.target.checked })}
          className="accent-primary"
        />
        {arabicSource("settings.has_an_expiration_date")}
      </label>
      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        <input
          type="checkbox"
          checked={form.is_required}
          onChange={e => onFieldChange({ is_required: e.target.checked })}
          className="accent-primary"
        />
        {arabicSource("settings.mandatory_required")}
      </label>
    </div>
    <button
      onClick={onSave}
      className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors cursor-pointer"
    >
      {arabicSource("settings.add_document_type")}
    </button>
  </div>
);

export default NewDocTypeForm;
