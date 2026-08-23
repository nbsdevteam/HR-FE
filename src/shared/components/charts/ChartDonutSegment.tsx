import { memo } from "react";
import type { CSSProperties } from "react";

const SEGMENT_STYLE: CSSProperties = { cursor: "pointer", transition: "all 0.2s ease" };

type ChartDonutSegmentProps = {
  index: number;
  cx: number;
  cy: number;
  innerRadius: number;
  outerRadius: number;
  startAngle: number;
  endAngle: number;
  sweepAngle: number;
  color: string;
  isHovered: boolean;
  opacity: number;
  onHover: (index: number | null) => void;
};

const ChartDonutSegment = ({
  index,
  cx,
  cy,
  innerRadius,
  outerRadius,
  startAngle,
  endAngle,
  sweepAngle,
  color,
  isHovered,
  opacity,
  onHover,
}: ChartDonutSegmentProps) => {
  const oR = isHovered ? outerRadius + 4 : outerRadius;

  const x1Outer = cx + oR * Math.cos(startAngle);
  const y1Outer = cy + oR * Math.sin(startAngle);
  const x2Outer = cx + oR * Math.cos(endAngle);
  const y2Outer = cy + oR * Math.sin(endAngle);
  const x1Inner = cx + innerRadius * Math.cos(endAngle);
  const y1Inner = cy + innerRadius * Math.sin(endAngle);
  const x2Inner = cx + innerRadius * Math.cos(startAngle);
  const y2Inner = cy + innerRadius * Math.sin(startAngle);

  const largeArc = sweepAngle > Math.PI ? 1 : 0;

  const path = [
    `M ${x1Outer} ${y1Outer}`,
    `A ${oR} ${oR} 0 ${largeArc} 1 ${x2Outer} ${y2Outer}`,
    `L ${x1Inner} ${y1Inner}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x2Inner} ${y2Inner}`,
    `Z`,
  ].join(" ");

  const handleMouseEnter = (_event: React.MouseEvent<SVGPathElement>): void => {
    onHover(index);
  };

  const handleMouseLeave = (_event: React.MouseEvent<SVGPathElement>): void => {
    onHover(null);
  };

  return (
    <path
      d={path}
      fill={color}
      stroke="transparent"
      strokeWidth={1}
      style={SEGMENT_STYLE}
      opacity={opacity}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    />
  );
};

const MemoChartDonutSegment = memo(ChartDonutSegment);

export default MemoChartDonutSegment;
