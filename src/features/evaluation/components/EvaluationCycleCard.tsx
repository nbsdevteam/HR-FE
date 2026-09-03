import { memo } from "react";
import type { LucideIcon } from "lucide-react";

type EvaluationCycleCardProps = {
  value: string;
  label: string;
  icon: LucideIcon;
};

const EvaluationCycleCard = ({ value, label, icon: Icon }: EvaluationCycleCardProps) => (
  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/10 border border-border/20">
    <div className="flex-shrink-0 min-[768px]:hidden min-[1100px]:block p-2 rounded-lg bg-primary/10 border border-primary/20">
      <Icon className="w-4 h-4 text-primary" />
    </div>
    <div className="min-w-0">
      <p className="text-foreground break-words" style={{ fontSize: 13 }}>{value}</p>
      <p className="text-muted-foreground break-words" style={{ fontSize: 10 }}>{label}</p>
    </div>
  </div>
);

export default memo(EvaluationCycleCard);
