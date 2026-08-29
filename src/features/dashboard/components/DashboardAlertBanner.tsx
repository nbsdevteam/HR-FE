import type { ComponentType, ReactNode } from "react";
import { motion } from "motion/react";

type DashboardAlertBannerProps = {
  icon: ComponentType<{ className?: string }>;
  message: ReactNode;
  colorClassName: string;
  textColorClassName: string;
};

const DashboardAlertBanner = ({ icon: Icon, message, colorClassName, textColorClassName }: DashboardAlertBannerProps) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    className={`flex items-center gap-3 p-3 rounded-xl ${colorClassName}`}
  >
    <Icon className={`w-4 h-4 ${textColorClassName} flex-shrink-0`} />
    <p className={`${textColorClassName} text-xs font-medium`}>{message}</p>
  </motion.div>
);

export default DashboardAlertBanner;
