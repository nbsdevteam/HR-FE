import { memo } from "react";
import type { CSSProperties } from "react";

const SECONDARY_STYLE: CSSProperties = { fontSize: 11 };

type ChartDonutCenterLabelProps = {
  primaryText: string;
  primaryFontSize: number;
  secondaryText: string;
};

const ChartDonutCenterLabel = ({
  primaryText,
  primaryFontSize,
  secondaryText,
}: ChartDonutCenterLabelProps) => {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
      <span className="text-foreground" style={{ fontSize: primaryFontSize }}>
        {primaryText}
      </span>
      <span className="text-muted-foreground" style={SECONDARY_STYLE}>
        {secondaryText}
      </span>
    </div>
  );
};

const MemoChartDonutCenterLabel = memo(ChartDonutCenterLabel);

export default MemoChartDonutCenterLabel;
