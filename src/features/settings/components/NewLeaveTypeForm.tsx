import { useCallback } from "react";
import type { HTMLMotionProps } from "motion/react";
import { Save } from "lucide-react";
import { Button, Select } from "@/shared/components";
import { arabicSource } from "@/i18n/source";
import type { NewLeaveTypeForm as NewLeaveTypeFormState } from "../types";
import NewTypeForm from "./NewTypeForm";
import {
  ACCRUAL_OPTIONS,
  CHECKBOXES,
  EXPAND_MOTION,
  ROWS,
} from "../constants/settings";
import { CONTAINER_CLASS, inputCls } from "../styles";

type TNewLeaveTypeFormProps = {
  form: NewLeaveTypeFormState;
  onFieldChange: (patch: Partial<NewLeaveTypeFormState>) => void;
  onSave: () => void;
  onCancel: () => void;
};

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
          <Button
            size="sm"
            icon={Save}
            onClick={onSave}
            className="cursor-pointer"
          >
            {arabicSource("common.save")}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onCancel}
            className="cursor-pointer"
          >
            {arabicSource("common.cancel")}
          </Button>
        </div>
      }
    />
  );
};

export default NewLeaveTypeForm;
