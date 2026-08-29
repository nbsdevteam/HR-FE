import { useCallback, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import ChartBarGroup from "./charts/ChartBarGroup";
import ChartGridLine from "./charts/ChartGridLine";
import ChartLegendItem from "./charts/ChartLegendItem";
import ChartTooltip from "./charts/ChartTooltip";
import type { GroupedBarPosition } from "./charts/ChartGroupedBar";
import { CHART_PADDING_LEFT, CHART_PADDING_RIGHT, CHART_TICK_COUNT, CHART_WIDTH, buildYTicks, niceMax } from "./chart-utils";

interface GroupedBarSeries {
  key: string;
  label: string;
  color: string;
}

interface CustomGroupedBarChartProps {
  data: Record<string, string | number>[];
  categoryKey: string;
  series: GroupedBarSeries[];
  height?: number;
}

const PADDING_TOP = 30;
const PADDING_BOTTOM = 60;
const PLOT_WIDTH = CHART_WIDTH - CHART_PADDING_LEFT - CHART_PADDING_RIGHT;
const BAR_GAP = 3;
const CONTAINER_STYLE: CSSProperties = { direction: "ltr" };
const LEGEND_STYLE: CSSProperties = { direction: "rtl" };

const CustomGroupedBarChart = ({
  data,
  categoryKey,
  series,
  height = 280,
}: CustomGroupedBarChartProps) => {
  const [hovered, setHovered] = useState<GroupedBarPosition | null>(null);

  const plotHeight = height - PADDING_TOP - PADDING_BOTTOM;

  // Y-axis ticks
  const chartMax = useMemo(() => {
    const maxValue = Math.max(...data.flatMap((item) => series.map((s) => Number(item[s.key]) || 0)));
    return niceMax(maxValue, 50);
  }, [data, series]);

  const { groupWidth, barWidth } = useMemo(() => {
    const nextGroupWidth = PLOT_WIDTH / data.length;
    const totalBarsWidth = nextGroupWidth * 0.7;
    return {
      groupWidth: nextGroupWidth,
      barWidth: Math.min(20, (totalBarsWidth - BAR_GAP * (series.length - 1)) / series.length),
    };
  }, [data.length, series.length]);

  const yTicks = useMemo(() => {
    const getY = (value: number) => PADDING_TOP + plotHeight - (value / chartMax) * plotHeight;
    return buildYTicks(0, chartMax, CHART_TICK_COUNT, getY);
  }, [chartMax, plotHeight]);

  const groups = useMemo(
    () =>
      data.map((item, groupIndex) => {
        const groupX = CHART_PADDING_LEFT + groupWidth * groupIndex;
        const barsStartX = groupX + (groupWidth - (barWidth * series.length + BAR_GAP * (series.length - 1))) / 2;
        const bars = series.map((s, seriesIndex) => {
          const value = Number(item[s.key]) || 0;
          const barHeight = (value / chartMax) * plotHeight;
          return {
            x: barsStartX + seriesIndex * (barWidth + BAR_GAP),
            y: PADDING_TOP + plotHeight - barHeight,
            height: Math.max(0, barHeight),
            color: s.color,
            seriesLabel: s.label,
            value,
          };
        });
        return { label: String(item[categoryKey]), labelX: groupX + groupWidth / 2, bars };
      }),
    [data, series, categoryKey, groupWidth, barWidth, chartMax, plotHeight],
  );

  const hoveredGroup = hovered ? groups[hovered.groupIdx] : undefined;
  const hoveredBar = hovered && hoveredGroup ? hoveredGroup.bars[hovered.seriesIdx] : undefined;
  const labelY = PADDING_TOP + plotHeight + 18;

  const handleHover = useCallback((position: GroupedBarPosition | null): void => {
    setHovered(position);
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
        {yTicks.map((tick) => (
          <ChartGridLine
            key={`grid-${tick.value}`}
            y={tick.y}
            x1={CHART_PADDING_LEFT}
            x2={CHART_WIDTH - CHART_PADDING_RIGHT}
            labelX={CHART_PADDING_LEFT - 8}
            label={tick.value}
          />
        ))}

        {/* Grouped Bars */}
        {groups.map((group, groupIndex) => (
          <ChartBarGroup
            key={`group-${groupIndex}`}
            groupIndex={groupIndex}
            bars={group.bars}
            barWidth={barWidth}
            label={group.label}
            labelX={group.labelX}
            labelY={labelY}
            hoveredSeriesIndex={hovered && hovered.groupIdx === groupIndex ? hovered.seriesIdx : null}
            anyHovered={hovered !== null}
            onHover={handleHover}
          />
        ))}
      </svg>

      {/* Tooltip */}
      {hoveredGroup && hoveredBar && (
        <ChartTooltip
          left={`${(((hoveredBar.x + barWidth / 2) / CHART_WIDTH) * 100)}%`}
          top={`${((hoveredBar.y / height) * 100)}%`}
          transform="translate(-50%, -110%)"
          title={hoveredGroup.label}
          value={`${hoveredBar.seriesLabel}: ${hoveredBar.value}`}
          valueColor={hoveredBar.color}
        />
      )}

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-2" style={LEGEND_STYLE}>
        {series.map((s) => (
          <ChartLegendItem
            key={s.key}
            color={s.color}
            label={s.label}
            swatchClassName="w-3 h-3 rounded-sm"
            fontSize={11}
          />
        ))}
      </div>
    </div>
  );
};

export default CustomGroupedBarChart;
