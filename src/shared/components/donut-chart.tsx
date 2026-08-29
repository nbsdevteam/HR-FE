import { useCallback, useMemo, useState } from "react";
import { arabicSource } from "@/i18n/source";
import ChartDonutCenterLabel from "./charts/ChartDonutCenterLabel";
import ChartDonutSegment from "./charts/ChartDonutSegment";
import ChartLegendItem from "./charts/ChartLegendItem";

interface DonutChartProps {
  data: { name: string; value: number; color: string }[];
  size?: number;
  innerRadius?: number;
  outerRadius?: number;
}

const GAP = 0.05;

const DonutChart = ({ data, size = 200, innerRadius = 60, outerRadius = 95 }: DonutChartProps) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const safeData = useMemo(
    () =>
      data
        .filter((item) => item.name)
        .map((item) => ({
          ...item,
          value: Number.isFinite(item.value) ? Math.max(0, item.value) : 0,
        })),
    [data],
  );

  const total = useMemo(() => safeData.reduce((sum, item) => sum + item.value, 0), [safeData]);

  const segments = useMemo(() => {
    if (!(total > 0)) return [];

    let currentAngle = -Math.PI / 2;

    return safeData.map((item) => {
      const sweepAngle = Math.max(0, (item.value / total) * (2 * Math.PI) - GAP);
      const startAngle = currentAngle + GAP / 2;
      const endAngle = startAngle + sweepAngle;
      currentAngle = startAngle + sweepAngle + GAP / 2;

      return { name: item.name, color: item.color, startAngle, endAngle, sweepAngle };
    });
  }, [safeData, total]);

  const cx = size / 2;
  const cy = size / 2;
  const hoveredItem = hoveredIndex !== null ? safeData[hoveredIndex] : undefined;
  const percentage = hoveredIndex !== null
    ? (((safeData[hoveredIndex]?.value || 0) / Math.max(1, total)) * 100).toFixed(1)
    : null;

  const handleHover = useCallback((index: number | null): void => {
    setHoveredIndex(index);
  }, []);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <svg width={size + 10} height={size + 10} viewBox={`-5 -5 ${size + 10} ${size + 10}`}>
          {segments.map((segment, index) => (
            <ChartDonutSegment
              key={segment.name}
              index={index}
              cx={cx}
              cy={cy}
              innerRadius={innerRadius}
              outerRadius={outerRadius}
              startAngle={segment.startAngle}
              endAngle={segment.endAngle}
              sweepAngle={segment.sweepAngle}
              color={segment.color}
              isHovered={hoveredIndex === index}
              opacity={hoveredIndex !== null && hoveredIndex !== index ? 0.5 : 1}
              onHover={handleHover}
            />
          ))}
        </svg>
        {/* Center text */}
        {hoveredItem && (
          <ChartDonutCenterLabel
            primaryText={`${percentage}%`}
            primaryFontSize={20}
            secondaryText={hoveredItem.name}
          />
        )}
        {hoveredIndex === null && (
          <ChartDonutCenterLabel
            primaryText={String(total)}
            primaryFontSize={22}
            secondaryText={arabicSource("common.total")}
          />
        )}
      </div>
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5">
        {safeData.map((item) => (
          <ChartLegendItem
            key={item.name}
            color={item.color}
            label={`${item.name} (${item.value})`}
            swatchClassName="w-2.5 h-2.5 rounded-sm shrink-0"
            fontSize={12}
          />
        ))}
      </div>
    </div>
  );
};

export default DonutChart;
