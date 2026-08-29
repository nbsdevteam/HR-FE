import { memo, useCallback } from "react";
import { motion } from "motion/react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { NodeAvatar } from "@/shared/components";
import { formatCurrency } from "@/shared/utils/currency";
import { arabicSource } from "@/i18n/source";

type PayrollOverviewRowProps = {
  row: any;
  index: number;
  onViewPayslip: (id: string) => void;
};

const PayrollOverviewRow = ({ row: r, index: i, onViewPayslip }: PayrollOverviewRowProps) => {
  const handleClick = useCallback(() => onViewPayslip(r.empId), [onViewPayslip, r.empId]);

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
            name={r.name}
            initials={r.name.charAt(0)}
            sizeClassName="w-8 h-8"
            extraClassName="border border-primary/30 flex-shrink-0"
            fallbackClassName="bg-primary/20"
            textClassName="text-primary"
            fontSize={12}
          />
          <span className="text-foreground whitespace-nowrap">{r.name}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap" style={{ fontSize: 13 }}>{r.department}</td>
      <td className="px-4 py-3 text-foreground whitespace-nowrap text-center" style={{ fontSize: 13 }} dir="ltr">
        {formatCurrency(r.basicSalary, r.currency)}
      </td>
      <td className="px-4 py-3 text-foreground" style={{ fontSize: 13 }}>{r.daysWorked}</td>
      <td className="px-4 py-3 text-foreground" style={{ fontSize: 13 }}>{r.totalHours.toFixed(1)}</td>
      <td className="px-4 py-3" style={{ fontSize: 13 }}>
        {r.overtime > 0 ? (
          <span className="text-emerald-400 flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" /> {r.overtime.toFixed(1)}h
          </span>
        ) : <span className="text-muted-foreground">—</span>}
      </td>
      <td className="px-4 py-3" style={{ fontSize: 13 }}>
        {r.shortfall > 0 ? (
          <span className="text-amber-400 flex items-center gap-1">
            <ArrowDownRight className="w-3.5 h-3.5" /> {r.shortfall.toFixed(1)}h
          </span>
        ) : <span className="text-muted-foreground">—</span>}
      </td>
      <td className="px-4 py-3" style={{ fontSize: 13 }}>
        {r.absences > 0 ? (
          <span className="text-destructive">{r.absences} {arabicSource("common.days_2")}</span>
        ) : <span className="text-muted-foreground">—</span>}
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-center" style={{ fontSize: 13 }} dir="ltr">
        <span className="text-gradient-gold">{formatCurrency(r.netSalary, r.currency)}</span>
      </td>
    </motion.tr>
  );
};

export default memo(PayrollOverviewRow);
