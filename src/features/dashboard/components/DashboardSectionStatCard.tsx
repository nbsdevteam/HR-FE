import type { ComponentType, ReactNode } from "react";
import { motion } from "motion/react";

type DashboardSectionStatCardProps = {
  label: string;
  value: ReactNode;
  sub: ReactNode;
  icon: ComponentType<{ className?: string }>;
  color: string;
  index: number;
  valueTextClassName?: string;
  dir?: "ltr";
};

const DashboardSectionStatCard = ({
  label,
  value,
  sub,
  icon: Icon,
  color,
  index,
  valueTextClassName = "text-2xl",
  dir,
}: DashboardSectionStatCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.07 }}
    className="relative bg-card backdrop-blur-sm border border-border rounded-xl p-5 shadow-lg overflow-hidden"
  >
    <div className="absolute top-0 end-0 w-32 h-32 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full" />
    <div className="flex items-start justify-between relative z-10">
      <div>
        <p className="text-muted-foreground" style={{ fontSize: 12 }}>{label}</p>
        <p className={`${valueTextClassName} font-semibold mt-1 ${color}`} dir={dir}>{value}</p>
        <p className="text-muted-foreground mt-1" style={{ fontSize: 11 }}>{sub}</p>
      </div>
      <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20"><Icon className="w-5 h-5 text-primary" /></div>
    </div>
  </motion.div>
);

export default DashboardSectionStatCard;
