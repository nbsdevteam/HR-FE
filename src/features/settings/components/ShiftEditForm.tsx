import { motion } from "motion/react";
import { Save, X } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import type { ShiftDaySchedule, ShiftEditState } from "../types";
import { ShiftFormFields } from "./ShiftFormFields";

type ShiftEditFormProps = {
  form: ShiftEditState;
  onFieldChange: (patch: Partial<ShiftEditState>) => void;
  onDayChange: (dayKey: string, patch: Partial<ShiftDaySchedule>) => void;
  onSave: () => void;
  onCancel: () => void;
};

export const ShiftEditForm = ({ form, onFieldChange, onDayChange, onSave, onCancel }: ShiftEditFormProps) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-t border-border/20 p-4 bg-muted/5 space-y-4">
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
  </motion.div>
);
