import { motion } from "motion/react";
import { CalendarCheck } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import type { LeaveRecord } from "../types";

const leaveStatusColors: Record<string, string> = {
  [arabicSource("common.agreed")]: "bg-emerald-500/15 border-emerald-500/30 text-emerald-400",
  [arabicSource("common.pending_2")]: "bg-primary/15 border-primary/30 text-primary",
  [arabicSource("common.rejected")]: "bg-destructive/15 border-destructive/30 text-destructive",
};

type EmployeeLeaveCardProps = {
  leave: LeaveRecord;
};

const EmployeeLeaveCard = ({ leave }: EmployeeLeaveCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 5 }}
    animate={{ opacity: 1, y: 0 }}
    className="p-4 rounded-xl bg-muted/10 border border-border/30"
  >
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <div className="p-2 rounded-lg bg-primary/10">
          <CalendarCheck className="w-4 h-4 text-primary" />
        </div>
        <span className="text-foreground" style={{ fontSize: 14 }}>{leave.type}</span>
      </div>
      <span className={`px-2.5 py-1 rounded-md border ${leaveStatusColors[leave.status]}`} style={{ fontSize: 12 }}>
        {leave.status}
      </span>
    </div>
    <div className="flex items-center gap-6 mt-3 ps-11">
      <span className="text-muted-foreground" style={{ fontSize: 13 }}>
        {arabicSource("shared.from")} <span dir="ltr" className="text-foreground ms-1">{leave.from}</span>
      </span>
      <span className="text-muted-foreground" style={{ fontSize: 13 }}>
        {arabicSource("shared.to")} <span dir="ltr" className="text-foreground ms-1">{leave.to}</span>
      </span>
      <span className="text-primary" style={{ fontSize: 13 }}>
        {leave.days} {arabicSource("common.days")}
      </span>
    </div>
  </motion.div>
);

export default EmployeeLeaveCard;
