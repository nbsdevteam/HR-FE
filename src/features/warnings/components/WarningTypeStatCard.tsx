import { motion } from "motion/react";
import { AlertTriangle, ShieldAlert } from "lucide-react";

type WarningTypeStatCardProps = {
  type: string;
  count: number;
  index: number;
  colorClass: string;
};

export const WarningTypeStatCard = ({ type, count, index, colorClass }: WarningTypeStatCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: (index + 1) * 0.1 }}
    whileHover={{ y: -4, boxShadow: "0 20px 40px -12px rgba(0,0,0,0.15)" }}
    className="relative bg-card backdrop-blur-sm border border-border rounded-xl p-4 shadow-lg text-center overflow-hidden hover:border-primary/30 transition-colors"
  >
    <div className="absolute top-0 end-0 w-28 h-28 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full" />
    <div className="flex justify-center mb-2 relative z-10">
      <div className={`p-2 rounded-lg ${colorClass}`}>
        {index < 3 ? <AlertTriangle className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
      </div>
    </div>
    <p className="text-muted-foreground relative z-10" style={{ fontSize: 12 }}>{type}</p>
    <span className="text-gradient-gold block mt-1 relative z-10" style={{ fontSize: 24 }}>{count}</span>
  </motion.div>
);
