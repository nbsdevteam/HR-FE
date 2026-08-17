import { motion } from "motion/react";

type WarningToastProps = {
  message: string;
};

const WarningToast = ({ message }: WarningToastProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 20 }}
    className="fixed bottom-6 end-6 bg-card border border-border rounded-lg p-4 shadow-lg max-w-xs z-50"
  >
    <p className="text-foreground text-sm">{message}</p>
  </motion.div>
);

export default WarningToast;
