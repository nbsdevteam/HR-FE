import { AnimatePresence, motion } from "motion/react";
import { AlertTriangle, UserCheck } from "lucide-react";
import { arabicSource } from "@/i18n/source";

type HierarchyToastProps = {
  toast: string | null;
};

export const HierarchyToast = ({ toast }: HierarchyToastProps) => (
  <AnimatePresence>
    {toast && (
      <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }}
        className="fixed bottom-6 inset-x-0 flex justify-center z-40 pointer-events-none">
        <div className={`border rounded-full px-5 py-2.5 shadow-xl flex items-center gap-2.5 pointer-events-auto ${toast.startsWith(arabicSource("common.error")) ? "bg-card border-red-500/40" : "bg-card border-green-500/40"}`}>
          <div className={`w-5 h-5 rounded-full flex items-center justify-center ${toast.startsWith(arabicSource("common.error")) ? "bg-red-500/20" : "bg-green-500/20"}`}>
            {toast.startsWith(arabicSource("common.error")) ? <AlertTriangle className="w-3 h-3 text-red-400" /> : <UserCheck className="w-3 h-3 text-green-400" />}
          </div>
          <span className="text-foreground" style={{ fontSize: 12 }}>{toast}</span>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);
