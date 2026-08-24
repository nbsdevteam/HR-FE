import { Check } from "lucide-react";

type MultiSelectOptionRowProps = {
  label: string;
  checked: boolean;
  onMouseDown: (e: React.MouseEvent<HTMLButtonElement>) => void;
};

const MultiSelectOptionRow = ({ label, checked, onMouseDown }: MultiSelectOptionRowProps) => (
  <button
    type="button"
    role="option"
    aria-selected={checked}
    onMouseDown={onMouseDown}
    className={`w-full px-3 py-2 flex items-center gap-2 text-start border-b border-border/10 last:border-b-0 cursor-pointer ${
      checked ? "bg-gold/15 text-gold" : "text-foreground hover:bg-gold/15"
    }`}
    style={{ fontSize: 13 }}
  >
    <span
      className={`w-4 h-4 rounded border shrink-0 flex items-center justify-center ${
        checked ? "bg-primary border-primary" : "border-border"
      }`}
    >
      {checked && <Check className="w-3 h-3 text-primary-foreground" />}
    </span>
    <span className="truncate" dir="auto">
      {label}
    </span>
  </button>
);

export default MultiSelectOptionRow;
