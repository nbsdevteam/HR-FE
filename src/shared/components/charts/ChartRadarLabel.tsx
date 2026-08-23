import { memo } from "react";
import type { CSSProperties } from "react";

const LABEL_STYLE: CSSProperties = { fontSize: 11, fontFamily: "Tajawal" };

type ChartRadarLabelProps = {
  x: number;
  y: number;
  label: string;
};

const ChartRadarLabel = ({ x, y, label }: ChartRadarLabelProps) => {
  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      dominantBaseline="central"
      fill="var(--muted-foreground)"
      style={LABEL_STYLE}
    >
      {label}
    </text>
  );
};

const MemoChartRadarLabel = memo(ChartRadarLabel);

export default MemoChartRadarLabel;
