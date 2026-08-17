import { BarChart3, ClipboardCheck, FileText, Users } from "lucide-react";
import StatCard from "@/shared/components/StatCard";
import { arabicSource } from "@/i18n/source";

type ReportsStatsProps = {
  templateCount: number;
  historyCount: number;
  departmentCount: number;
  employeeCount: number;
};

const ReportsStats = ({ templateCount, historyCount, departmentCount, employeeCount }: ReportsStatsProps) => {
  const items = [
    { label: arabicSource("reports.report_templates"), value: templateCount, icon: BarChart3 },
    { label: arabicSource("reports.reports_generated"), value: historyCount, icon: FileText },
    { label: arabicSource("common.sections"), value: departmentCount, icon: Users },
    { label: arabicSource("common.total_employees"), value: employeeCount, icon: ClipboardCheck },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {items.map((stat, i) => (
        <StatCard key={stat.label} label={stat.label} value={stat.value} icon={stat.icon} index={i} padding="p-5" valueMarginClassName="mt-2" />
      ))}
    </div>
  );
};

export default ReportsStats;
