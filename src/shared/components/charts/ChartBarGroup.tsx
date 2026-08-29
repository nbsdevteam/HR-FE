import { memo } from "react";
import type { CSSProperties } from "react";
import ChartGroupedBar from "./ChartGroupedBar";
import type { GroupedBarPosition } from "./ChartGroupedBar";

const LABEL_STYLE: CSSProperties = { fontSize: 11, fontFamily: "Tajawal" };

export type GroupedBarGeometry = {
  x: number;
  y: number;
  height: number;
  color: string;
  seriesLabel: string;
  value: number;
};

type ChartBarGroupProps = {
  groupIndex: number;
  bars: GroupedBarGeometry[];
  barWidth: number;
  label: string;
  labelX: number;
  labelY: number;
  hoveredSeriesIndex: number | null;
  anyHovered: boolean;
  onHover: (position: GroupedBarPosition | null) => void;
};

const ChartBarGroup = ({
  groupIndex,
  bars,
  barWidth,
  label,
  labelX,
  labelY,
  hoveredSeriesIndex,
  anyHovered,
  onHover,
}: ChartBarGroupProps) => {
  return (
    <g>
      {bars.map((bar, seriesIndex) => (
        <ChartGroupedBar
          key={`bar-${groupIndex}-${seriesIndex}`}
          groupIndex={groupIndex}
          seriesIndex={seriesIndex}
          x={bar.x}
          y={bar.y}
          width={barWidth}
          height={bar.height}
          color={bar.color}
          opacity={anyHovered && hoveredSeriesIndex !== seriesIndex ? 0.4 : 1}
          onHover={onHover}
        />
      ))}
      {/* X-axis label */}
      <text
        x={labelX}
        y={labelY}
        textAnchor="middle"
        fill="var(--muted-foreground)"
        style={LABEL_STYLE}
      >
        {label}
      </text>
    </g>
  );
};

const MemoChartBarGroup = memo(ChartBarGroup);

export default MemoChartBarGroup;
