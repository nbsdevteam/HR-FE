import { memo, useCallback } from "react";
import { motion } from "motion/react";
import { Ban } from "lucide-react";
import { Button, StatusBadge } from "@/shared/components";
import { arabicSource } from "@/i18n/source";
import { STATUS_TONES } from "@/shared/utils/statusColors";
import type { DbLeaveEntitlementAdjustment } from "@/shared/hooks";
import { formatLeaveDays } from "../utils/accrual";

type AdditionalLeaveHistoryRowProps = {
  adjustment: DbLeaveEntitlementAdjustment;
  index: number;
  canManage: boolean;
  onVoid: (adjustment: DbLeaveEntitlementAdjustment) => void;
};

/** One `/entitlement-adjustments/list` grant row (backend v1.17.0 §3, §4). */
const AdditionalLeaveHistoryRow = ({ adjustment, index, canManage, onVoid }: AdditionalLeaveHistoryRowProps) => {
  const handleVoid = useCallback(() => onVoid(adjustment), [onVoid, adjustment]);

  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.02 }}
      className="border-b border-border/20 hover:bg-muted/10 transition-colors"
    >
      <td className="px-4 py-3 text-muted-foreground" style={{ fontSize: 13 }} dir="ltr">
        {adjustment.effective_date}
      </td>
      <td className="px-4 py-3 text-foreground" style={{ fontSize: 13 }} data-i18n-ignore>
        {adjustment.leave_type_name}
      </td>
      <td className="px-4 py-3 text-emerald-400" style={{ fontSize: 13 }} dir="ltr">
        +{formatLeaveDays(adjustment.additional_days)}
      </td>
      <td className="px-4 py-3 text-foreground max-w-xs truncate" style={{ fontSize: 13 }} data-i18n-ignore>
        {adjustment.reason}
      </td>
      <td className="px-4 py-3 text-muted-foreground" style={{ fontSize: 13 }} data-i18n-ignore>
        {adjustment.granted_by_name}
      </td>
      <td className="px-4 py-3">
        {!adjustment.active ? (
          <StatusBadge colorClassName={STATUS_TONES.neutral}>
            {arabicSource("leave.additional_leave_voided")}
          </StatusBadge>
        ) : !adjustment.funded ? (
          <StatusBadge colorClassName={STATUS_TONES.warning}>
            {arabicSource("leave.additional_leave_pending")}
          </StatusBadge>
        ) : (
          <StatusBadge colorClassName={STATUS_TONES.success}>
            {arabicSource("leave.additional_leave_active")}
          </StatusBadge>
        )}
      </td>
      <td className="px-4 py-3 text-end">
        {canManage && adjustment.active && (
          <Button variant="ghost" size="sm" icon={Ban} onClick={handleVoid}>
            {arabicSource("leave.additional_leave_void")}
          </Button>
        )}
      </td>
    </motion.tr>
  );
};

export default memo(AdditionalLeaveHistoryRow);
