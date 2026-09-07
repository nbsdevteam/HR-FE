import { forwardRef } from "react";

// SVG viewBox is 180×180; center at (90, 90)
export const CC = 90;
const OR = 80; // outer ring radius
const NR = 64; // number label radius
const HR = 50; // hour hand length
const MR = 65; // minute hand length
const SR = 13; // selection highlight radius

const HOUR_NUMS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as const;
const MIN_NUMS = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55] as const;

const polarPt = (deg: number, r: number): { x: number; y: number } => {
  const rad = (deg - 90) * (Math.PI / 180);
  return { x: CC + r * Math.cos(rad), y: CC + r * Math.sin(rad) };
};

type ClockFaceSvgProps = {
  mode: "h" | "m";
  hour12: number;
  lm: number;
  hourDeg: number;
  minDeg: number;
  onMouseDown: (e: React.MouseEvent<SVGSVGElement>) => void;
  onMouseMove: (e: React.MouseEvent<SVGSVGElement>) => void;
  onMouseUp: () => void;
};

// The analog clock face itself, split out of `ClockFace` to keep that file
// under the project's 300-line component limit.
const ClockFaceSvg = forwardRef<SVGSVGElement, ClockFaceSvgProps>(
  ({ mode, hour12, lm, hourDeg, minDeg, onMouseDown, onMouseMove, onMouseUp }, ref) => (
    <svg
      ref={ref}
      viewBox="0 0 180 180"
      width="188"
      height="188"
      className="cursor-pointer select-none touch-none"
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
    >
      {/* Clock face background */}
      <circle cx={CC} cy={CC} r={OR} className="fill-muted/15 stroke-border/30" strokeWidth="1.5" />

      {/* Tick marks — 60 ticks, major every 5 */}
      {Array.from({ length: 60 }, (_, i) => {
        const big = i % 5 === 0;
        const { x: x1, y: y1 } = polarPt(i * 6, OR - 2);
        const { x: x2, y: y2 } = polarPt(i * 6, OR - (big ? 11 : 5));
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            strokeWidth={big ? 1.5 : 0.7}
            className={big ? "stroke-foreground/20" : "stroke-foreground/10"}
          />
        );
      })}

      {/* Number labels with selection highlight */}
      {(mode === "h" ? HOUR_NUMS : MIN_NUMS).map((val, i) => {
        const { x, y } = polarPt(i * 30, NR);
        const nearestMin5 = (Math.round(lm / 5) * 5) % 60;
        const selected = mode === "h" ? val === hour12 : val === nearestMin5;
        return (
          <g key={val}>
            {selected && <circle cx={x} cy={y} r={SR} className="fill-primary/90" />}
            <text
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="11"
              fontWeight={selected ? 700 : 400}
              className={selected ? "fill-primary-foreground pointer-events-none" : "fill-foreground/60 pointer-events-none"}
            >
              {mode === "h" ? val : String(val).padStart(2, "0")}
            </text>
          </g>
        );
      })}

      {/* ── Hands ── */}

      {/* Hour hand — shorter, muted */}
      <g
        style={{
          transform: `rotate(${hourDeg}deg)`,
          transformOrigin: `${CC}px ${CC}px`,
          transition: "transform 0.2s ease",
        }}
      >
        <line x1={CC} y1={CC} x2={CC} y2={CC - HR} strokeWidth="3.5" strokeLinecap="round" className="stroke-foreground/40" />
      </g>

      {/* Minute hand — longer, primary color */}
      <g
        style={{
          transform: `rotate(${minDeg}deg)`,
          transformOrigin: `${CC}px ${CC}px`,
          transition: "transform 0.12s ease",
        }}
      >
        <line x1={CC} y1={CC} x2={CC} y2={CC - MR} strokeWidth="2" strokeLinecap="round" className="stroke-primary" />
      </g>

      {/* Center cap */}
      <circle cx={CC} cy={CC} r="5" className="fill-primary" />
      <circle cx={CC} cy={CC} r="2.5" className="fill-primary-foreground/80" />
    </svg>
  ),
);
ClockFaceSvg.displayName = "ClockFaceSvg";

export default ClockFaceSvg;
