import { memo } from "react";
import type { CSSProperties } from "react";
import ChartAxisLabel from "./ChartAxisLabel";

const GROUP_STYLE: CSSProperties = { cursor: "pointer" };
const BAR_STYLE: CSSProperties = { transition: "all 0.2s ease" };

type ChartBarProps = {
  index: number;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  opacity: number;
  label: string;
  /** Label split into the lines to render, from `buildAxisLabelLayout`. */
  labelLines: string[];
  labelY: number;
  labelRotation: number;
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
  labelLines,
  labelY,
  labelRotation,
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
      <ChartAxisLabel
        x={x + width / 2}
        y={labelY}
        lines={labelLines}
        rotation={labelRotation}
        title={label}
      />
    </g>
  );
};

const MemoChartBar = memo(ChartBar);

export default MemoChartBar;
