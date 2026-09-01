import { useCallback } from "react";
import type { CoverageMetric } from "../utils/gradeLadder";

type GradeMetricToggleButtonProps = {
  metric: CoverageMetric;
  label: string;
  isActive: boolean;
  onSelect: (metric: CoverageMetric) => void;
};

/** One segment of the matrix's staff/seats switch — extracted so the toggle never passes an inline handler. */
const GradeMetricToggleButton = ({ metric, label, isActive, onSelect }: GradeMetricToggleButtonProps) => {
  const handleClick = useCallback((): void => {
    onSelect(metric);
  }, [metric, onSelect]);

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={isActive}
      className={`px-3 py-1 rounded-md cursor-pointer transition-colors ${
        isActive ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
      }`}
      style={{ fontSize: 12 }}
    >
      {label}
    </button>
  );
};

export default GradeMetricToggleButton;
