import { memo, useCallback } from "react";

interface ITrainingFilterChipProps {
  label: string;
  isActive: boolean;
  onFilterChange: (value: string) => void;
}

const TrainingFilterChip = ({
  label,
  isActive,
  onFilterChange,
}: ITrainingFilterChipProps) => {
  const handleClick = useCallback(
    () => onFilterChange(label),
    [onFilterChange, label],
  );

  return (
    <button
      onClick={handleClick}
      className={`px-4 py-2 rounded-lg transition-colors cursor-pointer ${
        isActive
          ? "bg-primary text-primary-foreground"
          : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
      }`}
    >
      {label}
    </button>
  );
};

export default memo(TrainingFilterChip);
