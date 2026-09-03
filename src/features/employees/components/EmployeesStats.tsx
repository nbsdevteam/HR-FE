import { useMemo } from "react";
import { Calendar, CheckCircle2, Fingerprint, Users } from "lucide-react";
import StatCard from "@/shared/components/StatCard";
import { countBy } from "@/shared/utils/collections";
import type { Employee } from "@/features/employees";
import { arabicSource } from "@/i18n/source";

type EmployeesStatsProps = {
  employees: Employee[];
  deviceSyncedCount: number;
};

const EmployeesStats = ({ employees, deviceSyncedCount }: EmployeesStatsProps) => {
  /** One pass over the roster instead of a full filter per tile. */
  const stats = useMemo(() => {
    const byStatus = countBy(employees, e => e.status);
    return [
      { label: arabicSource("common.total_employees"), value: employees.length, icon: Users },
      { label: arabicSource("employees.are_active"), value: byStatus.get(arabicSource("common.is_active")) ?? 0, icon: CheckCircle2 },
      { label: arabicSource("employees.is_on_vacation"), value: byStatus.get(arabicSource("common.leave")) ?? 0, icon: Calendar },
      { label: arabicSource("employees.are_synchronized_with_the_device"), value: deviceSyncedCount, icon: Fingerprint },
    ];
  }, [employees, deviceSyncedCount]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat, i) => (
        <StatCard key={stat.label} label={stat.label} value={stat.value} icon={stat.icon} index={i} decoration="glow" hoverLift hideIconBelow={1000} />
      ))}
    </div>
  );
};

export default EmployeesStats;
