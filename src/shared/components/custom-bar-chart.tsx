import { useCallback, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { arabicSource } from "@/i18n/source";
import ChartBar from "./charts/ChartBar";
import ChartGridLine from "./charts/ChartGridLine";
import ChartTooltip from "./charts/ChartTooltip";

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
const PADDING_BOTTOM = 60;
const PADDING_LEFT = 50;
const PADDING_RIGHT = 16;
const CHART_WIDTH = 600;
const PLOT_WIDTH = CHART_WIDTH - PADDING_LEFT - PADDING_RIGHT;
const BAR_GAP = 8;
const TICK_COUNT = 5;
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

  const plotHeight = height - PADDING_TOP - PADDING_BOTTOM;

  const { slotWidth, barWidth } = useMemo(() => {
    const nextSlotWidth = safeData.length > 0 ? PLOT_WIDTH / safeData.length : PLOT_WIDTH;
    return {
      slotWidth: nextSlotWidth,
      barWidth: Math.max(1, Math.min(40, nextSlotWidth - BAR_GAP)),
    };
  }, [safeData.length]);

  // Y-axis ticks
  const { niceMax, yTicks } = useMemo(() => {
    const maxValue = safeData.length > 0 ? Math.max(...safeData.map((item) => item.value)) : 0;
    const nextNiceMax = Math.max(1, Math.ceil(maxValue / 10) * 10);
    const ticks = Array.from({ length: TICK_COUNT + 1 }, (_, index) => {
      const value = Math.round((nextNiceMax / TICK_COUNT) * index);
      return { value, y: PADDING_TOP + plotHeight - (value / nextNiceMax) * plotHeight };
    });
    return { niceMax: nextNiceMax, yTicks: ticks };
  }, [safeData, plotHeight]);

  const bars = useMemo(
    () =>
      safeData.map((item, index) => {
        const barHeight = (item.value / niceMax) * plotHeight;
        return {
          label: item.label,
          value: item.value,
          x: PADDING_LEFT + slotWidth * index + (slotWidth - barWidth) / 2,
          y: PADDING_TOP + plotHeight - barHeight,
          barHeight,
        };
      }),
    [safeData, niceMax, plotHeight, slotWidth, barWidth],
  );

  const hoveredBar = hoveredIndex !== null ? bars[hoveredIndex] : undefined;
  const labelY = PADDING_TOP + plotHeight + 16;

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
            x1={PADDING_LEFT}
            x2={CHART_WIDTH - PADDING_RIGHT}
            labelX={PADDING_LEFT - 8}
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
            labelY={labelY}
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
