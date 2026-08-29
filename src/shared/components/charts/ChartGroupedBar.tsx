import { memo } from "react";
import type { CSSProperties } from "react";

const BAR_STYLE: CSSProperties = { transition: "all 0.2s ease", cursor: "pointer" };

export type GroupedBarPosition = {
  groupIdx: number;
  seriesIdx: number;
};

type ChartGroupedBarProps = {
  groupIndex: number;
  seriesIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  opacity: number;
  onHover: (position: GroupedBarPosition | null) => void;
};

const ChartGroupedBar = ({
  groupIndex,
  seriesIndex,
  x,
  y,
  width,
  height,
  color,
  opacity,
  onHover,
}: ChartGroupedBarProps) => {
  const handleMouseEnter = (_event: React.MouseEvent<SVGRectElement>): void => {
    onHover({ groupIdx: groupIndex, seriesIdx: seriesIndex });
  };

  const handleMouseLeave = (_event: React.MouseEvent<SVGRectElement>): void => {
    onHover(null);
  };

  return (
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      rx={2}
      fill={color}
      opacity={opacity}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={BAR_STYLE}
    />
  );
};

const MemoChartGroupedBar = memo(ChartGroupedBar);

export default MemoChartGroupedBar;
