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
  const handleWeightChange = (value: string): void => {
    onWeightChange(Number(value));
  };

  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-border/40 bg-muted/20 text-foreground"
      style={{ fontSize: 11 }}
    >
      {skill.name}
      {weighted && (
        <Select
          value={String(skill.weight || 2)}
          onChange={handleWeightChange}
          options={["1", "2", "3"]}
          className="bg-transparent text-primary cursor-pointer outline-none"
          style={{ fontSize: 10 }}
          dir="ltr"
        />
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
