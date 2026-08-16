import { motion } from "motion/react";
import { AlertTriangle, Briefcase, LogOut, Timer } from "lucide-react";
import { arabicSource } from "@/i18n/source";

type LifecycleStatsProps = {
  activeContracts: number;
  expiringDocs: number;
  probationAlertsCount: number;
  activeExits: number;
};

export const LifecycleStats = ({
  activeContracts,
  expiringDocs,
  probationAlertsCount,
  activeExits,
}: LifecycleStatsProps) => {
  const stats = [
    { label: arabicSource("common.active_contracts"), value: activeContracts, icon: Briefcase, color: "text-emerald-400" },
    { label: arabicSource("lifecycle.documents_are_almost_complete"), value: expiringDocs, icon: AlertTriangle, color: "text-amber-400" },
    { label: arabicSource("lifecycle.close_experience_periods"), value: probationAlertsCount, icon: Timer, color: "text-blue-400" },
    { label: arabicSource("lifecycle.termination_proceedings_in_progress"), value: activeExits, icon: LogOut, color: "text-destructive" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {stats.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            whileHover={{ y: -4, boxShadow: "0 20px 40px -12px rgba(0,0,0,0.15)" }}
            className="relative bg-card backdrop-blur-sm border border-border rounded-xl p-5 shadow-lg overflow-hidden hover:border-primary/30 transition-colors"
          >
            <div className="absolute top-0 end-0 w-28 h-28 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full" />
            <div className="flex items-center justify-between relative z-10">
              <div>
                <p className="text-muted-foreground" style={{ fontSize: 13 }}>{stat.label}</p>
                <span className={`block mt-1 ${stat.color}`} style={{ fontSize: 28 }}>{stat.value}</span>
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
