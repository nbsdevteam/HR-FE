import { memo, useCallback } from "react";
import { motion } from "motion/react";
import { Check, Trash2, X } from "lucide-react";
import { NodeAvatar, StatusBadge } from "@/shared/components";
import { arabicSource } from "@/i18n/source";
import { isLeavePending, leaveStatusKeys, normalizeLeaveStatus, translateBackendCode } from "@/i18n/status";
import type { DbLeaveRequest, DbLeaveType } from "@/shared/hooks";
import { leaveStatusColors } from "../styles";

type LeaveRequestTableRowProps = {
  leave: DbLeaveRequest;
  index: number;
  employeeName: string;
  leaveType: DbLeaveType | undefined;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onDelete: (id: string) => void;
};

const LeaveRequestTableRow = ({ leave, index, employeeName, leaveType, onApprove, onReject, onDelete }: LeaveRequestTableRowProps) => {
  const handleApprove = useCallback(() => onApprove(leave.id), [onApprove, leave.id]);
  const handleReject = useCallback(() => onReject(leave.id), [onReject, leave.id]);
  const handleDelete = useCallback(() => onDelete(leave.id), [onDelete, leave.id]);

  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.02 }}
      className="border-b border-border/20 hover:bg-muted/10 transition-colors"
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <NodeAvatar
            name={employeeName}
            initials={employeeName.charAt(0)}
            sizeClassName="w-7 h-7"
            extraClassName="flex-shrink-0"
            fallbackClassName="bg-primary/20 border border-primary/30"
            textClassName="text-primary"
            fontSize={11}
          />
          <span className="text-foreground" style={{ fontSize: 13 }}>{employeeName}</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <StatusBadge
          colorClassName=""
          style={{
            borderColor: leaveType?.color || "#3b82f6",
            color: leaveType?.color || "#3b82f6",
            backgroundColor: `${leaveType?.color || "#3b82f6"}15`,
          }}
        >
          {leave.leave_type}
          {leave.is_half_day && <span className="ms-1" style={{ fontSize: 10 }}>{arabicSource("leave.half_a_day")}</span>}
        </StatusBadge>
      </td>
      <td className="px-4 py-3 text-muted-foreground" style={{ fontSize: 13 }} dir="ltr">{leave.start_date}</td>
      <td className="px-4 py-3 text-muted-foreground" style={{ fontSize: 13 }} dir="ltr">{leave.end_date}</td>
      <td className="px-4 py-3 text-foreground" style={{ fontSize: 13 }}>
        {leave.days} {leave.is_half_day ? arabicSource("common.half_a_day") : arabicSource("common.days_2")}
      </td>
      <td className="px-4 py-3 text-muted-foreground" style={{ fontSize: 13 }}>{leave.reason || "—"}</td>
      <td className="px-4 py-3">
        <StatusBadge colorClassName={leaveStatusColors[normalizeLeaveStatus(leave.status)] || ""}>
          {translateBackendCode(leave.status, leaveStatusKeys)}
        </StatusBadge>
      </td>
      <td className="px-4 py-3">
        {isLeavePending(leave.status) ? (
          <div className="flex items-center gap-1">
            <button onClick={handleApprove} className="p-1.5 rounded hover:bg-emerald-500/20 transition-colors cursor-pointer" title={arabicSource("common.accept")}>
              <Check className="w-4 h-4 text-emerald-400" />
            </button>
            <button onClick={handleReject} className="p-1.5 rounded hover:bg-destructive/20 transition-colors cursor-pointer" title={arabicSource("common.rejected_2")}>
              <X className="w-4 h-4 text-destructive" />
            </button>
            <button onClick={handleDelete} className="p-1.5 rounded hover:bg-destructive/20 transition-colors cursor-pointer" title={arabicSource("common.delete")}>
              <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>
        ) : (
          <span className="text-muted-foreground" style={{ fontSize: 11 }}>
            {leave.rejection_reason && <span className="text-destructive">{leave.rejection_reason}</span>}
          </span>
        )}
      </td>
    </motion.tr>
  );
};

export default memo(LeaveRequestTableRow);
