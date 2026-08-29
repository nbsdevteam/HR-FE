import { memo } from "react";
import type { CSSProperties } from "react";

const TICK_LABEL_STYLE: CSSProperties = { fontSize: 11, fontFamily: "Tajawal" };

type ChartGridLineProps = {
  y: number;
  x1: number;
  x2: number;
  labelX: number;
  label: number;
};

const ChartGridLine = ({ y, x1, x2, labelX, label }: ChartGridLineProps) => {
  return (
    <g>
      <line
        x1={x1}
        y1={y}
        x2={x2}
        y2={y}
        stroke="var(--border)"
        strokeOpacity={0.3}
        strokeDasharray="3 3"
      />
      <text
        x={labelX}
        y={y + 4}
        textAnchor="end"
        fill="var(--muted-foreground)"
        style={TICK_LABEL_STYLE}
      >
        {label}
      </text>
    </g>
  );
};

const MemoChartGridLine = memo(ChartGridLine);

export default MemoChartGridLine;
