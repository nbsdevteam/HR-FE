import { memo } from "react";
import type { CSSProperties } from "react";

const CARD_STYLE: CSSProperties = {
  background: "var(--card)",
  fontFamily: "Tajawal",
  whiteSpace: "nowrap",
};
const TITLE_STYLE: CSSProperties = { fontSize: 12 };

type ChartTooltipProps = {
  left: string;
  top: string;
  transform: string;
  title: string;
  value: string;
  valueColor: string;
};

const ChartTooltip = ({ left, top, transform, title, value, valueColor }: ChartTooltipProps) => {
  return (
    <div
      className="absolute pointer-events-none z-50"
      style={{ left, top, transform }}
    >
      <div className="px-3 py-2 rounded-lg shadow-xl border border-border/40" style={CARD_STYLE}>
        <p className="text-foreground" style={TITLE_STYLE}>
          {title}
        </p>
        <p style={{ fontSize: 12, color: valueColor }}>{value}</p>
      </div>
    </div>
  );
};

const MemoChartTooltip = memo(ChartTooltip);

export default MemoChartTooltip;
