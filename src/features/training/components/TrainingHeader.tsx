import { Plus } from "lucide-react";
import { arabicSource } from "@/i18n/source";

type TrainingHeaderProps = {
  onNewProgram: () => void;
};

export const TrainingHeader = ({ onNewProgram }: TrainingHeaderProps) => (
  <div className="flex items-center justify-between">
    <div>
      <h1 className="text-gradient-gold">{arabicSource("common.training_and_development")}</h1>
      <p className="text-muted-foreground mt-1">{arabicSource("training.managing_training_programs_and_participants")}</p>
    </div>
    <button
      onClick={onNewProgram}
      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
    >
      <Plus className="w-4 h-4" />
      {arabicSource("training.new_program")}
    </button>
  </div>
);
