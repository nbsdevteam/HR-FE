type DashboardMiniBarProps = {
  value: number;
  max: number;
  color?: string;
};

const DashboardMiniBar = ({ value, max, color = "bg-primary" }: DashboardMiniBarProps) => {
  const width = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;

  return (
    <div className="w-full h-2 rounded-full bg-muted/30 overflow-hidden">
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${width}%` }} />
    </div>
  );
};

export default DashboardMiniBar;
