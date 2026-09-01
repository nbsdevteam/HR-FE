import { useCallback, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { arabicSource } from "@/i18n/source";
import ChartBar from "./charts/ChartBar";
import ChartGridLine from "./charts/ChartGridLine";
import ChartTooltip from "./charts/ChartTooltip";
import {
  CHART_PADDING_LEFT,
  CHART_PADDING_RIGHT,
  CHART_TICK_COUNT,
  CHART_WIDTH,
  buildAxisLabelLayout,
  buildYTicks,
  niceMax,
} from "./chart-utils";

interface BarChartItem {
  label: string;
  value: number;
}

interface CustomBarChartProps {
  data: BarChartItem[];
  color?: string;
  height?: number;
  barLabel?: string;
}

const PADDING_TOP = 30;
const PLOT_WIDTH = CHART_WIDTH - CHART_PADDING_LEFT - CHART_PADDING_RIGHT;
const BAR_GAP = 8;
/** Distance from the plot floor down to the first label baseline. */
const LABEL_BASELINE_OFFSET = 14;
const CONTAINER_STYLE: CSSProperties = { direction: "ltr" };

const CustomBarChart = ({ data, color = "#D4AF37", height = 280, barLabel = arabicSource("common.value") }: CustomBarChartProps) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const safeData = useMemo(
    () =>
      data
        .filter((item) => item.label)
        .map((item) => ({
          ...item,
          value: Number.isFinite(item.value) ? Math.max(0, item.value) : 0,
        })),
    [data],
  );

  const { slotWidth, barWidth } = useMemo(() => {
    const nextSlotWidth = safeData.length > 0 ? PLOT_WIDTH / safeData.length : PLOT_WIDTH;
    return {
      slotWidth: nextSlotWidth,
      barWidth: Math.max(1, Math.min(40, nextSlotWidth - BAR_GAP)),
    };
  }, [safeData.length]);

  // Wraps / tilts / truncates the x-axis labels so neighbouring names never overlap,
  // and tells us how much bottom padding that choice needs.
  const labelLayout = useMemo(
    () => buildAxisLabelLayout(safeData.map((item) => item.label), slotWidth),
    [safeData, slotWidth],
  );

  // Y-axis ticks
  const { plotHeight, chartMax, yTicks } = useMemo(() => {
    const nextPlotHeight = Math.max(1, height - PADDING_TOP - labelLayout.paddingBottom);
    const maxValue = safeData.length > 0 ? Math.max(...safeData.map((item) => item.value)) : 0;
    const nextChartMax = niceMax(maxValue);
    const getY = (value: number) => PADDING_TOP + nextPlotHeight - (value / nextChartMax) * nextPlotHeight;
    return {
      plotHeight: nextPlotHeight,
      chartMax: nextChartMax,
      yTicks: buildYTicks(0, nextChartMax, CHART_TICK_COUNT, getY),
    };
  }, [safeData, height, labelLayout.paddingBottom]);

  const bars = useMemo(
    () =>
      safeData.map((item, index) => {
        const barHeight = (item.value / chartMax) * plotHeight;
        return {
          label: item.label,
          value: item.value,
          x: CHART_PADDING_LEFT + slotWidth * index + (slotWidth - barWidth) / 2,
          y: PADDING_TOP + plotHeight - barHeight,
          barHeight,
        };
      }),
    [safeData, chartMax, plotHeight, slotWidth, barWidth],
  );

  const hoveredBar = hoveredIndex !== null ? bars[hoveredIndex] : undefined;
  const labelY = PADDING_TOP + plotHeight + LABEL_BASELINE_OFFSET;

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

        {/* Bars */}
        {bars.map((bar, index) => (
          <ChartBar
            key={`bar-${index}`}
            index={index}
            x={bar.x}
            y={bar.y}
            width={barWidth}
            height={bar.barHeight}
            color={color}
            opacity={hoveredIndex !== null && hoveredIndex !== index ? 0.5 : 1}
            label={bar.label}
            labelLines={labelLayout.lines[index] ?? [bar.label]}
            labelY={labelY}
            labelRotation={labelLayout.rotation}
            onHover={handleHover}
          />
        ))}
      </svg>

      {/* Tooltip */}
      {hoveredBar && (
        <ChartTooltip
          left={`${(((hoveredBar.x + barWidth / 2) / CHART_WIDTH) * 100)}%`}
          top={`${((hoveredBar.y / height) * 100)}%`}
          transform="translate(-50%, -110%)"
          title={hoveredBar.label}
          value={`${barLabel}: ${hoveredBar.value}`}
          valueColor={color}
        />
      )}
    </div>
  );
};

export default CustomBarChart;
