import { memo, useCallback } from "react";
import { motion } from "motion/react";
import { Check, X } from "lucide-react";
import { Button, NodeAvatar, StatusBadge } from "@/shared/components";
import { arabicSource } from "@/i18n/source";
import { isLeavePending } from "@/i18n/status";
import { useLocalizedEmployeeName, useLocalizedName } from "@/i18n/useLocalizedName";
import type { TEmployeeNameFields } from "@/i18n/useLocalizedName";
import type { DbLeaveRequest, DbLeaveType } from "@/shared/hooks";
import { formatLeaveDuration } from "../utils/formatLeaveDuration";
import { resolveLeaveExcuseStatus } from "../utils/leaveExcuseStatus";
import LeaveAttachmentIndicator from "./LeaveAttachmentIndicator";
import LeaveExcuseFollowUpControl from "./LeaveExcuseFollowUpControl";

type LeaveRequestKanbanCardProps = {
  leave: DbLeaveRequest;
  index: number;
  employee: TEmployeeNameFields | undefined;
  /** Resolved from `leave.leave_type`, so the card can show a real English name. */
  leaveType: DbLeaveType | undefined;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onViewAttachments: (leave: DbLeaveRequest) => void;
  onFollowUpExcuse: (leave: DbLeaveRequest) => void;
};

const LeaveRequestKanbanCard = ({ leave, index, employee, leaveType, onApprove, onReject, onViewAttachments, onFollowUpExcuse }: LeaveRequestKanbanCardProps) => {
  const { primary: employeeName } = useLocalizedEmployeeName(employee);
  const { primary: leaveTypeName } = useLocalizedName(
    leaveType?.name_ar ?? leave.leave_type,
    leaveType?.name_en,
  );
  const excuseStatus = resolveLeaveExcuseStatus(leave);

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
        <span className="text-foreground" style={{ fontSize: 13 }} data-i18n-ignore>{employeeName}</span>
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <StatusBadge colorClassName="bg-primary/10 border-primary/20 text-primary" fontSize={11} extraClassName="inline-block">
            <span data-i18n-ignore>{leaveTypeName}</span>
            {leave.is_hourly && <span className="ms-1" style={{ fontSize: 10 }}>({arabicSource("leave.hourly")})</span>}
          </StatusBadge>
          {excuseStatus && (
            <StatusBadge colorClassName={excuseStatus.toneClass} fontSize={11} extraClassName="inline-block">
              {excuseStatus.label}
            </StatusBadge>
          )}
        </div>
        {leave.reason && <p className="text-muted-foreground" style={{ fontSize: 11 }} data-i18n-ignore>{leave.reason}</p>}
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground" style={{ fontSize: 11 }} dir={leave.is_hourly ? "ltr" : undefined}>
            {formatLeaveDuration(leave)}
          </span>
          <span className="text-muted-foreground" style={{ fontSize: 10 }} dir="ltr">{leave.start_date}</span>
        </div>
        <LeaveAttachmentIndicator leave={leave} onViewAttachments={onViewAttachments} />
      </div>
      {leave.excuse.active && leave.excuse.state === "pending" ? (
        <div className="mt-2 pt-2 border-t border-border/20">
          <LeaveExcuseFollowUpControl leave={leave} onFollowUp={onFollowUpExcuse} />
        </div>
      ) : (
        !leave.excuse.active &&
        isLeavePending(leave.status) && (
          <div className="flex items-center gap-1 mt-2 pt-2 border-t border-border/20">
            <Button
              onClick={handleApprove}
              variant="unstyled"
              size="unstyled"
              rounded="rounded-md"
              icon={Check}
              iconClassName="w-3.5 h-3.5 inline-block"
              className="flex-1 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400"
              style={{ fontSize: 11 }}
            >
              {" "}
              {arabicSource("common.accept")}
            </Button>
            <Button
              onClick={handleReject}
              variant="unstyled"
              size="unstyled"
              rounded="rounded-md"
              icon={X}
              iconClassName="w-3.5 h-3.5 inline-block"
              className="flex-1 py-1 bg-destructive/10 hover:bg-destructive/20 text-destructive"
              style={{ fontSize: 11 }}
            >
              {" "}
              {arabicSource("common.rejected_2")}
            </Button>
          </div>
        )
      )}
    </motion.div>
  );
};

export default memo(LeaveRequestKanbanCard);
