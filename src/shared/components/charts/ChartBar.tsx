import { memo } from "react";
import type { CSSProperties } from "react";

const GROUP_STYLE: CSSProperties = { cursor: "pointer" };
const BAR_STYLE: CSSProperties = { transition: "all 0.2s ease" };
const LABEL_STYLE: CSSProperties = { fontSize: 10, fontFamily: "Tajawal" };

type ChartBarProps = {
  index: number;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  opacity: number;
  label: string;
  labelY: number;
  onHover: (index: number | null) => void;
};

const ChartBar = ({
  index,
  x,
  y,
  width,
  height,
  color,
  opacity,
  label,
  labelY,
  onHover,
}: ChartBarProps) => {
  const handleMouseEnter = (_event: React.MouseEvent<SVGGElement>): void => {
    onHover(index);
  };

  const handleMouseLeave = (_event: React.MouseEvent<SVGGElement>): void => {
    onHover(null);
  };

  return (
    <g onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} style={GROUP_STYLE}>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={4}
        fill={color}
        opacity={opacity}
        style={BAR_STYLE}
      />
      <text
        x={x + width / 2}
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

const MemoChartBar = memo(ChartBar);

export default MemoChartBar;
