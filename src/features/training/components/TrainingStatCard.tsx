import { motion } from "motion/react";
import type { LucideIcon } from "lucide-react";

type TrainingStatCardProps = {
  label: string;
  value: string | number;
  icon: LucideIcon;
  index: number;
};

const TrainingStatCard = ({ label, value, icon: Icon, index }: TrainingStatCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.1 }}
    whileHover={{ y: -4, boxShadow: "0 20px 40px -12px rgba(0,0,0,0.15)" }}
    className="relative bg-card backdrop-blur-sm border border-border rounded-xl p-4 shadow-lg overflow-hidden hover:border-primary/30 transition-colors"
  >
    <div className="absolute top-0 end-0 w-28 h-28 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full" />
    <div className="flex items-center justify-between relative z-10">
      <div>
        <p className="text-muted-foreground" style={{ fontSize: 13 }}>
          {label}
        </p>
        <span className="text-gradient-gold block mt-2" style={{ fontSize: 28 }}>
          {value}
        </span>
      </div>
      <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20">
        <Icon className="w-5 h-5 text-primary" />
      </div>
    </div>
  </motion.div>
);

export default TrainingStatCard;
