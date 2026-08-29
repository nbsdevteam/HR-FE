import type { ReactNode } from "react";

type LabeledMetricRowProps = {
  label: string;
  value: ReactNode;
  valueColorClassName?: string;
  valueWeightClassName?: string;
  labelClassName?: string;
  wrapperClassName?: string;
  dir?: "ltr";
};

/** Inline label:value row for detail panels/lists. For a stat-grid card use StatCard; for a colored tile use ColorStatTile. */
const LabeledMetricRow = ({
  label,
  value,
  valueColorClassName = "text-primary",
  valueWeightClassName = "font-medium",
  labelClassName = "text-muted-foreground",
  wrapperClassName = "bg-muted/20",
  dir,
}: LabeledMetricRowProps) => (
  <div className={`flex items-center justify-between p-3 rounded-lg ${wrapperClassName}`}>
    <span className={`text-sm ${labelClassName}`}>{label}</span>
    <span className={`text-sm ${valueWeightClassName} ${valueColorClassName}`} dir={dir}>{value}</span>
  </div>
);

export default LabeledMetricRow;
