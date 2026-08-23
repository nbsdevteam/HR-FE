import { memo } from "react";

type ChartLegendItemProps = {
  color: string;
  label: string;
  swatchClassName: string;
  fontSize: number;
};

const ChartLegendItem = ({ color, label, swatchClassName, fontSize }: ChartLegendItemProps) => {
  return (
    <div className="flex items-center gap-1.5">
      <div className={swatchClassName} style={{ background: color }} />
      <span className="text-muted-foreground" style={{ fontSize }}>
        {label}
      </span>
    </div>
  );
};

const MemoChartLegendItem = memo(ChartLegendItem);

export default MemoChartLegendItem;
