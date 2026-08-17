import type { ComponentType } from "react";
import { motion } from "motion/react";
import { cardCls } from "../styles";

type AttendanceSummaryCardProps = {
  label: string;
  value: string | number;
  icon?: ComponentType<{ className?: string }>;
  color?: string;
  index?: number;
  compact?: boolean;
  animated?: boolean;
};

const AttendanceSummaryCard = ({
  label,
  value,
  icon: Icon,
  color = "text-foreground",
  index = 0,
  compact = false,
  animated = false,
}: AttendanceSummaryCardProps) => {
  const content = (
    <>
      {Icon && <Icon className={`${compact ? "w-4 h-4" : "w-5 h-5"} mx-auto mb-1 ${color}`} />}
      <div className={`font-mono ${color}`} style={{ fontSize: compact ? 18 : 24 }}>{value}</div>
      <div className="text-muted-foreground mt-0.5" style={{ fontSize: compact ? 10 : 11 }}>{label}</div>
    </>
  );

  if (!animated) {
    return <div className={`${cardCls} p-${compact ? "3" : "4"} text-center`}>{content}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      whileHover={{ y: -3, boxShadow: "0 20px 40px -12px rgba(0,0,0,0.15)" }}
      className="relative bg-card backdrop-blur-sm border border-border rounded-xl p-3 text-center overflow-hidden shadow-lg hover:border-primary/30 transition-colors cursor-default"
    >
      {content}
    </motion.div>
  );
};

export default AttendanceSummaryCard;
