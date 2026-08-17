import { motion } from "motion/react";

type SettingsToastProps = {
  message: string;
};

export const SettingsToast = ({ message }: SettingsToastProps) => (
  <motion.div
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    className="fixed top-4 start-4 end-4 bg-green-500/20 border border-green-500/50 text-green-400 px-4 py-3 rounded-lg z-50"
  >
    {message}
  </motion.div>
);
