import { memo, useCallback } from "react";
import { Button } from "@/shared/components";

type HalfDayPeriodButtonProps = {
  value: "morning" | "afternoon";
  label: string;
  isSelected: boolean;
  onSelect: (value: "morning" | "afternoon") => void;
};

const HalfDayPeriodButton = ({ value, label, isSelected, onSelect }: HalfDayPeriodButtonProps) => {
  const handleClick = useCallback(() => onSelect(value), [onSelect, value]);

  return (
    <Button
      variant="unstyled"
      size="unstyled"
      rounded="rounded-md"
      onClick={handleClick}
      className={`px-3 py-1 border ${
        isSelected
          ? "bg-primary text-primary-foreground"
          : "border-border text-muted-foreground"
      }`}
      style={{ fontSize: 12 }}
    >
      {label}
    </Button>
  );
};

export default memo(HalfDayPeriodButton);
