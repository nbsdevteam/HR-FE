import { motion } from "motion/react";
import { arabicSource } from "@/i18n/source";
import type { ShiftDaySchedule, ShiftEditState } from "../types";
import ShiftFormActions from "./ShiftFormActions";
import ShiftFormFields from "./ShiftFormFields";

type NewShiftFormProps = {
  form: ShiftEditState;
  onFieldChange: (patch: Partial<ShiftEditState>) => void;
  onDayChange: (dayKey: string, patch: Partial<ShiftDaySchedule>) => void;
  onSave: () => void;
  onCancel: () => void;
};

const NewShiftForm = ({ form, onFieldChange, onDayChange, onSave, onCancel }: NewShiftFormProps) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4 p-3 bg-muted/20 rounded-lg border border-border/20">
    <h4 className="text-foreground mb-4">{arabicSource("settings.new_shift")}</h4>
    <div className="space-y-4">
      <ShiftFormFields form={form} onFieldChange={onFieldChange} onDayChange={onDayChange} />

      <ShiftFormActions onSave={onSave} onCancel={onCancel} />
    </div>
  </motion.div>
);

export default NewShiftForm;
