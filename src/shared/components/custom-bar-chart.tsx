import { useState } from "react";
import { arabicSource } from "@/i18n/source";

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

export function CustomBarChart({ data, color = "#D4AF37", height = 280, barLabel = arabicSource("common.value") }: CustomBarChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const maxValue = Math.max(...data.map(d => d.value));
  const paddingTop = 30;
  const paddingBottom = 60;
  const paddingLeft = 50;
  const paddingRight = 16;
  const chartWidth = 600;
  const chartHeight = height;
  const plotHeight = chartHeight - paddingTop - paddingBottom;
  const plotWidth = chartWidth - paddingLeft - paddingRight;
  const barGap = 8;
  const barWidth = Math.min(40, (plotWidth / data.length) - barGap);

  // Y-axis ticks
  const niceMax = Math.ceil(maxValue / 10) * 10;
  const tickCount = 5;
  const yTicks = Array.from({ length: tickCount + 1 }, (_, i) => Math.round((niceMax / tickCount) * i));

  return (
    <div className="relative w-full" style={{ direction: "ltr" }}>
      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        width="100%"
        height={chartHeight}
        className="overflow-visible"
      >
        {/* Grid lines */}
        {yTicks.map((tick) => {
          const y = paddingTop + plotHeight - (tick / niceMax) * plotHeight;
          return (
            <g key={`grid-${tick}`}>
              <line
                x1={paddingLeft}
                y1={y}
                x2={chartWidth - paddingRight}
                y2={y}
                stroke="var(--border)"
                strokeOpacity={0.3}
                strokeDasharray="3 3"
              />
              <text
                x={paddingLeft - 8}
                y={y + 4}
                textAnchor="end"
                fill="var(--muted-foreground)"
                style={{ fontSize: 11, fontFamily: "Tajawal" }}
              >
                {tick}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {data.map((item, i) => {
          const barH = (item.value / niceMax) * plotHeight;
          const x = paddingLeft + (plotWidth / data.length) * i + ((plotWidth / data.length) - barWidth) / 2;
          const y = paddingTop + plotHeight - barH;
          const isHovered = hoveredIndex === i;

          return (
            <g
              key={`bar-${i}`}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{ cursor: "pointer" }}
            >
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barH}
                rx={4}
                fill={color}
                opacity={hoveredIndex !== null && !isHovered ? 0.5 : 1}
                style={{ transition: "all 0.2s ease" }}
              />
              {/* X-axis label */}
              <text
                x={x + barWidth / 2}
                y={paddingTop + plotHeight + 16}
                textAnchor="middle"
                fill="var(--muted-foreground)"
                style={{ fontSize: 10, fontFamily: "Tajawal" }}
              >
                {item.label}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Tooltip */}
      {hoveredIndex !== null && (() => {
        const item = data[hoveredIndex];
        const x = paddingLeft + (plotWidth / data.length) * hoveredIndex + ((plotWidth / data.length) - barWidth) / 2 + barWidth / 2;
        const barH = (item.value / niceMax) * plotHeight;
        const y = paddingTop + plotHeight - barH;
        // Convert SVG coords to percentage for absolute positioning
        const leftPct = (x / chartWidth) * 100;
        const topPct = (y / chartHeight) * 100;

        return (
          <div
            className="absolute pointer-events-none z-50"
            style={{
              left: `${leftPct}%`,
              top: `${topPct}%`,
              transform: "translate(-50%, -110%)",
            }}
          >
            <div
              className="px-3 py-2 rounded-lg shadow-xl border border-border/40"
              style={{
                background: "var(--card)",
                fontFamily: "Tajawal",
                whiteSpace: "nowrap",
              }}
            >
              <p className="text-foreground" style={{ fontSize: 12 }}>{item.label}</p>
              <p style={{ fontSize: 12, color }}>{barLabel}: {item.value}</p>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
