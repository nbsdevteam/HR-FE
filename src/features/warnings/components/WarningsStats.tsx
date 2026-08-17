import { motion } from "motion/react";
import { FileWarning } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import type { WarningStats } from "../utils/warningsStats";
import WarningTypeStatCard from "./WarningTypeStatCard";

type WarningsStatsProps = {
  stats: WarningStats;
  typeColors: Record<string, string>;
};

const WarningsStats = ({ stats, typeColors }: WarningsStatsProps) => (
  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0 }}
      whileHover={{ y: -4, boxShadow: "0 20px 40px -12px rgba(0,0,0,0.15)" }}
      className="relative bg-card backdrop-blur-sm border border-border rounded-xl p-4 shadow-lg text-center overflow-hidden hover:border-primary/30 transition-colors"
    >
      <div className="absolute top-0 end-0 w-28 h-28 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full" />
      <div className="flex justify-center mb-2 relative z-10">
        <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 text-primary">
          <FileWarning className="w-5 h-5" />
        </div>
      </div>
      <p className="text-muted-foreground relative z-10" style={{ fontSize: 12 }}>{arabicSource("common.total")}</p>
      <span className="text-gradient-gold block mt-1 relative z-10" style={{ fontSize: 24 }}>{stats.total}</span>
    </motion.div>

    {stats.byType.map((item, i) => (
      <WarningTypeStatCard key={item.type} type={item.type} count={item.count} index={i} colorClass={typeColors[item.type]} />
    ))}
  </div>
);

export default WarningsStats;
