import { useMemo } from "react";
import { arabicSource } from "@/i18n/source";
import type { ReportSelectionItem } from "../types";
import ReportSelectionOption from "./ReportSelectionOption";

type ReportSelectionGridProps = {
  items: ReportSelectionItem[];
  selectedValues: string[];
  onToggle: (value: string) => void;
};

const ReportSelectionGrid = ({
  items,
  selectedValues,
  onToggle,
}: ReportSelectionGridProps) => {
  const selectedSet = useMemo(() => new Set(selectedValues), [selectedValues]);

  if (!items.length) {
    return (
      <p className="text-muted-foreground text-center py-6" style={{ fontSize: 12 }}>
        {arabicSource("common.no_results_found")}
      </p>
    );
  }

  return (
    <div role="group" className="grid grid-cols-2 md:grid-cols-3 gap-2">
      {items.map((item) => (
        <ReportSelectionOption
          key={item.value}
          value={item.value}
          label={item.label}
          initials={item.initials}
          checked={selectedSet.has(item.value)}
          onToggle={onToggle}
        />
      ))}
    </div>
  );
};

export default ReportSelectionGrid;
