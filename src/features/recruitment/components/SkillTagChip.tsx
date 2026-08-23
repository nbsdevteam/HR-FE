import { memo } from "react";
import { X } from "lucide-react";
import { Select } from "@/shared/components";
import { type JobSkillRequirement } from "@/shared/hooks";

interface ISkillTagChipProps {
  skill: JobSkillRequirement;
  weighted: boolean;
  onWeightChange: (weight: number) => void;
  onRemove: () => void;
}

const SkillTagChip = ({
  skill,
  weighted,
  onWeightChange,
  onRemove,
}: ISkillTagChipProps) => {
  const handleWeightChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    onWeightChange(Number(e.target.value));
  };

  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-border/40 bg-muted/20 text-foreground"
      style={{ fontSize: 11 }}
    >
      {skill.name}
      {weighted && (
        <Select
          value={skill.weight || 2}
          onChange={handleWeightChange}
          className="bg-transparent text-primary cursor-pointer outline-none"
          style={{ fontSize: 10 }}
          dir="ltr"
        >
          <option value={1}>1</option>
          <option value={2}>2</option>
          <option value={3}>3</option>
        </Select>
      )}
      <button
        type="button"
        onClick={onRemove}
        className="text-destructive cursor-pointer"
      >
        <X className="w-3 h-3" />
      </button>
    </span>
  );
};

export default memo(SkillTagChip);
