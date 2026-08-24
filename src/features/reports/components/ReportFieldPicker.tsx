import { useState, useMemo } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import type { ReportField } from "../types";
import ReportFieldCheckbox from "./ReportFieldCheckbox";

type ReportFieldPickerProps = {
  fields: ReportField[];
  selected: string[];
  onToggle: (key: string) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
  loading: boolean;
};

const ReportFieldPicker = ({
  fields,
  selected,
  onToggle,
  onSelectAll,
  onClearAll,
  loading,
}: ReportFieldPickerProps) => {
  const [showAdditional, setShowAdditional] = useState(false);

  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const defaultFields = useMemo(() => fields.filter((f) => f.default_selected), [fields]);
  const additionalFields = useMemo(() => fields.filter((f) => !f.default_selected), [fields]);

  const handleToggleAdditional = (): void => setShowAdditional((v) => !v);

  if (loading) {
    return <div className="text-muted-foreground py-2" style={{ fontSize: 12 }}>{arabicSource("common.loading")}</div>;
  }
  if (!fields.length) return null;

  return (
    <div className="mb-4 p-3 rounded-xl border border-border/30 bg-muted/10">
      <div className="flex items-center justify-between mb-2">
        <span className="text-foreground" style={{ fontSize: 13 }}>
          {arabicSource("reports.columns")}
        </span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onSelectAll}
            className="text-primary hover:underline cursor-pointer"
            style={{ fontSize: 11 }}
          >
            {arabicSource("common.select_all")}
          </button>
          <button
            type="button"
            onClick={onClearAll}
            className="text-muted-foreground hover:text-foreground hover:underline cursor-pointer"
            style={{ fontSize: 11 }}
          >
            {arabicSource("common.clear_all")}
          </button>
        </div>
      </div>

      {selected.length === 0 && (
        <p className="text-destructive mb-2" style={{ fontSize: 11 }}>
          {arabicSource("reports.select_at_least_one_field")}
        </p>
      )}

      <div className="flex flex-wrap gap-1.5">
        {defaultFields.map((field) => (
          <ReportFieldCheckbox
            key={field.key}
            field={field}
            checked={selectedSet.has(field.key)}
            onToggle={onToggle}
          />
        ))}
      </div>

      {additionalFields.length > 0 && (
        <div className="mt-2">
          <button
            type="button"
            onClick={handleToggleAdditional}
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground cursor-pointer"
            style={{ fontSize: 11 }}
          >
            {showAdditional ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {arabicSource("reports.additional_fields")} ({additionalFields.length})
          </button>
          {showAdditional && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {additionalFields.map((field) => (
                <ReportFieldCheckbox
                  key={field.key}
                  field={field}
                  checked={selectedSet.has(field.key)}
                  onToggle={onToggle}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReportFieldPicker;
