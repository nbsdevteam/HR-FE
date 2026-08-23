import { InputField } from "@/shared/components";
import { arabicSource } from "@/i18n/source";
import type { NewDocTypeForm as NewDocTypeFormState } from "../types";

type TNewDocTypeFormProps = {
  form: NewDocTypeFormState;
  onFieldChange: (patch: Partial<NewDocTypeFormState>) => void;
  onSave: () => void;
};

const inputCls = "p-2 rounded-lg bg-input border border-border/50 text-foreground text-sm";

const NewDocTypeForm = ({
  form,
  onFieldChange,
  onSave,
}: TNewDocTypeFormProps) => {
  const handleNameArChange = (value: string): void => {
    onFieldChange({ name_ar: value });
  };

  const handleNameEnChange = (value: string): void => {
    onFieldChange({ name_en: value });
  };

  const handleCodeChange = (value: string): void => {
    onFieldChange({ code: value });
  };

  const handleExpiryWarningDaysChange = (value: string): void => {
    onFieldChange({ expiry_warning_days: +value });
  };

  const handleHasExpiryChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    onFieldChange({ has_expiry: e.target.checked });
  };

  const handleIsRequiredChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    onFieldChange({ is_required: e.target.checked });
  };

  return (
    <div className="mb-4 p-4 rounded-lg bg-muted/20 border border-border/30 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <InputField
          placeholder={arabicSource("settings.document_name_arabic")}
          value={form.name_ar}
          onChange={handleNameArChange}
          className={inputCls}
        />
        <InputField
          placeholder={arabicSource("settings.name_english")}
          value={form.name_en}
          onChange={handleNameEnChange}
          className={inputCls}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <InputField
          placeholder={arabicSource("common.code")}
          value={form.code}
          onChange={handleCodeChange}
          className={inputCls}
        />
        <InputField
          type="number"
          placeholder={arabicSource("settings.alert_days_before_expiry")}
          value={form.expiry_warning_days}
          onChange={handleExpiryWarningDaysChange}
          className={inputCls}
        />
      </div>
      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={form.has_expiry}
            onChange={handleHasExpiryChange}
            className="accent-primary"
          />
          {arabicSource("settings.has_an_expiration_date")}
        </label>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={form.is_required}
            onChange={handleIsRequiredChange}
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
};

export default NewDocTypeForm;
