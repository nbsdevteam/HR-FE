import { motion } from "motion/react";

const RankBar = ({ label, value, weight }: { label: string; value: number; weight: string }) => {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-muted-foreground" style={{ fontSize: 11 }}>{label} ({weight})</span>
        <span className="text-foreground" style={{ fontSize: 11 }}>{Math.round(value)}%</span>
      </div>
      <div className="w-full h-2 rounded-full bg-muted/30 overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="h-full rounded-full bg-primary" />
      </div>
    </div>
  );
};

export default RankBar;
