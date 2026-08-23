import { memo, useCallback } from "react";
import { Sparkles } from "lucide-react";

interface IRecruitmentTabButtonProps {
  id: string;
  label: string;
  isActive: boolean;
  onSelect: (id: string) => void;
}

const RecruitmentTabButton = ({
  id,
  label,
  isActive,
  onSelect,
}: IRecruitmentTabButtonProps) => {
  const handleSelect = useCallback(() => onSelect(id), [onSelect, id]);

  return (
    <button
      onClick={handleSelect}
      className={`px-4 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${isActive ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}
      style={{ fontSize: 13 }}
    >
      {id === "ai" && <Sparkles className="w-3.5 h-3.5" />}
      {label}
    </button>
  );
};

export default memo(RecruitmentTabButton);
