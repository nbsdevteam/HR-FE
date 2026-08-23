import { memo } from "react";

type ChartRadarAxisLineProps = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

const ChartRadarAxisLine = ({ x1, y1, x2, y2 }: ChartRadarAxisLineProps) => {
  return (
    <line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke="var(--border)"
      strokeOpacity={0.3}
      strokeWidth={1}
    />
  );
};

const MemoChartRadarAxisLine = memo(ChartRadarAxisLine);

export default MemoChartRadarAxisLine;
