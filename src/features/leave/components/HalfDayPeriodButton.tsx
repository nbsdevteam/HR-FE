import { memo, useCallback } from "react";

type HalfDayPeriodButtonProps = {
  value: "morning" | "afternoon";
  label: string;
  isSelected: boolean;
  onSelect: (value: "morning" | "afternoon") => void;
};

const HalfDayPeriodButton = ({ value, label, isSelected, onSelect }: HalfDayPeriodButtonProps) => {
  const handleClick = useCallback(() => onSelect(value), [onSelect, value]);

  return (
    <button
      onClick={handleClick}
      className={`px-3 py-1 rounded-md border transition-colors cursor-pointer ${
        isSelected
          ? "bg-primary text-primary-foreground"
          : "border-border text-muted-foreground"
      }`}
      style={{ fontSize: 12 }}
    >
      {label}
    </button>
  );
};

export default memo(HalfDayPeriodButton);
