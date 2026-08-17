import { Calendar, CheckCircle2, Fingerprint, Users } from "lucide-react";
import StatCard from "@/shared/components/StatCard";
import type { Employee } from "@/features/employees";
import { arabicSource } from "@/i18n/source";

type EmployeesStatsProps = {
  employees: Employee[];
  deviceSyncedCount: number;
};

const EmployeesStats = ({ employees, deviceSyncedCount }: EmployeesStatsProps) => {
  const stats = [
    { label: arabicSource("common.total_employees"), value: employees.length, icon: Users },
    { label: arabicSource("employees.are_active"), value: employees.filter(e => e.status === arabicSource("common.is_active")).length, icon: CheckCircle2 },
    { label: arabicSource("employees.is_on_vacation"), value: employees.filter(e => e.status === arabicSource("common.leave")).length, icon: Calendar },
    { label: arabicSource("employees.are_synchronized_with_the_device"), value: deviceSyncedCount, icon: Fingerprint },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat, i) => (
        <StatCard key={stat.label} label={stat.label} value={stat.value} icon={stat.icon} index={i} decoration="glow" hoverLift />
      ))}
    </div>
  );
};

export default EmployeesStats;
