import { memo, useCallback } from "react";
import { motion } from "motion/react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { NodeAvatar } from "@/shared/components";
import { formatCurrency } from "@/shared/utils/currency";
import { arabicSource } from "@/i18n/source";
import type { PayrollRow } from "@/shared/api/payrollTypes";

type PayrollOverviewRowProps = {
  row: PayrollRow;
  index: number;
  onViewPayslip: (id: string) => void;
};

const PayrollOverviewRow = ({ row: r, index: i, onViewPayslip }: PayrollOverviewRowProps) => {
  const handleClick = useCallback(() => onViewPayslip(String(r.employee_id)), [onViewPayslip, r.employee_id]);

  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: i * 0.02 }}
      className="border-b border-border/20 hover:bg-muted/10 transition-colors cursor-pointer"
      onClick={handleClick}
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <NodeAvatar
            name={r.employee_name}
            initials={r.employee_name.charAt(0)}
            sizeClassName="w-8 h-8"
            extraClassName="border border-primary/30 flex-shrink-0"
            fallbackClassName="bg-primary/20"
            textClassName="text-primary"
            fontSize={12}
          />
          <span className="text-foreground whitespace-nowrap">{r.employee_name}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap" style={{ fontSize: 13 }}>{r.department_name}</td>
      <td className="px-4 py-3 text-foreground whitespace-nowrap text-center" style={{ fontSize: 13 }} dir="ltr">
        {formatCurrency(r.basic_salary, r.currency)}
      </td>
      <td className="px-4 py-3 text-foreground" style={{ fontSize: 13 }}>{r.days_worked}</td>
      <td className="px-4 py-3 text-foreground" style={{ fontSize: 13 }}>{r.total_hours.toFixed(1)}</td>
      <td className="px-4 py-3" style={{ fontSize: 13 }}>
        {r.overtime_hours > 0 ? (
          <span className="text-emerald-400 flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" /> {r.overtime_hours.toFixed(1)}h
          </span>
        ) : <span className="text-muted-foreground">—</span>}
      </td>
      <td className="px-4 py-3" style={{ fontSize: 13 }}>
        {r.shortfall_hours > 0 ? (
          <span className="text-amber-400 flex items-center gap-1">
            <ArrowDownRight className="w-3.5 h-3.5" /> {r.shortfall_hours.toFixed(1)}h
          </span>
        ) : <span className="text-muted-foreground">—</span>}
      </td>
      <td className="px-4 py-3" style={{ fontSize: 13 }}>
        {r.absence_days > 0 ? (
          <span className="text-destructive">{r.absence_days} {arabicSource("common.days_2")}</span>
        ) : <span className="text-muted-foreground">—</span>}
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-center" style={{ fontSize: 13 }} dir="ltr">
        <span className="text-gradient-gold">{formatCurrency(r.net_salary, r.currency)}</span>
      </td>
    </motion.tr>
  );
};

export default memo(PayrollOverviewRow);
