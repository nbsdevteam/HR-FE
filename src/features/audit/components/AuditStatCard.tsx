import type { ComponentType } from "react";
import { motion } from "motion/react";

type AuditStatCardProps = {
  label: string;
  value: number;
  icon: ComponentType<{ className?: string }>;
  index: number;
};

export function AuditStatCard({ label, value, icon: Icon, index }: AuditStatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-card backdrop-blur-sm border border-border rounded-xl p-4 shadow-lg"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-xs">{label}</p>
          <span className="text-gradient-gold text-xl">{value}</span>
        </div>
        <Icon className="w-5 h-5 text-primary" />
      </div>
    </motion.div>
  );
}
