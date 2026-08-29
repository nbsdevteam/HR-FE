import { useCallback } from "react";
import { Trash2 } from "lucide-react";
import { Button, InputField } from "@/shared/components";
import { arabicSource } from "@/i18n/source";
import type { ReportConfigColumn } from "../types";

const FIELD_CLASS = "flex-1 h-10 px-3 rounded-lg bg-input border border-border/50 text-foreground text-sm";

type ReportConfigColumnRowProps = {
  column: ReportConfigColumn;
  index: number;
  onChange: (index: number, patch: Partial<ReportConfigColumn>) => void;
  onRemove: (index: number) => void;
};

const ReportConfigColumnRow = ({ column, index, onChange, onRemove }: ReportConfigColumnRowProps) => {
  const handleKeyChange = useCallback((value: string): void => onChange(index, { key: value }), [index, onChange]);
  const handleLabelChange = useCallback((value: string): void => onChange(index, { label: value }), [index, onChange]);
  const handleRemove = useCallback((): void => onRemove(index), [index, onRemove]);

  return (
    <div className="flex items-center gap-2">
      <InputField
        value={column.key}
        onChange={handleKeyChange}
        placeholder={arabicSource("reports.key_label")}
        className={FIELD_CLASS}
      />
      <InputField
        value={column.label}
        onChange={handleLabelChange}
        placeholder={arabicSource("reports.label_label")}
        className={FIELD_CLASS}
      />
      <Button variant="ghost" size="icon" icon={Trash2} onClick={handleRemove} />
    </div>
  );
};

export default ReportConfigColumnRow;
