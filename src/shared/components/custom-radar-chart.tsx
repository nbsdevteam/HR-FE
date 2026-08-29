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

/** Proportions of the original fixed 300px chart, kept so a taller/shorter `height` scales the whole shape instead of just cropping it. */
const RADIUS_RATIO = 110 / 300;
const LABEL_OFFSET_RATIO = 24 / 300;
const CONTAINER_STYLE: CSSProperties = { direction: "ltr" };

const CustomRadarChart = ({ data, maxValue = 5, color = "#D4AF37", height = 280 }: CustomRadarChartProps) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const size = height;
  const center = size / 2;
  const radius = size * RADIUS_RATIO;
  const labelRadius = radius + size * LABEL_OFFSET_RATIO;
  const svgStyle = useMemo<CSSProperties>(() => ({ maxWidth: size }), [size]);

  const { points, dataPath, gridLevels, axisLines, axisLabels } = useMemo(() => {
    const angleSlice = (Math.PI * 2) / data.length;

    // Get point position
    const getPoint = (index: number, value: number) => {
      const angle = angleSlice * index - Math.PI / 2;
      const r = (value / maxValue) * radius;
      return {
        x: center + r * Math.cos(angle),
        y: center + r * Math.sin(angle),
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
      const levelRadius = ((level + 1) / maxValue) * radius;
      return data
        .map((_, index) => {
          const angle = angleSlice * index - Math.PI / 2;
          return `${center + levelRadius * Math.cos(angle)},${center + levelRadius * Math.sin(angle)}`;
        })
        .join(" ");
    });

    const nextAxisLines = data.map((_, index) => {
      const angle = angleSlice * index - Math.PI / 2;
      return { x2: center + radius * Math.cos(angle), y2: center + radius * Math.sin(angle) };
    });

    const nextAxisLabels = data.map((item, index) => {
      const angle = angleSlice * index - Math.PI / 2;
      return {
        name: item.name,
        x: center + labelRadius * Math.cos(angle),
        y: center + labelRadius * Math.sin(angle),
      };
    });

    return {
      points: nextPoints,
      dataPath: nextDataPath,
      gridLevels: nextGridLevels,
      axisLines: nextAxisLines,
      axisLabels: nextAxisLabels,
    };
  }, [data, maxValue, center, radius, labelRadius]);

  const hoveredPoint = hoveredIndex !== null ? points[hoveredIndex] : undefined;

  const handleHover = useCallback((index: number | null): void => {
    setHoveredIndex(index);
  }, []);

  return (
    <div className="relative w-full flex justify-center" style={CONTAINER_STYLE}>
      <svg
        viewBox={`0 0 ${size} ${size}`}
        width="100%"
        height={height}
        className="overflow-visible"
        style={svgStyle}
      >
        {/* Grid levels */}
        {gridLevels.map((levelPoints, level) => (
          <ChartRadarGridLevel key={`grid-${level}`} points={levelPoints} />
        ))}

        {/* Axis lines */}
        {axisLines.map((axis, index) => (
          <ChartRadarAxisLine key={`axis-${index}`} x1={center} y1={center} x2={axis.x2} y2={axis.y2} />
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
          left={`calc(50% + ${hoveredPoint.x - center}px)`}
          top={`${((hoveredPoint.y / size) * 100)}%`}
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
