import { memo, useCallback } from "react";
import { motion } from "motion/react";
import { Check, X } from "lucide-react";
import { Button } from "@/shared/components";
import { arabicSource } from "@/i18n/source";
import type { DbLeaveExcuseQueueItem } from "@/shared/hooks";
import { formatLeaveDays } from "../utils/accrual";
import type { LeaveExcuseDecisionAction } from "../hooks/useLeaveExcuseReview";

type LeaveExcuseQueueRowProps = {
  item: DbLeaveExcuseQueueItem;
  index: number;
  onDecide: (item: DbLeaveExcuseQueueItem, action: LeaveExcuseDecisionAction) => void;
};

/** One `/api/hr/leave/excuse/pending` row (backend v1.16.0 §4). */
const LeaveExcuseQueueRow = ({ item, index, onDecide }: LeaveExcuseQueueRowProps) => {
  const handleApprove = useCallback(() => onDecide(item, "approve"), [onDecide, item]);
  const handleReject = useCallback(() => onDecide(item, "reject"), [onDecide, item]);

  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.02 }}
      className="border-b border-border/20 hover:bg-muted/10 transition-colors"
    >
      <td className="px-4 py-3 text-foreground" style={{ fontSize: 13 }} data-i18n-ignore>
        {item.employee_name}
      </td>
      <td className="px-4 py-3 text-muted-foreground" style={{ fontSize: 13 }} data-i18n-ignore>
        {item.leave_type_name}
      </td>
      <td className="px-4 py-3 text-muted-foreground" style={{ fontSize: 13 }} dir="ltr">
        {item.date_from}
      </td>
      <td className="px-4 py-3 text-muted-foreground" style={{ fontSize: 13 }} dir="ltr">
        {item.date_to}
      </td>
      <td className="px-4 py-3 text-foreground" style={{ fontSize: 13 }} dir="ltr">
        {formatLeaveDays(item.number_of_days)} {arabicSource("common.days_2")}
      </td>
      <td className="px-4 py-3 text-muted-foreground max-w-xs truncate" style={{ fontSize: 13 }} data-i18n-ignore>
        {item.reason || "—"}
      </td>
      <td className="px-4 py-3 text-destructive" style={{ fontSize: 13 }} dir="ltr">
        {formatLeaveDays(item.current_balance)}
      </td>
      <td className="px-4 py-3 text-muted-foreground" style={{ fontSize: 13 }} dir="ltr">
        {item.excuse.followup_count}/{item.excuse.followup_max}
      </td>
      <td className="px-4 py-3">
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
        </div>
      </td>
    </motion.tr>
  );
};

export default memo(LeaveExcuseQueueRow);
