import { memo, useCallback } from "react";
import { motion } from "motion/react";
import { Check, X } from "lucide-react";
import { NodeAvatar, StatusBadge } from "@/shared/components";
import { arabicSource } from "@/i18n/source";
import { isLeavePending } from "@/i18n/status";
import type { DbLeaveRequest } from "@/shared/hooks";

type LeaveRequestKanbanCardProps = {
  leave: DbLeaveRequest;
  index: number;
  employeeName: string;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
};

const LeaveRequestKanbanCard = ({ leave, index, employeeName, onApprove, onReject }: LeaveRequestKanbanCardProps) => {
  const handleApprove = useCallback(() => onApprove(leave.id), [onApprove, leave.id]);
  const handleReject = useCallback(() => onReject(leave.id), [onReject, leave.id]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05 }}
      className="bg-card/60 border border-border/30 rounded-lg p-3 shadow-sm hover:shadow-md hover:border-primary/30 transition-all"
    >
      <div className="flex items-center gap-2 mb-2">
        <NodeAvatar
          name={employeeName}
          initials={employeeName.charAt(0)}
          sizeClassName="w-7 h-7"
          fallbackClassName="bg-primary/20 border border-primary/30"
          textClassName="text-primary"
          fontSize={11}
        />
        <span className="text-foreground" style={{ fontSize: 13 }}>{employeeName}</span>
      </div>
      <div className="space-y-1.5">
        <StatusBadge colorClassName="bg-primary/10 border-primary/20 text-primary" fontSize={11} extraClassName="inline-block">
          {leave.leave_type}
        </StatusBadge>
        {leave.reason && <p className="text-muted-foreground" style={{ fontSize: 11 }}>{leave.reason}</p>}
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground" style={{ fontSize: 11 }}>
            {leave.days} {leave.is_half_day ? arabicSource("common.half_a_day") : arabicSource("common.days_2")}
          </span>
          <span className="text-muted-foreground" style={{ fontSize: 10 }} dir="ltr">{leave.start_date}</span>
        </div>
      </div>
      {isLeavePending(leave.status) && (
        <div className="flex items-center gap-1 mt-2 pt-2 border-t border-border/20">
          <button onClick={handleApprove} className="flex-1 py-1 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-colors cursor-pointer" style={{ fontSize: 11 }}>
            <Check className="w-3.5 h-3.5 inline-block" /> {arabicSource("common.accept")}
          </button>
          <button onClick={handleReject} className="flex-1 py-1 rounded-md bg-destructive/10 hover:bg-destructive/20 text-destructive transition-colors cursor-pointer" style={{ fontSize: 11 }}>
            <X className="w-3.5 h-3.5 inline-block" /> {arabicSource("common.rejected_2")}
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default memo(LeaveRequestKanbanCard);
