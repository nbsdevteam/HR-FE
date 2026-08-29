import { memo } from "react";

type ChartRadarGridLevelProps = {
  points: string;
};

const ChartRadarGridLevel = ({ points }: ChartRadarGridLevelProps) => {
  return (
    <polygon
      points={points}
      fill="none"
      stroke="var(--border)"
      strokeOpacity={0.3}
      strokeWidth={1}
    />
  );
};

const MemoChartRadarGridLevel = memo(ChartRadarGridLevel);

export default MemoChartRadarGridLevel;
