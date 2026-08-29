import { useCallback } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/shared/components";
import { arabicSource } from "@/i18n/source";
import type { ReportConfigFilterPair } from "../types";
import ReportConfigFilterRow from "./ReportConfigFilterRow";

type ReportConfigFiltersEditorProps = {
  filterPairs: ReportConfigFilterPair[];
  onChange: (filterPairs: ReportConfigFilterPair[]) => void;
};

const ReportConfigFiltersEditor = ({ filterPairs, onChange }: ReportConfigFiltersEditorProps) => {
  const handleRowChange = useCallback((index: number, patch: Partial<ReportConfigFilterPair>): void => {
    onChange(filterPairs.map((p, i) => (i === index ? { ...p, ...patch } : p)));
  }, [filterPairs, onChange]);

  const handleRowRemove = useCallback((index: number): void => {
    onChange(filterPairs.filter((_, i) => i !== index));
  }, [filterPairs, onChange]);

  const handleAdd = useCallback((): void => {
    onChange([...filterPairs, { key: "", value: "" }]);
  }, [filterPairs, onChange]);

  return (
    <div>
      <label className="block text-foreground text-sm mb-2">{arabicSource("reports.default_filters_title")}</label>
      <div className="space-y-2">
        {filterPairs.map((pair, index) => (
          <ReportConfigFilterRow
            key={index}
            pair={pair}
            index={index}
            onChange={handleRowChange}
            onRemove={handleRowRemove}
          />
        ))}
      </div>
      <Button variant="outline" size="sm" icon={Plus} onClick={handleAdd} className="mt-2">
        {arabicSource("reports.add_filter")}
      </Button>
    </div>
  );
};

export default ReportConfigFiltersEditor;
