import type { ComponentType } from "react";
import { motion } from "motion/react";

type CalendarStatChipProps = {
  label: string;
  value: string | number;
  icon: ComponentType<{ className?: string }>;
  color: string;
  index: number;
};

export function CalendarStatChip({ label, value, icon: Icon, color, index }: CalendarStatChipProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="bg-card/40 border border-border/30 rounded-xl p-3 text-center"
    >
      <Icon className={`w-4 h-4 mx-auto mb-1 ${color}`} />
      <div className={`font-mono ${color}`} style={{ fontSize: 18 }}>{value}</div>
      <div className="text-muted-foreground" style={{ fontSize: 10 }}>{label}</div>
    </motion.div>
  );
}
