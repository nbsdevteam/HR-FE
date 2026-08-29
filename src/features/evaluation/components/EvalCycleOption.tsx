import { memo, useCallback } from "react";
import type { LucideIcon } from "lucide-react";
import type { EvalCycleType } from "../types";

type EvalCycleOptionProps = {
  value: EvalCycleType;
  icon: LucideIcon;
  isActive: boolean;
  onSelect: (value: EvalCycleType) => void;
};

const EvalCycleOption = ({ value, icon: Icon, isActive, onSelect }: EvalCycleOptionProps) => {
  const handleClick = useCallback((): void => {
    onSelect(value);
  }, [onSelect, value]);

  return (
    <button
      onClick={handleClick}
      className={`flex items-center gap-2 p-3 rounded-lg border transition-all cursor-pointer ${
        isActive
          ? "bg-primary/10 border-primary/30 text-primary"
          : "bg-muted/10 border-border/30 text-muted-foreground hover:border-primary/20"
      }`}
    >
      <Icon className="w-4 h-4" />
      <span style={{ fontSize: 12 }}>{value}</span>
    </button>
  );
};

export default memo(EvalCycleOption);
