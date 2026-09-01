import { memo } from "react";
import type { CSSProperties } from "react";
import { AXIS_LABEL_FONT_SIZE } from "../chart-utils";
import ChartAxisLabelLine from "./ChartAxisLabelLine";

const LABEL_STYLE: CSSProperties = { fontSize: AXIS_LABEL_FONT_SIZE, fontFamily: "Tajawal" };

type ChartAxisLabelProps = {
  /** Horizontal centre of the bar slot this label belongs to. */
  x: number;
  y: number;
  /** Already wrapped/truncated lines coming from `buildAxisLabelLayout`. */
  lines: string[];
  /** Degrees to tilt the label by; 0 keeps it horizontal and centred. */
  rotation: number;
  /** Untruncated label, exposed as a native tooltip. */
  title: string;
};

const ChartAxisLabel = ({ x, y, lines, rotation, title }: ChartAxisLabelProps) => (
  <text
    x={x}
    y={y}
    textAnchor={rotation === 0 ? "middle" : "end"}
    transform={rotation === 0 ? undefined : `rotate(${rotation}, ${x}, ${y})`}
    fill="var(--muted-foreground)"
    style={LABEL_STYLE}
  >
    <title>{title}</title>
    {lines.map((line, index) => (
      <ChartAxisLabelLine key={`${line}-${index}`} x={x} text={line} index={index} />
    ))}
  </text>
);

const MemoChartAxisLabel = memo(ChartAxisLabel);

export default MemoChartAxisLabel;
