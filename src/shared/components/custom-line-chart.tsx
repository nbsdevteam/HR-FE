import { useState } from "react";
import { arabicSource } from "@/i18n/source";

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

export function CustomLineChart({ data, color = "#D4AF37", height = 250, valueLabel = arabicSource("common.value") }: CustomLineChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const paddingTop = 30;
  const paddingBottom = 50;
  const paddingLeft = 50;
  const paddingRight = 16;
  const chartWidth = 600;
  const chartHeight = height;
  const plotHeight = chartHeight - paddingTop - paddingBottom;
  const plotWidth = chartWidth - paddingLeft - paddingRight;

  // Nice axis range
  const range = maxValue - minValue;
  const niceMin = Math.floor(minValue / 10) * 10 - Math.max(10, Math.ceil(range * 0.1));
  const niceMax = Math.ceil(maxValue / 10) * 10 + Math.max(10, Math.ceil(range * 0.1));
  const span = niceMax - niceMin;

  const tickCount = 5;
  const yTicks = Array.from({ length: tickCount + 1 }, (_, i) => Math.round(niceMin + (span / tickCount) * i));

  const getX = (i: number) => paddingLeft + (plotWidth / (data.length - 1)) * i;
  const getY = (val: number) => paddingTop + plotHeight - ((val - niceMin) / span) * plotHeight;

  // Build path
  const pathD = data.map((item, i) => {
    const x = getX(i);
    const y = getY(item.value);
    return `${i === 0 ? "M" : "L"} ${x} ${y}`;
  }).join(" ");

  // Area path
  const areaD = `${pathD} L ${getX(data.length - 1)} ${paddingTop + plotHeight} L ${getX(0)} ${paddingTop + plotHeight} Z`;

  return (
    <div className="relative w-full" style={{ direction: "ltr" }}>
      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        width="100%"
        height={chartHeight}
        className="overflow-visible"
      >
        <defs>
          <linearGradient id="lineAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.2} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {yTicks.map((tick) => {
          const y = getY(tick);
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

        {/* Area fill */}
        <path d={areaD} fill="url(#lineAreaGrad)" />

        {/* Line */}
        <path d={pathD} fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />

        {/* X labels + dots + hover zones */}
        {data.map((item, i) => {
          const x = getX(i);
          const y = getY(item.value);
          const isHovered = hoveredIndex === i;

          return (
            <g key={`pt-${i}`}>
              {/* Hover zone */}
              <rect
                x={x - (plotWidth / data.length) / 2}
                y={paddingTop}
                width={plotWidth / data.length}
                height={plotHeight}
                fill="transparent"
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
                style={{ cursor: "pointer" }}
              />
              {/* Vertical hover line */}
              {isHovered && (
                <line
                  x1={x}
                  y1={paddingTop}
                  x2={x}
                  y2={paddingTop + plotHeight}
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
                style={{ transition: "r 0.2s ease" }}
              />
              {/* X label */}
              <text
                x={x}
                y={paddingTop + plotHeight + 20}
                textAnchor="middle"
                fill="var(--muted-foreground)"
                style={{ fontSize: 11, fontFamily: "Tajawal" }}
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
        const x = getX(hoveredIndex);
        const y = getY(item.value);
        const leftPct = (x / chartWidth) * 100;
        const topPct = (y / chartHeight) * 100;

        return (
          <div
            className="absolute pointer-events-none z-50"
            style={{
              left: `${leftPct}%`,
              top: `${topPct}%`,
              transform: "translate(-50%, -120%)",
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
              <p style={{ fontSize: 12, color }}>{valueLabel}: {item.value}</p>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
