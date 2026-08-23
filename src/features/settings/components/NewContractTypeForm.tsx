import { InputField } from "@/shared/components";
import { arabicSource } from "@/i18n/source";
import type { NewContractTypeForm as NewContractTypeFormState } from "../types";

type TNewContractTypeFormProps = {
  form: NewContractTypeFormState;
  onFieldChange: (patch: Partial<NewContractTypeFormState>) => void;
  onSave: () => void;
};

const inputCls = "p-2 rounded-lg bg-input border border-border/50 text-foreground text-sm";

const NewContractTypeForm = ({
  form,
  onFieldChange,
  onSave,
}: TNewContractTypeFormProps) => {
  const handleNameArChange = (value: string): void => {
    onFieldChange({ name_ar: value });
  };

  const handleNameEnChange = (value: string): void => {
    onFieldChange({ name_en: value });
  };

  const handleCodeChange = (value: string): void => {
    onFieldChange({ code: value });
  };

  const handleDefaultDurationMonthsChange = (value: string): void => {
    onFieldChange({ default_duration_months: +value });
  };

  const handleProbationDaysChange = (value: string): void => {
    onFieldChange({ probation_days: +value });
  };

  const handleNoticePeriodDaysChange = (value: string): void => {
    onFieldChange({ notice_period_days: +value });
  };

  const handleDescriptionChange = (value: string): void => {
    onFieldChange({ description: value });
  };

  const handleIsRenewableChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    onFieldChange({ is_renewable: e.target.checked });
  };

  return (
    <div className="mb-4 p-4 rounded-lg bg-muted/20 border border-border/30 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <InputField
          placeholder={arabicSource("settings.species_name_arabic")}
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
      <div className="grid grid-cols-3 gap-3">
        <InputField
          placeholder={arabicSource("common.code")}
          value={form.code}
          onChange={handleCodeChange}
          className={inputCls}
        />
        <InputField
          type="number"
          placeholder={arabicSource("settings.duration_months")}
          value={form.default_duration_months}
          onChange={handleDefaultDurationMonthsChange}
          className={inputCls}
        />
        <InputField
          type="number"
          placeholder={arabicSource("settings.trial_period_days")}
          value={form.probation_days}
          onChange={handleProbationDaysChange}
          className={inputCls}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <InputField
          type="number"
          placeholder={arabicSource("settings.notice_period_days")}
          value={form.notice_period_days}
          onChange={handleNoticePeriodDaysChange}
          className={inputCls}
        />
        <InputField
          placeholder={arabicSource("common.description")}
          value={form.description}
          onChange={handleDescriptionChange}
          className={inputCls}
        />
      </div>
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={form.is_renewable}
            onChange={handleIsRenewableChange}
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
};

export default NewContractTypeForm;
