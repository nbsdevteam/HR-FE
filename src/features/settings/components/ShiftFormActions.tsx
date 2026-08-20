import { Save, X } from "lucide-react";
import { arabicSource } from "@/i18n/source";

type TShiftFormActionsProps = {
  onSave: () => void;
  onCancel: () => void;
};

const ShiftFormActions = ({ onSave, onCancel }: TShiftFormActionsProps) => (
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
);

export default ShiftFormActions;
