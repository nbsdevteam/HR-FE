import { useCallback } from "react";
import type { HTMLMotionProps } from "motion/react";
import { Save } from "lucide-react";
import { Button, Select } from "@/shared/components";
import { arabicSource } from "@/i18n/source";
import type {
  NewLeaveTypeForm as NewLeaveTypeFormState,
  TypeFormCheckboxConfig,
  TypeFormRowConfig,
} from "../types";
import NewTypeForm from "./NewTypeForm";

type TNewLeaveTypeFormProps = {
  form: NewLeaveTypeFormState;
  onFieldChange: (patch: Partial<NewLeaveTypeFormState>) => void;
  onSave: () => void;
  onCancel: () => void;
};

const inputCls =
  "h-9 px-3 rounded-lg border border-border bg-input-background text-foreground text-sm outline-none";

const CONTAINER_CLASS =
  "mb-4 p-4 border border-primary/20 rounded-lg bg-primary/5 space-y-3";

const EXPAND_MOTION: HTMLMotionProps<"div"> = {
  initial: { opacity: 0, height: 0 },
  animate: { opacity: 1, height: "auto" },
};

const ACCRUAL_OPTIONS = [
  { value: "annual", label: arabicSource("common.annual") },
  { value: "monthly", label: arabicSource("common.monthly") },
  { value: "none", label: arabicSource("settings.without_merit") },
];

const ROWS: TypeFormRowConfig<NewLeaveTypeFormState>[] = [
  {
    id: "identity",
    gridClassName: "grid grid-cols-2 md:grid-cols-4 gap-3",
    fields: [
      { key: "name_ar", placeholder: arabicSource("settings.name_in_arabic") },
      { key: "name_en", placeholder: arabicSource("settings.name_english"), dir: "ltr" },
      { key: "code", placeholder: arabicSource("settings.code_annual"), dir: "ltr" },
      {
        key: "default_days_per_year",
        type: "number",
        placeholder: arabicSource("settings.days_year"),
        blankWhenFalsy: true,
      },
    ],
  },
  {
    id: "accrual",
    gridClassName: "grid grid-cols-2 md:grid-cols-4 gap-3",
    fields: [
      {
        key: "accrual_days_per_month",
        type: "number",
        placeholder: arabicSource("settings.accrual_days_per_month"),
        blankWhenFalsy: true,
      },
    ],
  },
];

const CHECKBOXES: TypeFormCheckboxConfig<NewLeaveTypeFormState>[] = [
  { key: "is_paid", label: arabicSource("settings.driven") },
  { key: "allow_half_day", label: arabicSource("common.half_a_day") },
  { key: "requires_attachment", label: arabicSource("settings.attachment_required") },
  { key: "allow_hourly", label: arabicSource("settings.allow_hourly_leave") },
  { key: "accrual_enabled", label: arabicSource("settings.enable_monthly_accrual") },
  { key: "probation_blocked", label: arabicSource("settings.blocked_during_probation") },
  { key: "is_carryover_allowed", label: arabicSource("common.relay") },
  { key: "is_encashable", label: arabicSource("common.exchangeable") },
];

const NewLeaveTypeForm = ({
  form,
  onFieldChange,
  onSave,
  onCancel,
}: TNewLeaveTypeFormProps) => {
  const handleAccrualMethodChange = useCallback(
    (value: string): void => {
      onFieldChange({ accrual_method: value });
    },
    [onFieldChange],
  );

  const handleColorChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>): void => {
      onFieldChange({ color: e.target.value });
    },
    [onFieldChange],
  );

  return (
    <NewTypeForm
      form={form}
      rows={ROWS}
      checkboxes={CHECKBOXES}
      onFieldChange={onFieldChange}
      containerClassName={CONTAINER_CLASS}
      inputClassName={inputCls}
      checkboxRowClassName="flex flex-wrap items-center gap-4"
      checkboxLabelClassName="flex items-center gap-2 cursor-pointer text-xs text-foreground"
      checkboxInputClassName="rounded"
      motionProps={EXPAND_MOTION}
      extraControls={
        <>
          <Select
            value={form.accrual_method}
            onChange={handleAccrualMethodChange}
            options={ACCRUAL_OPTIONS}
            className="h-8 px-2 rounded border border-border bg-input-background text-foreground text-xs outline-none"
          />
          <input
            type="color"
            value={form.color}
            onChange={handleColorChange}
            className="w-8 h-8 rounded cursor-pointer border-0"
          />
        </>
      }
      footer={
        <div className="flex gap-2">
          <Button size="sm" icon={Save} onClick={onSave} className="cursor-pointer">
            {arabicSource("common.save")}
          </Button>
          <Button size="sm" variant="outline" onClick={onCancel} className="cursor-pointer">
            {arabicSource("common.cancel")}
          </Button>
        </div>
      }
    />
  );
};

export default NewLeaveTypeForm;
