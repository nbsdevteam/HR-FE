import { useCallback } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/shared/components";
import { arabicSource } from "@/i18n/source";
import type { ReportConfigColumn } from "../types";
import ReportConfigColumnRow from "./ReportConfigColumnRow";

type ReportConfigColumnsEditorProps = {
  columns: ReportConfigColumn[];
  onChange: (columns: ReportConfigColumn[]) => void;
};

const ReportConfigColumnsEditor = ({ columns, onChange }: ReportConfigColumnsEditorProps) => {
  const handleRowChange = useCallback((index: number, patch: Partial<ReportConfigColumn>): void => {
    onChange(columns.map((c, i) => (i === index ? { ...c, ...patch } : c)));
  }, [columns, onChange]);

  const handleRowRemove = useCallback((index: number): void => {
    onChange(columns.filter((_, i) => i !== index));
  }, [columns, onChange]);

  const handleAdd = useCallback((): void => {
    onChange([...columns, { key: "", label: "" }]);
  }, [columns, onChange]);

  return (
    <div>
      <label className="block text-foreground text-sm mb-2">{arabicSource("reports.columns")}</label>
      <div className="space-y-2">
        {columns.map((column, index) => (
          <ReportConfigColumnRow
            key={index}
            column={column}
            index={index}
            onChange={handleRowChange}
            onRemove={handleRowRemove}
          />
        ))}
      </div>
      <Button variant="outline" size="sm" icon={Plus} onClick={handleAdd} className="mt-2">
        {arabicSource("reports.add_column")}
      </Button>
    </div>
  );
};

export default ReportConfigColumnsEditor;
