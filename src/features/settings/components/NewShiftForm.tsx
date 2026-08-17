import { motion } from "motion/react";
import { Save, X } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import type { ShiftDaySchedule, ShiftEditState } from "../types";
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

      <div className="flex gap-2 pt-2">
        <button
          onClick={onSave}
          className="flex items-center gap-2 px-4 py-2 bg-green-600/20 border border-green-500/50 text-green-400 hover:bg-green-600/30 rounded-lg transition-colors"
        >
          <Save className="w-4 h-4" />
          {arabicSource("common.save")}
        </button>
        <button
          onClick={onCancel}
          className="flex items-center gap-2 px-4 py-2 bg-red-600/20 border border-red-500/50 text-red-400 hover:bg-red-600/30 rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
          {arabicSource("common.cancel")}
        </button>
      </div>
    </div>
  </motion.div>
);

export default NewShiftForm;
