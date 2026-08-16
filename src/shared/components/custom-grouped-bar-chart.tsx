import { useState } from "react";

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

export function CustomGroupedBarChart({
  data,
  categoryKey,
  series,
  height = 280,
}: CustomGroupedBarChartProps) {
  const [hovered, setHovered] = useState<{ groupIdx: number; seriesIdx: number } | null>(null);

  const maxValue = Math.max(
    ...data.flatMap(d => series.map(s => Number(d[s.key]) || 0))
  );

  const paddingTop = 30;
  const paddingBottom = 60;
  const paddingLeft = 50;
  const paddingRight = 16;
  const chartWidth = 600;
  const chartHeight = height;
  const plotHeight = chartHeight - paddingTop - paddingBottom;
  const plotWidth = chartWidth - paddingLeft - paddingRight;

  const groupWidth = plotWidth / data.length;
  const barGap = 3;
  const totalBarsWidth = groupWidth * 0.7;
  const barWidth = Math.min(20, (totalBarsWidth - barGap * (series.length - 1)) / series.length);

  // Y-axis ticks
  const niceMax = Math.ceil(maxValue / 50) * 50 || 50;
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

        {/* Grouped Bars */}
        {data.map((item, gi) => {
          const groupX = paddingLeft + groupWidth * gi;
          const barsStartX = groupX + (groupWidth - (barWidth * series.length + barGap * (series.length - 1))) / 2;

          return (
            <g key={`group-${gi}`}>
              {series.map((s, si) => {
                const val = Number(item[s.key]) || 0;
                const barH = (val / niceMax) * plotHeight;
                const x = barsStartX + si * (barWidth + barGap);
                const y = paddingTop + plotHeight - barH;
                const isHovered = hovered?.groupIdx === gi && hovered?.seriesIdx === si;
                const isFaded = hovered !== null && !isHovered;

                return (
                  <rect
                    key={`bar-${gi}-${si}`}
                    x={x}
                    y={y}
                    width={barWidth}
                    height={Math.max(0, barH)}
                    rx={2}
                    fill={s.color}
                    opacity={isFaded ? 0.4 : 1}
                    onMouseEnter={() => setHovered({ groupIdx: gi, seriesIdx: si })}
                    onMouseLeave={() => setHovered(null)}
                    style={{ transition: "all 0.2s ease", cursor: "pointer" }}
                  />
                );
              })}
              {/* X-axis label */}
              <text
                x={groupX + groupWidth / 2}
                y={paddingTop + plotHeight + 18}
                textAnchor="middle"
                fill="var(--muted-foreground)"
                style={{ fontSize: 11, fontFamily: "Tajawal" }}
              >
                {String(item[categoryKey])}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Tooltip */}
      {hovered !== null && (() => {
        const { groupIdx: gi, seriesIdx: si } = hovered;
        const item = data[gi];
        const s = series[si];
        const val = Number(item[s.key]) || 0;

        const groupX = paddingLeft + groupWidth * gi;
        const barsStartX = groupX + (groupWidth - (barWidth * series.length + barGap * (series.length - 1))) / 2;
        const x = barsStartX + si * (barWidth + barGap) + barWidth / 2;
        const barH = (val / niceMax) * plotHeight;
        const y = paddingTop + plotHeight - barH;

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
              <p className="text-foreground" style={{ fontSize: 12 }}>{String(item[categoryKey])}</p>
              <p style={{ fontSize: 12, color: s.color }}>
                {s.label}: {val}
              </p>
            </div>
          </div>
        );
      })()}

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-2" style={{ direction: "rtl" }}>
        {series.map(s => (
          <div key={s.key} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ background: s.color }} />
            <span className="text-muted-foreground" style={{ fontSize: 11 }}>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
