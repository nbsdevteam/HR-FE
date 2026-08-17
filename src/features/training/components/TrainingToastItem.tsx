import { motion } from "motion/react";
import { CheckCircle } from "lucide-react";
import type { Toast } from "../types";

type TrainingToastItemProps = {
  toast: Toast;
};

const TrainingToastItem = ({ toast }: TrainingToastItemProps) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    className={`fixed bottom-6 start-6 z-50 border rounded-full px-5 py-2.5 shadow-xl flex items-center gap-2.5 pointer-events-auto ${
      toast.type === "success"
        ? "bg-card border-green-500/40"
        : toast.type === "error"
          ? "bg-card border-red-500/40"
          : "bg-card border-blue-500/40"
    }`}
  >
    <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
      toast.type === "success" ? "bg-green-500/20" : toast.type === "error" ? "bg-red-500/20" : "bg-blue-500/20"
    }`}>
      <CheckCircle className={`w-3 h-3 ${
        toast.type === "success" ? "text-green-400" : toast.type === "error" ? "text-red-400" : "text-blue-400"
      }`} />
    </div>
    <span className="text-foreground text-sm">{toast.message}</span>
  </motion.div>
);

export default TrainingToastItem;
