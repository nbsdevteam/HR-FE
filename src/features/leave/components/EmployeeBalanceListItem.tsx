import { memo, useCallback } from "react";
import { motion } from "motion/react";
import { NodeAvatar } from "@/shared/components";
import { arabicSource } from "@/i18n/source";
import { useLocalizedEmployeeName } from "@/i18n/useLocalizedName";

type EmployeeBalanceListItemProps = {
  emp: any;
  index: number;
  totalUsed: number;
  onSelect: (employeeId: string) => void;
};

const EmployeeBalanceListItem = ({ emp, index, totalUsed, onSelect }: EmployeeBalanceListItemProps) => {
  const { primary: employeeName } = useLocalizedEmployeeName(emp);
  const handleSelect = useCallback(() => onSelect(emp.id), [onSelect, emp.id]);

  return (
    <motion.button
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.02 }}
      onClick={handleSelect}
      className="flex items-center gap-3 p-4 rounded-xl border border-border/30 hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer text-start"
    >
      <NodeAvatar
        name={employeeName}
        initials={employeeName.charAt(0)}
        sizeClassName="w-10 h-10"
        extraClassName="flex-shrink-0"
        fallbackClassName="bg-primary/20 border border-primary/30"
        textClassName="text-primary"
        fontSize={14}
      />
      <div className="flex-1 min-w-0" data-i18n-ignore>
        <p className="text-foreground truncate">{employeeName}</p>
        <p className="text-muted-foreground" style={{ fontSize: 12 }}>{emp.department}</p>
      </div>
      <div className="text-end">
        <p className="text-muted-foreground" style={{ fontSize: 12 }}>{arabicSource("common.user")} {totalUsed} {arabicSource("common.days_2")}</p>
      </div>
    </motion.button>
  );
};

export default memo(EmployeeBalanceListItem);
