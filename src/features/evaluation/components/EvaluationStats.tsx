import { motion } from "motion/react";
import { Award, ClipboardCheck, Target, TrendingUp } from "lucide-react";
import { arabicSource } from "@/i18n/source";

type EvaluationStatsProps = {
  totalEvals: number;
  completedCount: number;
  inProgressCount: number;
  avgRating: string;
};

const EvaluationStats = ({ totalEvals, completedCount, inProgressCount, avgRating }: EvaluationStatsProps) => {
  const stats = [
    { label: arabicSource("evaluation.total_ratings"), value: totalEvals, icon: ClipboardCheck },
    { label: arabicSource("common.complete_2"), value: completedCount, icon: Award },
    { label: arabicSource("common.under_evaluation"), value: inProgressCount, icon: Target },
    { label: arabicSource("evaluation.average_rating"), value: avgRating, icon: TrendingUp },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {stats.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ y: -4, boxShadow: "0 20px 40px -12px rgba(0,0,0,0.15)" }}
            className="bg-card backdrop-blur-sm border border-border rounded-xl p-4 shadow-lg relative overflow-hidden hover:border-primary/30 transition-colors"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent w-28 pointer-events-none" />
            <div className="flex items-center justify-between relative z-10">
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

export default EvaluationStats;
