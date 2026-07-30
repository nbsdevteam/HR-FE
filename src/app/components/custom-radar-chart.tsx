import { useState } from "react";
import { arabicSource } from "../i18n/source";

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

export function CustomRadarChart({ data, maxValue = 5, color = "#D4AF37", height = 280 }: CustomRadarChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const size = 300;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 110;
  const levels = maxValue;
  const angleSlice = (Math.PI * 2) / data.length;

  // Get point position
  const getPoint = (index: number, value: number) => {
    const angle = angleSlice * index - Math.PI / 2;
    const r = (value / maxValue) * radius;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  };

  // Build the data polygon path
  const dataPath = data
    .map((d, i) => {
      const p = getPoint(i, d.score);
      return `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`;
    })
    .join(" ") + " Z";

  return (
    <div className="relative w-full flex justify-center" style={{ direction: "ltr" }}>
      <svg
        viewBox={`0 0 ${size} ${size}`}
        width="100%"
        height={height}
        className="overflow-visible"
        style={{ maxWidth: size }}
      >
        {/* Grid levels */}
        {Array.from({ length: levels }, (_, level) => {
          const levelRadius = ((level + 1) / levels) * radius;
          const points = data
            .map((_, i) => {
              const angle = angleSlice * i - Math.PI / 2;
              return `${cx + levelRadius * Math.cos(angle)},${cy + levelRadius * Math.sin(angle)}`;
            })
            .join(" ");
          return (
            <polygon
              key={`grid-${level}`}
              points={points}
              fill="none"
              stroke="var(--border)"
              strokeOpacity={0.3}
              strokeWidth={1}
            />
          );
        })}

        {/* Axis lines */}
        {data.map((_, i) => {
          const angle = angleSlice * i - Math.PI / 2;
          const x2 = cx + radius * Math.cos(angle);
          const y2 = cy + radius * Math.sin(angle);
          return (
            <line
              key={`axis-${i}`}
              x1={cx}
              y1={cy}
              x2={x2}
              y2={y2}
              stroke="var(--border)"
              strokeOpacity={0.3}
              strokeWidth={1}
            />
          );
        })}

        {/* Data area */}
        <path
          d={dataPath}
          fill={color}
          fillOpacity={0.25}
          stroke={color}
          strokeWidth={2}
        />

        {/* Data points */}
        {data.map((d, i) => {
          const p = getPoint(i, d.score);
          const isHovered = hoveredIndex === i;
          return (
            <circle
              key={`point-${i}`}
              cx={p.x}
              cy={p.y}
              r={isHovered ? 6 : 4}
              fill={color}
              stroke="var(--card)"
              strokeWidth={2}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{ cursor: "pointer", transition: "r 0.15s ease" }}
            />
          );
        })}

        {/* Axis labels */}
        {data.map((d, i) => {
          const angle = angleSlice * i - Math.PI / 2;
          const labelR = radius + 24;
          const x = cx + labelR * Math.cos(angle);
          const y = cy + labelR * Math.sin(angle);
          return (
            <text
              key={`label-${i}`}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="central"
              fill="var(--muted-foreground)"
              style={{ fontSize: 11, fontFamily: "Tajawal" }}
            >
              {d.name}
            </text>
          );
        })}
      </svg>

      {/* Tooltip */}
      {hoveredIndex !== null && (() => {
        const d = data[hoveredIndex];
        const p = getPoint(hoveredIndex, d.score);
        const leftPct = (p.x / size) * 100;
        const topPct = (p.y / height) * (height / size) * 100;

        return (
          <div
            className="absolute pointer-events-none z-50"
            style={{
              left: `calc(50% + ${p.x - cx}px)`,
              top: `${(p.y / size) * 100}%`,
              transform: "translate(-50%, -130%)",
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
              <p className="text-foreground" style={{ fontSize: 12 }}>{d.name}</p>
              <p style={{ fontSize: 12, color }}>{arabicSource("shared.rating")} {d.score}/{maxValue}</p>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
