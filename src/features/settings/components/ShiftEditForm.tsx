import { motion } from "motion/react";
import type { ShiftDaySchedule, ShiftEditState } from "../types";
import ShiftFormActions from "./ShiftFormActions";
import ShiftFormFields from "./ShiftFormFields";

type ShiftEditFormProps = {
  form: ShiftEditState;
  onFieldChange: (patch: Partial<ShiftEditState>) => void;
  onDayChange: (dayKey: string, patch: Partial<ShiftDaySchedule>) => void;
  onSave: () => void;
  onCancel: () => void;
};

const ShiftEditForm = ({ form, onFieldChange, onDayChange, onSave, onCancel }: ShiftEditFormProps) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-t border-border/20 p-4 bg-muted/5 space-y-4">
    <ShiftFormFields form={form} onFieldChange={onFieldChange} onDayChange={onDayChange} />

    <ShiftFormActions onSave={onSave} onCancel={onCancel} />
  </motion.div>
);

export default ShiftEditForm;
