import { motion } from "motion/react";
import { Calendar, CheckCircle2, Fingerprint, Users } from "lucide-react";
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
      {stats.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ y: -4, boxShadow: "0 20px 40px -12px rgba(0,0,0,0.15)" }}
            className="bg-card backdrop-blur-sm border border-border rounded-xl p-4 shadow-lg relative overflow-hidden hover:border-primary/30 transition-colors"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent w-28 pointer-events-none" />
            <div className="flex items-center justify-between relative z-10">
              <div>
                <p className="text-muted-foreground" style={{ fontSize: 13 }}>{stat.label}</p>
                <span className="text-gradient-gold block mt-1" style={{ fontSize: 28 }}>{stat.value}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20">
                <Icon className="w-5 h-5 text-primary" />
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default EmployeesStats;
