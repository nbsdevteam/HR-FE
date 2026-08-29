import { useCallback, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { arabicSource } from "@/i18n/source";
import ChartGridLine from "./charts/ChartGridLine";
import ChartLinePoint from "./charts/ChartLinePoint";
import ChartTooltip from "./charts/ChartTooltip";
import { CHART_PADDING_LEFT, CHART_PADDING_RIGHT, CHART_TICK_COUNT, CHART_WIDTH, buildYTicks, niceRange } from "./chart-utils";

interface LineChartItem {
  label: string;
  value: number;
}

interface CustomLineChartProps {
  data: LineChartItem[];
  color?: string;
  height?: number;
  valueLabel?: string;
}

const PADDING_TOP = 30;
const PADDING_BOTTOM = 50;
const PLOT_WIDTH = CHART_WIDTH - CHART_PADDING_LEFT - CHART_PADDING_RIGHT;
const CONTAINER_STYLE: CSSProperties = { direction: "ltr" };

const CustomLineChart = ({ data, color = "#D4AF37", height = 250, valueLabel = arabicSource("common.value") }: CustomLineChartProps) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const safeData = useMemo(
    () =>
      data
        .filter((item) => item.label)
        .map((item) => ({
          ...item,
          value: Number.isFinite(item.value) ? item.value : 0,
        })),
    [data],
  );

  const hasData = safeData.length > 0;
  const plotHeight = height - PADDING_TOP - PADDING_BOTTOM;

  const { yTicks, points, pathD, areaD, hoverZoneWidth } = useMemo(() => {
    const maxValue = safeData.length > 0 ? Math.max(...safeData.map((item) => item.value)) : 0;
    const minValue = safeData.length > 0 ? Math.min(...safeData.map((item) => item.value)) : 0;

    // Nice axis range
    const { niceMin, niceMax } = niceRange(minValue, maxValue);
    const span = Math.max(1, niceMax - niceMin);

    const getX = (index: number) =>
      safeData.length <= 1 ? CHART_PADDING_LEFT + PLOT_WIDTH / 2 : CHART_PADDING_LEFT + (PLOT_WIDTH / (safeData.length - 1)) * index;
    const getY = (value: number) => PADDING_TOP + plotHeight - ((value - niceMin) / span) * plotHeight;

    const ticks = buildYTicks(niceMin, niceMax, CHART_TICK_COUNT, getY);

    const nextPoints = safeData.map((item, index) => ({
      label: item.label,
      value: item.value,
      x: getX(index),
      y: getY(item.value),
    }));

    // Build path
    const nextPathD = nextPoints.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");

    // Area path
    const plotBottom = PADDING_TOP + plotHeight;
    const nextAreaD = nextPoints.length > 0
      ? `${nextPathD} L ${nextPoints[nextPoints.length - 1].x} ${plotBottom} L ${nextPoints[0].x} ${plotBottom} Z`
      : "";

    return {
      yTicks: ticks,
      points: nextPoints,
      pathD: nextPathD,
      areaD: nextAreaD,
      hoverZoneWidth: PLOT_WIDTH / Math.max(1, safeData.length),
    };
  }, [safeData, plotHeight]);

  const hoveredPoint = hoveredIndex !== null ? points[hoveredIndex] : undefined;
  const labelY = PADDING_TOP + plotHeight + 20;

  const handleHover = useCallback((index: number | null): void => {
    setHoveredIndex(index);
  }, []);

  return (
    <div className="relative w-full" style={CONTAINER_STYLE}>
      <svg
        viewBox={`0 0 ${CHART_WIDTH} ${height}`}
        width="100%"
        height={height}
        className="overflow-visible"
      >
        <defs>
          <linearGradient id="lineAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.2} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {yTicks.map((tick, index) => (
          <ChartGridLine
            key={`grid-${index}`}
            y={tick.y}
            x1={CHART_PADDING_LEFT}
            x2={CHART_WIDTH - CHART_PADDING_RIGHT}
            labelX={CHART_PADDING_LEFT - 8}
            label={tick.value}
          />
        ))}

        {/* Area fill */}
        {hasData && <path d={areaD} fill="url(#lineAreaGrad)" />}

        {/* Line */}
        {hasData && <path d={pathD} fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />}

        {/* X labels + dots + hover zones */}
        {points.map((point, index) => (
          <ChartLinePoint
            key={`pt-${index}`}
            index={index}
            x={point.x}
            y={point.y}
            hoverZoneX={point.x - hoverZoneWidth / 2}
            hoverZoneY={PADDING_TOP}
            hoverZoneWidth={hoverZoneWidth}
            hoverZoneHeight={plotHeight}
            isHovered={hoveredIndex === index}
            color={color}
            label={point.label}
            labelY={labelY}
            onHover={handleHover}
          />
        ))}
      </svg>

      {/* Tooltip */}
      {hoveredPoint && (
        <ChartTooltip
          left={`${((hoveredPoint.x / CHART_WIDTH) * 100)}%`}
          top={`${((hoveredPoint.y / height) * 100)}%`}
          transform="translate(-50%, -120%)"
          title={hoveredPoint.label}
          value={`${valueLabel}: ${hoveredPoint.value}`}
          valueColor={color}
        />
      )}
    </div>
  );
};

export default CustomLineChart;
