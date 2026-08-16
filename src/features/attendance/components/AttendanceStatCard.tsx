import type { ComponentType } from "react";
import { motion } from "motion/react";

type AttendanceStatCardProps = {
  label: string;
  value: string | number;
  icon: ComponentType<{ className?: string }>;
  color: string;
  accent: string;
  index: number;
  suffix?: string;
};

export function AttendanceStatCard({ label, value, icon: Icon, color, accent, index, suffix }: AttendanceStatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      whileHover={{ y: -4, boxShadow: "0 20px 40px -12px rgba(0,0,0,0.15)" }}
      className="relative bg-card backdrop-blur-sm border border-border rounded-xl p-4 shadow-lg overflow-hidden hover:border-primary/30 transition-colors"
    >
      <div className={`absolute top-0 end-0 w-28 h-28 bg-gradient-to-bl ${accent} to-transparent rounded-bl-full`} />
      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-muted-foreground" style={{ fontSize: 12 }}>{label}</p>
          <div className="flex items-baseline gap-1.5 mt-1.5">
            <span className="text-gradient-gold" style={{ fontSize: 26 }}>{value}</span>
            {suffix && <span className="text-muted-foreground" style={{ fontSize: 11 }}>{suffix}</span>}
          </div>
        </div>
        <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
          <Icon className={`w-4.5 h-4.5 ${color}`} />
        </div>
      </div>
    </motion.div>
  );
}
