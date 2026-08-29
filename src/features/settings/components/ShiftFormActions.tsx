import { Save, X } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import { Button } from "@/shared/components";

type TShiftFormActionsProps = {
  onSave: () => void;
  onCancel: () => void;
};

const ShiftFormActions = ({ onSave, onCancel }: TShiftFormActionsProps) => (
  <div className="flex gap-2 pt-2">
    <Button
      variant="unstyled"
      size="unstyled"
      rounded="rounded-lg"
      onClick={onSave}
      className="gap-2 px-4 py-2 bg-green-600/20 border border-green-500/50 text-green-400 hover:bg-green-600/30"
    >
      <Save className="w-4 h-4" />
      {arabicSource("common.save")}
    </Button>
    <Button
      variant="unstyled"
      size="unstyled"
      rounded="rounded-lg"
      onClick={onCancel}
      className="gap-2 px-4 py-2 bg-red-600/20 border border-red-500/50 text-red-400 hover:bg-red-600/30"
    >
      <X className="w-4 h-4" />
      {arabicSource("common.cancel")}
    </Button>
  </div>
);

export default ShiftFormActions;
