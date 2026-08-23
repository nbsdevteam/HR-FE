import { useMemo } from "react";
import DonutChart from "@/shared/components/donut-chart";
import { arabicSource } from "@/i18n/source";
import DashboardChartCard from "./DashboardChartCard";
import DashboardAttendanceMetricTile from "./DashboardAttendanceMetricTile";

type DashboardAttendanceChartProps = {
  attendanceStats: any;
  attendanceChartData: any;
  cardCls: string;
};

const DashboardAttendanceChart = ({
  attendanceStats,
  attendanceChartData,
  cardCls,
}: DashboardAttendanceChartProps) => {
  const metrics = useMemo(
    () => [
      {
        label: arabicSource("dashboard.7_days"),
        value: `${attendanceStats.rolling7Rate}%`,
        colorClassName: "text-emerald-400",
      },
      {
        label: arabicSource("dashboard.30_days"),
        value: `${attendanceStats.rolling30Rate}%`,
        colorClassName: "text-blue-400",
      },
      {
        label: arabicSource("dashboard.discipline"),
        value: `${attendanceStats.punctualityRate}%`,
        colorClassName: "text-primary",
      },
      {
        label: arabicSource("common.fingerprint_device"),
        value: `${attendanceStats.deviceCoverage}%`,
        colorClassName: "text-cyan-400",
      },
    ],
    [attendanceStats],
  );

  return (
    <DashboardChartCard delay={0.4} className={cardCls}>
      <h3 className="text-foreground mb-4">
        {arabicSource("common.attendance_status")}{" "}
        {attendanceStats.date
          ? `${attendanceStats.date}`
          : arabicSource("common.today")}
      </h3>
      <div className="flex items-center justify-center" style={{ height: 240 }}>
        <DonutChart data={attendanceChartData} />
      </div>
      <div className="grid grid-cols-4 gap-2 mt-4">
        {metrics.map((metric) => (
          <DashboardAttendanceMetricTile key={metric.label} {...metric} />
        ))}
      </div>
    </DashboardChartCard>
  );
};

export default DashboardAttendanceChart;
