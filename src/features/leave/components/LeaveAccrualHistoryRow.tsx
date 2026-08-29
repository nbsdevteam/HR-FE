import { memo } from "react";
import { motion } from "motion/react";
import { arabicSource } from "@/i18n/source";
import { formatLeaveDays, type AccrualHistoryRow } from "../utils/accrual";

type LeaveAccrualHistoryRowProps = {
  row: AccrualHistoryRow;
  index: number;
};

const LeaveAccrualHistoryRow = ({ row, index }: LeaveAccrualHistoryRowProps) => (
  <motion.tr
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay: index * 0.02 }}
    className="border-b border-border/20 hover:bg-muted/10 transition-colors"
  >
    <td className="px-4 py-3 text-muted-foreground" style={{ fontSize: 13 }} dir="ltr">
      {row.period_date}
    </td>
    <td className="px-4 py-3 text-foreground" style={{ fontSize: 13 }}>
      {arabicSource("attendance.month")} {row.period_sequence}
    </td>
    <td className="px-4 py-3 text-emerald-400" style={{ fontSize: 13 }} dir="ltr">
      +{formatLeaveDays(row.days)}
    </td>
    <td className="px-4 py-3 text-foreground" style={{ fontSize: 13 }} dir="ltr">
      {formatLeaveDays(row.running_total)}
    </td>
  </motion.tr>
);

export default memo(LeaveAccrualHistoryRow);
