import { motion } from "motion/react";
import { arabicSource } from "@/i18n/source";
import { WarningEscalationStep } from "./WarningEscalationStep";

type WarningEscalationPathProps = {
  warningTypes: string[];
};

export const WarningEscalationPath = ({ warningTypes }: WarningEscalationPathProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.6 }}
    className="bg-card/30 backdrop-blur-md border border-border/40 rounded-xl p-6 shadow-lg"
  >
    <h3 className="text-foreground mb-4">{arabicSource("warnings.alarm_escalation_path")}</h3>
    <div className="flex items-center justify-between">
      {warningTypes.map((type, i) => (
        <WarningEscalationStep key={type} type={type} index={i} isLast={i === warningTypes.length - 1} />
      ))}
    </div>
  </motion.div>
);
