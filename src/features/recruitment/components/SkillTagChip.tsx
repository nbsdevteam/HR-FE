import { memo } from "react";
import { X } from "lucide-react";
import { type JobSkillRequirement } from "@/shared/hooks";

type SkillTagChipProps = {
  skill: JobSkillRequirement;
  weighted: boolean;
  onWeightChange: (weight: number) => void;
  onRemove: () => void;
};

const SkillTagChip = ({ skill, weighted, onWeightChange, onRemove }: SkillTagChipProps) => (
  <span
    className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-border/40 bg-muted/20 text-foreground"
    style={{ fontSize: 11 }}
  >
    {skill.name}
    {weighted && (
      <select
        value={skill.weight || 2}
        onChange={(e) => onWeightChange(Number(e.target.value))}
        className="bg-transparent text-primary cursor-pointer outline-none"
        style={{ fontSize: 10 }}
        dir="ltr"
      >
        <option value={1}>1</option>
        <option value={2}>2</option>
        <option value={3}>3</option>
      </select>
    )}
    <button type="button" onClick={onRemove} className="text-destructive cursor-pointer">
      <X className="w-3 h-3" />
    </button>
  </span>
);

export default memo(SkillTagChip);
