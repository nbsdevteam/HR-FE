import { motion } from "motion/react";
import { CalendarCheck } from "lucide-react";
import { getStatusColor, STATUS_TONES } from "@/shared/utils/statusColors";
import { arabicSource } from "@/i18n/source";
import type { LeaveRecord } from "../types";
import RecordIconBadge from "./shared/RecordIconBadge";

/** Arabic leave-status labels mapped onto the shared badge tones. */
const leaveStatusColors: Record<string, string> = {
  // Canonical statuses emitted by mapLeaveStatus.
  [arabicSource("common.accepted")]: STATUS_TONES.success,
  [arabicSource("common.pending")]: STATUS_TONES.accent,
  [arabicSource("common.rejected_3")]: STATUS_TONES.danger,
  [arabicSource("common.canceled")]: STATUS_TONES.muted,
  // Legacy feminine labels, kept so older rows keep their colour.
  [arabicSource("common.agreed")]: STATUS_TONES.success,
  [arabicSource("common.pending_2")]: STATUS_TONES.accent,
  [arabicSource("common.rejected")]: STATUS_TONES.danger,
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
        <RecordIconBadge icon={CalendarCheck} wrapperClassName="p-2 rounded-lg bg-primary/10" iconClassName="w-4 h-4 text-primary" />
        <span className="text-foreground" style={{ fontSize: 14 }}>{leave.type}</span>
      </div>
      <span className={`px-2.5 py-1 rounded-md border ${getStatusColor(leave.status, leaveStatusColors)}`} style={{ fontSize: 12 }}>
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
