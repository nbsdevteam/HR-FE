import { useCallback, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { arabicSource } from "@/i18n/source";
import ChartRadarAxisLine from "./charts/ChartRadarAxisLine";
import ChartRadarGridLevel from "./charts/ChartRadarGridLevel";
import ChartRadarLabel from "./charts/ChartRadarLabel";
import ChartRadarPoint from "./charts/ChartRadarPoint";
import ChartTooltip from "./charts/ChartTooltip";

interface RadarDataItem {
  name: string;
  score: number;
}

interface CustomRadarChartProps {
  data: RadarDataItem[];
  maxValue?: number;
  color?: string;
  height?: number;
}

const SIZE = 300;
const CENTER = SIZE / 2;
const RADIUS = 110;
const LABEL_RADIUS = RADIUS + 24;
const CONTAINER_STYLE: CSSProperties = { direction: "ltr" };
const SVG_STYLE: CSSProperties = { maxWidth: SIZE };

const CustomRadarChart = ({ data, maxValue = 5, color = "#D4AF37", height = 280 }: CustomRadarChartProps) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const { points, dataPath, gridLevels, axisLines, axisLabels } = useMemo(() => {
    const angleSlice = (Math.PI * 2) / data.length;

    // Get point position
    const getPoint = (index: number, value: number) => {
      const angle = angleSlice * index - Math.PI / 2;
      const r = (value / maxValue) * RADIUS;
      return {
        x: CENTER + r * Math.cos(angle),
        y: CENTER + r * Math.sin(angle),
      };
    };

    const nextPoints = data.map((item, index) => {
      const point = getPoint(index, item.score);
      return { name: item.name, score: item.score, x: point.x, y: point.y };
    });

    // Build the data polygon path
    const nextDataPath =
      nextPoints.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ") + " Z";

    const nextGridLevels = Array.from({ length: maxValue }, (_, level) => {
      const levelRadius = ((level + 1) / maxValue) * RADIUS;
      return data
        .map((_, index) => {
          const angle = angleSlice * index - Math.PI / 2;
          return `${CENTER + levelRadius * Math.cos(angle)},${CENTER + levelRadius * Math.sin(angle)}`;
        })
        .join(" ");
    });

    const nextAxisLines = data.map((_, index) => {
      const angle = angleSlice * index - Math.PI / 2;
      return { x2: CENTER + RADIUS * Math.cos(angle), y2: CENTER + RADIUS * Math.sin(angle) };
    });

    const nextAxisLabels = data.map((item, index) => {
      const angle = angleSlice * index - Math.PI / 2;
      return {
        name: item.name,
        x: CENTER + LABEL_RADIUS * Math.cos(angle),
        y: CENTER + LABEL_RADIUS * Math.sin(angle),
      };
    });

    return {
      points: nextPoints,
      dataPath: nextDataPath,
      gridLevels: nextGridLevels,
      axisLines: nextAxisLines,
      axisLabels: nextAxisLabels,
    };
  }, [data, maxValue]);

  const hoveredPoint = hoveredIndex !== null ? points[hoveredIndex] : undefined;

  const handleHover = useCallback((index: number | null): void => {
    setHoveredIndex(index);
  }, []);

  return (
    <div className="relative w-full flex justify-center" style={CONTAINER_STYLE}>
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        width="100%"
        height={height}
        className="overflow-visible"
        style={SVG_STYLE}
      >
        {/* Grid levels */}
        {gridLevels.map((levelPoints, level) => (
          <ChartRadarGridLevel key={`grid-${level}`} points={levelPoints} />
        ))}

        {/* Axis lines */}
        {axisLines.map((axis, index) => (
          <ChartRadarAxisLine key={`axis-${index}`} x1={CENTER} y1={CENTER} x2={axis.x2} y2={axis.y2} />
        ))}

        {/* Data area */}
        <path
          d={dataPath}
          fill={color}
          fillOpacity={0.25}
          stroke={color}
          strokeWidth={2}
        />

        {/* Data points */}
        {points.map((point, index) => (
          <ChartRadarPoint
            key={`point-${index}`}
            index={index}
            cx={point.x}
            cy={point.y}
            isHovered={hoveredIndex === index}
            color={color}
            onHover={handleHover}
          />
        ))}

        {/* Axis labels */}
        {axisLabels.map((axisLabel, index) => (
          <ChartRadarLabel key={`label-${index}`} x={axisLabel.x} y={axisLabel.y} label={axisLabel.name} />
        ))}
      </svg>

      {/* Tooltip */}
      {hoveredPoint && (
        <ChartTooltip
          left={`calc(50% + ${hoveredPoint.x - CENTER}px)`}
          top={`${((hoveredPoint.y / SIZE) * 100)}%`}
          transform="translate(-50%, -130%)"
          title={hoveredPoint.name}
          value={`${arabicSource("shared.rating")} ${hoveredPoint.score}/${maxValue}`}
          valueColor={color}
        />
      )}
    </div>
  );
};

export default CustomRadarChart;
