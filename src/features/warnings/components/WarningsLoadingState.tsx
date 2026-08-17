import { motion } from "motion/react";
import { Clock } from "lucide-react";
import { arabicSource } from "@/i18n/source";

export const WarningsLoadingState = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="flex items-center justify-center h-[300px] text-muted-foreground"
  >
    <div className="text-center">
      <div className="animate-spin mb-4">
        <Clock className="w-8 h-8 mx-auto" />
      </div>
      {arabicSource("warnings.loading_alarms")}
    </div>
  </motion.div>
);
