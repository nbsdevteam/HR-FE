import { Target } from "lucide-react";

type ProgramObjectiveItemProps = {
  objective: string;
};

const ProgramObjectiveItem = ({ objective }: ProgramObjectiveItemProps) => (
  <p className="text-muted-foreground flex items-center gap-2" style={{ fontSize: 11 }}>
    <Target className="w-3 h-3 text-primary flex-shrink-0" />
    {objective}
  </p>
);

export default ProgramObjectiveItem;
