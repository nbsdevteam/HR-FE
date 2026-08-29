import { useCallback } from "react";
import { Trash2 } from "lucide-react";
import { Button, InputField } from "@/shared/components";
import { arabicSource } from "@/i18n/source";
import type { ReportConfigFilterPair } from "../types";

const FIELD_CLASS = "flex-1 h-10 px-3 rounded-lg bg-input border border-border/50 text-foreground text-sm";

type ReportConfigFilterRowProps = {
  pair: ReportConfigFilterPair;
  index: number;
  onChange: (index: number, patch: Partial<ReportConfigFilterPair>) => void;
  onRemove: (index: number) => void;
};

const ReportConfigFilterRow = ({ pair, index, onChange, onRemove }: ReportConfigFilterRowProps) => {
  const handleKeyChange = useCallback((value: string): void => onChange(index, { key: value }), [index, onChange]);
  const handleValueChange = useCallback((value: string): void => onChange(index, { value }), [index, onChange]);
  const handleRemove = useCallback((): void => onRemove(index), [index, onRemove]);

  return (
    <div className="flex items-center gap-2">
      <InputField
        value={pair.key}
        onChange={handleKeyChange}
        placeholder={arabicSource("reports.key_label")}
        className={FIELD_CLASS}
      />
      <InputField
        value={pair.value}
        onChange={handleValueChange}
        placeholder={arabicSource("reports.value_label")}
        className={FIELD_CLASS}
      />
      <Button variant="ghost" size="icon" icon={Trash2} onClick={handleRemove} />
    </div>
  );
};

export default ReportConfigFilterRow;
