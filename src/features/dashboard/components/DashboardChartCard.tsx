import type { ReactNode } from "react";
import { motion } from "motion/react";

type DashboardChartCardProps = {
  delay?: number;
  className: string;
  children: ReactNode;
};

const DashboardChartCard = ({
  delay = 0,
  className,
  children,
}: DashboardChartCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className={className}
  >
    {children}
  </motion.div>
);

export default DashboardChartCard;
