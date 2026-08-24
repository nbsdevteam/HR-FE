import { memo } from "react";
import { Check } from "lucide-react";
import type { ReportField } from "../types";

type ReportFieldCheckboxProps = {
  field: ReportField;
  checked: boolean;
  onToggle: (key: string) => void;
};

const ReportFieldCheckbox = ({ field, checked, onToggle }: ReportFieldCheckboxProps) => {
  const handleClick = (): void => {
    onToggle(field.key);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-start cursor-pointer ${
        checked
          ? "border-primary/40 bg-primary/10 text-foreground"
          : "border-border/40 text-muted-foreground hover:text-foreground hover:border-border"
      }`}
      style={{ fontSize: 12 }}
    >
      <span
        className={`w-3.5 h-3.5 rounded border shrink-0 flex items-center justify-center ${
          checked ? "bg-primary border-primary" : "border-border"
        }`}
      >
        {checked && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
      </span>
      <span className="truncate" dir="auto">
        {field.label}
      </span>
    </button>
  );
};

export default memo(ReportFieldCheckbox);
