import { memo } from "react";
import type { CSSProperties } from "react";

const HOVER_ZONE_STYLE: CSSProperties = { cursor: "pointer" };
const DOT_STYLE: CSSProperties = { transition: "r 0.2s ease" };
const LABEL_STYLE: CSSProperties = { fontSize: 11, fontFamily: "Tajawal" };

type ChartLinePointProps = {
  index: number;
  x: number;
  y: number;
  hoverZoneX: number;
  hoverZoneY: number;
  hoverZoneWidth: number;
  hoverZoneHeight: number;
  isHovered: boolean;
  color: string;
  label: string;
  labelY: number;
  onHover: (index: number | null) => void;
};

const ChartLinePoint = ({
  index,
  x,
  y,
  hoverZoneX,
  hoverZoneY,
  hoverZoneWidth,
  hoverZoneHeight,
  isHovered,
  color,
  label,
  labelY,
  onHover,
}: ChartLinePointProps) => {
  const handleMouseEnter = (_event: React.MouseEvent<SVGRectElement>): void => {
    onHover(index);
  };

  const handleMouseLeave = (_event: React.MouseEvent<SVGRectElement>): void => {
    onHover(null);
  };

  return (
    <g>
      {/* Hover zone */}
      <rect
        x={hoverZoneX}
        y={hoverZoneY}
        width={hoverZoneWidth}
        height={hoverZoneHeight}
        fill="transparent"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={HOVER_ZONE_STYLE}
      />
      {/* Vertical hover line */}
      {isHovered && (
        <line
          x1={x}
          y1={hoverZoneY}
          x2={x}
          y2={hoverZoneY + hoverZoneHeight}
          stroke={color}
          strokeOpacity={0.3}
          strokeDasharray="4 4"
        />
      )}
      {/* Dot */}
      <circle
        cx={x}
        cy={y}
        r={isHovered ? 7 : 5}
        fill={color}
        stroke="var(--card)"
        strokeWidth={2}
        style={DOT_STYLE}
      />
      {/* X label */}
      <text
        x={x}
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

const MemoChartLinePoint = memo(ChartLinePoint);

export default MemoChartLinePoint;
