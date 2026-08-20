type DashboardAttendanceMetricTileProps = {
  label: string;
  value: string;
  colorClassName: string;
};

const DashboardAttendanceMetricTile = ({
  label,
  value,
  colorClassName,
}: DashboardAttendanceMetricTileProps) => (
  <div className="text-center p-2 rounded-lg bg-muted/20">
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className={`text-sm font-medium ${colorClassName}`}>{value}</p>
  </div>
);

export default DashboardAttendanceMetricTile;
