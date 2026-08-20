import { Save } from "lucide-react";
import { arabicSource } from "@/i18n/source";

interface ITrainingModalFooterActionsProps {
  onSave: () => void;
  onClose: () => void;
  saveLabel: string;
}

const TrainingModalFooterActions = ({
  onSave,
  onClose,
  saveLabel,
}: ITrainingModalFooterActionsProps) => (
  <div className="flex items-center gap-3 pt-4 border-t border-border/20">
    <button
      onClick={onSave}
      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
    >
      <Save className="w-4 h-4" />
      {saveLabel}
    </button>
    <button
      onClick={onClose}
      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
    >
      {arabicSource("common.cancel")}
    </button>
  </div>
);

export default TrainingModalFooterActions;
