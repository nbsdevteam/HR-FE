import { motion } from "motion/react";
import { CheckCircle } from "lucide-react";

type PolicyToastProps = {
  message: string | null;
};

const PolicyToast = ({ message }: PolicyToastProps) => {
  if (!message) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed bottom-6 start-6 z-50 border rounded-full px-5 py-2.5 shadow-xl flex items-center gap-2.5 pointer-events-auto bg-card border-green-500/40"
    >
      <div className="w-5 h-5 rounded-full flex items-center justify-center bg-green-500/20">
        <CheckCircle className="w-3 h-3 text-green-400" />
      </div>
      <span className="text-foreground text-sm">{message}</span>
    </motion.div>
  );
};

export default PolicyToast;
