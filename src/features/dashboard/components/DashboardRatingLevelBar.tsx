type DashboardRatingLevelBarProps = {
  label: string;
  count: number;
  color: string;
  percent: number;
};

const DashboardRatingLevelBar = ({ label, count, color, percent }: DashboardRatingLevelBarProps) => (
  <div className="flex items-center gap-3">
    <span className="text-sm text-muted-foreground w-32 flex-shrink-0">{label}</span>
    <div className="flex-1 h-6 rounded-full bg-muted/20 overflow-hidden">
      <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${percent}%` }} />
    </div>
    <span className="text-sm text-foreground w-8 text-center">{count}</span>
  </div>
);

export default DashboardRatingLevelBar;
