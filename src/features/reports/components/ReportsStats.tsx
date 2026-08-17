import { motion } from "motion/react";
import { BarChart3, ClipboardCheck, FileText, Users } from "lucide-react";
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
      {items.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-card backdrop-blur-sm border border-border rounded-xl p-5 shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground" style={{ fontSize: 13 }}>{stat.label}</p>
                <span className="text-gradient-gold block mt-2" style={{ fontSize: 28 }}>{stat.value}</span>
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

export default ReportsStats;
