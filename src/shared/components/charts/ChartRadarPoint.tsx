import { memo } from "react";
import type { CSSProperties } from "react";

const POINT_STYLE: CSSProperties = { cursor: "pointer", transition: "r 0.15s ease" };

type ChartRadarPointProps = {
  index: number;
  cx: number;
  cy: number;
  isHovered: boolean;
  color: string;
  onHover: (index: number | null) => void;
};

const ChartRadarPoint = ({ index, cx, cy, isHovered, color, onHover }: ChartRadarPointProps) => {
  const handleMouseEnter = (_event: React.MouseEvent<SVGCircleElement>): void => {
    onHover(index);
  };

  const handleMouseLeave = (_event: React.MouseEvent<SVGCircleElement>): void => {
    onHover(null);
  };

  return (
    <circle
      cx={cx}
      cy={cy}
      r={isHovered ? 6 : 4}
      fill={color}
      stroke="var(--card)"
      strokeWidth={2}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={POINT_STYLE}
    />
  );
};

const MemoChartRadarPoint = memo(ChartRadarPoint);

export default MemoChartRadarPoint;
