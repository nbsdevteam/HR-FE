import { motion } from "motion/react";
import { AlertTriangle, Archive, CheckCircle, FileText } from "lucide-react";
import { arabicSource } from "@/i18n/source";

type PoliciesStatsProps = {
  stats: {
    total: number;
    active: number;
    underReview: number;
    archived: number;
  };
};

export const PoliciesStats = ({ stats }: PoliciesStatsProps) => {
  const items = [
    { label: arabicSource("policies.total_policies"), value: stats.total, icon: FileText, iconBg: "bg-primary/10 border-primary/20", iconColor: "text-primary" },
    { label: arabicSource("policies.is_active"), value: stats.active, icon: CheckCircle, iconBg: "bg-emerald-500/10 border-emerald-500/20", iconColor: "text-emerald-400" },
    { label: arabicSource("common.is_under_review"), value: stats.underReview, icon: AlertTriangle, iconBg: "bg-primary/10 border-primary/20", iconColor: "text-primary" },
    { label: arabicSource("policies.archived"), value: stats.archived, icon: Archive, iconBg: "bg-muted/10 border-border", iconColor: "text-muted-foreground" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {items.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -4, boxShadow: "0 20px 40px -12px rgba(0,0,0,0.15)" }}
            className="bg-card/30 backdrop-blur-md border border-border/40 rounded-xl p-4 shadow-lg relative overflow-hidden hover:border-primary/30 transition-colors"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent w-28 pointer-events-none" />
            <div className="flex items-center justify-between relative z-10">
              <div>
                <p className="text-muted-foreground text-sm">{stat.label}</p>
                <p className="text-gradient-gold text-2xl font-bold mt-1">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-lg border ${stat.iconBg}`}>
                <Icon className={`w-5 h-5 ${stat.iconColor}`} />
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};
