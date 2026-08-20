import { motion } from "motion/react";
import { Save } from "lucide-react";
import { InputField } from "@/shared/components";
import { arabicSource } from "@/i18n/source";
import type { NewLeaveTypeForm as NewLeaveTypeFormState } from "../types";

type TNewLeaveTypeFormProps = {
  form: NewLeaveTypeFormState;
  onFieldChange: (patch: Partial<NewLeaveTypeFormState>) => void;
  onSave: () => void;
  onCancel: () => void;
};

const inputCls = "h-9 px-3 rounded-lg border border-border bg-input-background text-foreground text-sm outline-none";

const NewLeaveTypeForm = ({
  form,
  onFieldChange,
  onSave,
  onCancel,
}: TNewLeaveTypeFormProps) => (
  <motion.div
    initial={{ opacity: 0, height: 0 }}
    animate={{ opacity: 1, height: "auto" }}
    className="mb-4 p-4 border border-primary/20 rounded-lg bg-primary/5 space-y-3"
  >
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <InputField
        value={form.name_ar}
        onChange={(value) => onFieldChange({ name_ar: value })}
        placeholder={arabicSource("settings.name_in_arabic")}
        className={inputCls}
      />
      <InputField
        value={form.name_en}
        onChange={(value) => onFieldChange({ name_en: value })}
        placeholder={arabicSource("settings.name_english")}
        className={inputCls}
        dir="ltr"
      />
      <InputField
        value={form.code}
        onChange={(value) => onFieldChange({ code: value })}
        placeholder={arabicSource("settings.code_annual")}
        className={inputCls}
        dir="ltr"
      />
      <InputField
        type="number"
        value={form.default_days_per_year || ""}
        onChange={(value) =>
          onFieldChange({ default_days_per_year: Number(value) })
        }
        placeholder={arabicSource("settings.days_year")}
        className={inputCls}
      />
    </div>
    <div className="flex flex-wrap items-center gap-4">
      <label className="flex items-center gap-2 cursor-pointer text-xs text-foreground">
        <input
          type="checkbox"
          checked={form.is_paid}
          onChange={(e) => onFieldChange({ is_paid: e.target.checked })}
          className="rounded"
        />{" "}
        {arabicSource("settings.driven")}
      </label>
      <label className="flex items-center gap-2 cursor-pointer text-xs text-foreground">
        <input
          type="checkbox"
          checked={form.allow_half_day}
          onChange={(e) => onFieldChange({ allow_half_day: e.target.checked })}
          className="rounded"
        />{" "}
        {arabicSource("common.half_a_day")}
      </label>
      <label className="flex items-center gap-2 cursor-pointer text-xs text-foreground">
        <input
          type="checkbox"
          checked={form.requires_attachment}
          onChange={(e) =>
            onFieldChange({ requires_attachment: e.target.checked })
          }
          className="rounded"
        />{" "}
        {arabicSource("settings.attachment_required")}
      </label>
      <label className="flex items-center gap-2 cursor-pointer text-xs text-foreground">
        <input
          type="checkbox"
          checked={form.is_carryover_allowed}
          onChange={(e) =>
            onFieldChange({ is_carryover_allowed: e.target.checked })
          }
          className="rounded"
        />{" "}
        {arabicSource("common.relay")}
      </label>
      <label className="flex items-center gap-2 cursor-pointer text-xs text-foreground">
        <input
          type="checkbox"
          checked={form.is_encashable}
          onChange={(e) => onFieldChange({ is_encashable: e.target.checked })}
          className="rounded"
        />{" "}
        {arabicSource("common.exchangeable")}
      </label>
      <select
        value={form.accrual_method}
        onChange={(e) => onFieldChange({ accrual_method: e.target.value })}
        className="h-8 px-2 rounded border border-border bg-input-background text-foreground text-xs outline-none"
      >
        <option value="annual">{arabicSource("common.annual")}</option>
        <option value="monthly">{arabicSource("common.monthly")}</option>
        <option value="none">{arabicSource("settings.without_merit")}</option>
      </select>
      <input
        type="color"
        value={form.color}
        onChange={(e) => onFieldChange({ color: e.target.value })}
        className="w-8 h-8 rounded cursor-pointer border-0"
      />
    </div>
    <div className="flex gap-2">
      <button
        onClick={onSave}
        className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded text-xs hover:bg-primary/90 cursor-pointer"
      >
        <Save className="w-3 h-3" /> {arabicSource("common.save")}
      </button>
      <button
        onClick={onCancel}
        className="px-3 py-1.5 border border-border text-muted-foreground rounded text-xs hover:bg-muted/20 cursor-pointer"
      >
        {arabicSource("common.cancel")}
      </button>
    </div>
  </motion.div>
);

export default NewLeaveTypeForm;
