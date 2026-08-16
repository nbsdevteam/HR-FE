import { motion } from "motion/react";
import { Check, Clock, X } from "lucide-react";
import { arabicSource } from "@/i18n/source";

type LeaveStatsProps = {
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
};

export const LeaveStats = ({ pendingCount, approvedCount, rejectedCount }: LeaveStatsProps) => {
  const stats = [
    { label: arabicSource("leave.pending_requests"), value: pendingCount, icon: Clock },
    { label: arabicSource("leave.requests_accepted"), value: approvedCount, icon: Check },
    { label: arabicSource("leave.requests_rejected"), value: rejectedCount, icon: X },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -4, boxShadow: "0 20px 40px -12px rgba(0,0,0,0.15)" }}
            className="bg-card backdrop-blur-sm border border-border rounded-xl p-4 shadow-lg relative overflow-hidden hover:border-primary/30 transition-colors"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent w-28 pointer-events-none" />
            <div className="flex items-center justify-between relative z-10">
              <div>
                <p className="text-muted-foreground" style={{ fontSize: 13 }}>{stat.label}</p>
                <span className="text-gradient-gold block mt-1" style={{ fontSize: 28 }}>{stat.value}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20">
                <Icon className="w-5 h-5 text-primary" />
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};
