const SKELETON_BAR_HEIGHTS = [55, 70, 40, 85, 60, 45, 75];

type WeeklySkeletonBarProps = {
  heightPercent: number;
};

const WeeklySkeletonBar = ({ heightPercent }: WeeklySkeletonBarProps) => (
  <div className="flex-1 flex items-end h-full">
    <div
      className="w-full bg-muted/30 rounded-md animate-pulse"
      style={{ height: `${heightPercent}%` }}
    />
  </div>
);

const WeeklyAttendanceChartSkeleton = () => (
  <div className="flex items-end gap-2" style={{ height: 180 }}>
    {SKELETON_BAR_HEIGHTS.map((heightPercent, index) => (
      <WeeklySkeletonBar key={index} heightPercent={heightPercent} />
    ))}
  </div>
);

export default WeeklyAttendanceChartSkeleton;
