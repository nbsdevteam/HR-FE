import { memo, useCallback } from "react";
import { motion } from "motion/react";
import { Check, Trash2, X } from "lucide-react";
import { Button, NodeAvatar, StatusBadge } from "@/shared/components";
import { arabicSource } from "@/i18n/source";
import { isLeavePending, leaveStatusKeys, normalizeLeaveStatus, translateBackendCode } from "@/i18n/status";
import { useLocalizedEmployeeName, useLocalizedName } from "@/i18n/useLocalizedName";
import type { TEmployeeNameFields } from "@/i18n/useLocalizedName";
import type { DbLeaveRequest, DbLeaveType } from "@/shared/hooks";
import { formatLeaveDuration } from "../utils/formatLeaveDuration";
import { resolveLeaveExcuseStatus } from "../utils/leaveExcuseStatus";
import { leaveStatusColors } from "../styles";
import LeaveAttachmentIndicator from "./LeaveAttachmentIndicator";
import LeaveExcuseFollowUpControl from "./LeaveExcuseFollowUpControl";

type LeaveRequestTableRowProps = {
  leave: DbLeaveRequest;
  index: number;
  employee: TEmployeeNameFields | undefined;
  /** Shown when the employee record is missing, so the row still identifies the request. */
  fallbackEmployeeLabel: string;
  leaveType: DbLeaveType | undefined;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onDelete: (id: string) => void;
  onViewAttachments: (leave: DbLeaveRequest) => void;
  onFollowUpExcuse: (leave: DbLeaveRequest) => void;
};

const LeaveRequestTableRow = ({ leave, index, employee, fallbackEmployeeLabel, leaveType, onApprove, onReject, onDelete, onViewAttachments, onFollowUpExcuse }: LeaveRequestTableRowProps) => {
  const { primary: localizedEmployeeName } = useLocalizedEmployeeName(employee);
  const { primary: leaveTypeName } = useLocalizedName(
    leaveType?.name_ar ?? leave.leave_type,
    leaveType?.name_en,
  );
  const employeeName = employee ? localizedEmployeeName : fallbackEmployeeLabel;
  const excuseStatus = resolveLeaveExcuseStatus(leave);

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
          <span className="text-foreground" style={{ fontSize: 13 }} data-i18n-ignore>{employeeName}</span>
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
          <span data-i18n-ignore>{leaveTypeName}</span>
          {leave.is_half_day && <span className="ms-1" style={{ fontSize: 10 }}>{arabicSource("leave.half_a_day")}</span>}
          {leave.is_hourly && <span className="ms-1" style={{ fontSize: 10 }}>({arabicSource("leave.hourly")})</span>}
        </StatusBadge>
      </td>
      <td className="px-4 py-3 text-muted-foreground" style={{ fontSize: 13 }} dir="ltr">{leave.start_date}</td>
      <td className="px-4 py-3 text-muted-foreground" style={{ fontSize: 13 }} dir="ltr">{leave.end_date}</td>
      <td className="px-4 py-3 text-foreground" style={{ fontSize: 13 }} dir={leave.is_hourly ? "ltr" : undefined}>
        {formatLeaveDuration(leave)}
      </td>
      <td className="px-4 py-3 text-muted-foreground" style={{ fontSize: 13 }}>
        <div data-i18n-ignore>{leave.reason || "—"}</div>
        <LeaveAttachmentIndicator leave={leave} onViewAttachments={onViewAttachments} />
      </td>
      <td className="px-4 py-3">
        <StatusBadge colorClassName={excuseStatus ? excuseStatus.toneClass : (leaveStatusColors[normalizeLeaveStatus(leave.status)] || "")}>
          {excuseStatus ? excuseStatus.label : translateBackendCode(leave.status, leaveStatusKeys)}
        </StatusBadge>
      </td>
      <td className="px-4 py-3">
        {leave.excuse.active && leave.excuse.state === "pending" ? (
          <LeaveExcuseFollowUpControl leave={leave} onFollowUp={onFollowUpExcuse} />
        ) : leave.excuse.active ? (
          <span className="text-muted-foreground" style={{ fontSize: 11 }}>
            {leave.excuse.decision_comment && <span data-i18n-ignore>{leave.excuse.decision_comment}</span>}
          </span>
        ) : isLeavePending(leave.status) ? (
          <div className="flex items-center gap-1">
            <Button
              onClick={handleApprove}
              variant="unstyled"
              size="unstyled"
              rounded="rounded"
              icon={Check}
              iconClassName="w-4 h-4 text-emerald-400"
              className="p-1.5 hover:bg-emerald-500/20"
              title={arabicSource("common.accept")}
            />
            <Button
              onClick={handleReject}
              variant="unstyled"
              size="unstyled"
              rounded="rounded"
              icon={X}
              iconClassName="w-4 h-4 text-destructive"
              className="p-1.5 hover:bg-destructive/20"
              title={arabicSource("common.rejected_2")}
            />
            <Button
              onClick={handleDelete}
              variant="unstyled"
              size="unstyled"
              rounded="rounded"
              icon={Trash2}
              iconClassName="w-3.5 h-3.5 text-muted-foreground"
              className="p-1.5 hover:bg-destructive/20"
              title={arabicSource("common.delete")}
            />
          </div>
        ) : (
          <span className="text-muted-foreground" style={{ fontSize: 11 }}>
            {leave.rejection_reason && <span className="text-destructive" data-i18n-ignore>{leave.rejection_reason}</span>}
          </span>
        )}
      </td>
    </motion.tr>
  );
};

export default memo(LeaveRequestTableRow);
