import { Check } from "lucide-react";
import type { MonthFormat } from "@/app/providers";

type MonthFormatOptionProps = {
  value: MonthFormat;
  label: string;
  example: string;
  isActive: boolean;
  onSelect: () => void;
};

export const MonthFormatOption = ({ label, example, isActive, onSelect }: MonthFormatOptionProps) => (
  <button
    onClick={onSelect}
    className={`relative p-3 rounded-lg border-2 transition-all cursor-pointer text-start ${
      isActive ? "border-primary bg-primary/10" : "border-border/30 bg-muted/10 hover:border-border/60"
    }`}
  >
    {isActive && (
      <div className="absolute top-2 end-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
        <Check className="w-3 h-3 text-primary-foreground" />
      </div>
    )}
    <span className="text-foreground block" style={{ fontSize: 13 }}>
      {label}
    </span>
    <span className="text-primary block mt-1" style={{ fontSize: 15 }} dir="ltr">
      {example}
    </span>
  </button>
);
