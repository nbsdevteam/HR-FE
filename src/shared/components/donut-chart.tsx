import { useState } from "react";
import { arabicSource } from "@/i18n/source";

interface DonutChartProps {
  data: { name: string; value: number; color: string }[];
  size?: number;
  innerRadius?: number;
  outerRadius?: number;
}

const DonutChart = ({ data, size = 200, innerRadius = 60, outerRadius = 95 }: DonutChartProps) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const safeData = data
    .filter((item) => item.name)
    .map((item) => ({
      ...item,
      value: Number.isFinite(item.value) ? Math.max(0, item.value) : 0,
    }));
  const total = safeData.reduce((sum, item) => sum + item.value, 0);
  const cx = size / 2;
  const cy = size / 2;
  const gap = 0.05;

  let currentAngle = -Math.PI / 2;

  const segments = total > 0 ? safeData.map((item, index) => {
    const sweepAngle = Math.max(0, (item.value / total) * (2 * Math.PI) - gap);
    const startAngle = currentAngle + gap / 2;
    const endAngle = startAngle + sweepAngle;
    currentAngle = startAngle + sweepAngle + gap / 2;

    const oR = hoveredIndex === index ? outerRadius + 4 : outerRadius;

    const x1Outer = cx + oR * Math.cos(startAngle);
    const y1Outer = cy + oR * Math.sin(startAngle);
    const x2Outer = cx + oR * Math.cos(endAngle);
    const y2Outer = cy + oR * Math.sin(endAngle);
    const x1Inner = cx + innerRadius * Math.cos(endAngle);
    const y1Inner = cy + innerRadius * Math.sin(endAngle);
    const x2Inner = cx + innerRadius * Math.cos(startAngle);
    const y2Inner = cy + innerRadius * Math.sin(startAngle);

    const largeArc = sweepAngle > Math.PI ? 1 : 0;

    const d = [
      `M ${x1Outer} ${y1Outer}`,
      `A ${oR} ${oR} 0 ${largeArc} 1 ${x2Outer} ${y2Outer}`,
      `L ${x1Inner} ${y1Inner}`,
      `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x2Inner} ${y2Inner}`,
      `Z`,
    ].join(" ");

    const midAngle = (startAngle + endAngle) / 2;
    const tooltipX = cx + ((oR + innerRadius) / 2) * Math.cos(midAngle);
    const tooltipY = cy + ((oR + innerRadius) / 2) * Math.sin(midAngle);

    return { ...item, path: d, index, tooltipX, tooltipY };
  }) : [];

  const percentage = hoveredIndex !== null
    ? (((safeData[hoveredIndex]?.value || 0) / Math.max(1, total)) * 100).toFixed(1)
    : null;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <svg width={size + 10} height={size + 10} viewBox={`-5 -5 ${size + 10} ${size + 10}`}>
          {segments.map((seg) => (
            <path
              key={seg.name}
              d={seg.path}
              fill={seg.color}
              stroke="transparent"
              strokeWidth={1}
              style={{ cursor: "pointer", transition: "all 0.2s ease" }}
              opacity={hoveredIndex !== null && hoveredIndex !== seg.index ? 0.5 : 1}
              onMouseEnter={() => setHoveredIndex(seg.index)}
              onMouseLeave={() => setHoveredIndex(null)}
            />
          ))}
        </svg>
        {/* Center text */}
        {hoveredIndex !== null && safeData[hoveredIndex] && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
          >
            <span className="text-foreground" style={{ fontSize: 20 }}>{percentage}%</span>
            <span className="text-muted-foreground" style={{ fontSize: 11 }}>{safeData[hoveredIndex].name}</span>
          </div>
        )}
        {hoveredIndex === null && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-foreground" style={{ fontSize: 22 }}>{total}</span>
            <span className="text-muted-foreground" style={{ fontSize: 11 }}>{arabicSource("common.total")}</span>
          </div>
        )}
      </div>
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5">
        {safeData.map((item) => (
          <div key={item.name} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: item.color }} />
            <span className="text-muted-foreground" style={{ fontSize: 12 }}>
              {item.name} ({item.value})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DonutChart;
