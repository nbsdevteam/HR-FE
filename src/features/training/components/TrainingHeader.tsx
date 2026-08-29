import { Plus } from "lucide-react";
import { Button } from "@/shared/components";
import { arabicSource } from "@/i18n/source";

interface ITrainingHeaderProps {
  onNewProgram: () => void;
}

const TrainingHeader = ({ onNewProgram }: ITrainingHeaderProps) => (
  <div className="flex items-center justify-between">
    <div>
      <h1 className="text-gradient-gold">
        {arabicSource("common.training_and_development")}
      </h1>
      <p className="text-muted-foreground mt-1">
        {arabicSource("training.managing_training_programs_and_participants")}
      </p>
    </div>
    <Button icon={Plus} onClick={onNewProgram}>
      {arabicSource("training.new_program")}
    </Button>
  </div>
);

export default TrainingHeader;
