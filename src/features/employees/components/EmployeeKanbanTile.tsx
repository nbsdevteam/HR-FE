import { memo, useCallback } from "react";
import { motion } from "motion/react";
import { Calendar, Fingerprint } from "lucide-react";
import { NodeAvatar } from "@/shared/components";
import type { Employee } from "@/features/employees";
import type { DbEmployee } from "@/shared/hooks";
import { formatCurrency } from "@/features/payroll/services/payslip-engine";
import { employeeStatusKeys, translateBackendCode } from "@/i18n/status";
import { statusColors } from "../styles";

type EmployeeKanbanTileProps = {
  emp: Employee;
  index: number;
  accent: string;
  dbEmp: DbEmployee | undefined;
  onSelectEmployee: (employee: Employee) => void;
};

const EmployeeKanbanTile = ({ emp, index, accent, dbEmp, onSelectEmployee }: EmployeeKanbanTileProps) => {
  const handleSelect = useCallback(() => onSelectEmployee(emp), [onSelectEmployee, emp]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      onClick={handleSelect}
      className="relative pt-7 cursor-pointer group"
    >
      <div className="absolute top-0 inset-x-0 flex justify-center z-10">
        <div className="relative">
          <div className="absolute -inset-1 rounded-full opacity-40 group-hover:opacity-70 transition-opacity blur-sm" style={{ background: accent }} />
          <div className="relative w-13 h-13 rounded-full overflow-hidden border-[3px] shadow-lg" style={{ borderColor: accent, boxShadow: `0 4px 14px ${accent}40` }}>
            <NodeAvatar
              photo={emp.photo}
              name={emp.name}
              initials={emp.name.charAt(0)}
              sizeClassName="w-full h-full"
              fallbackClassName="bg-card"
              textClassName="text-primary"
              fontSize={18}
            />
          </div>
        </div>
      </div>
      <div className="relative rounded-xl overflow-hidden border border-white/[0.08] shadow-md group-hover:shadow-xl transition-all" style={{ background: "rgba(255,255,255,0.04)", backdropFilter: "blur(8px)" }}>
        <div className="absolute top-0 start-0 bottom-0 w-1 z-[5]" style={{ background: accent, borderStartStartRadius: 12 }} />
        <div className="absolute top-0 start-0 z-10 flex items-center justify-center" style={{ background: accent, borderStartStartRadius: 11, borderEndEndRadius: 8, padding: "4px 8px 5px 6px", minWidth: 28, boxShadow: `0 2px 6px ${accent}50` }}>
          <span className="text-white" style={{ fontSize: 9, lineHeight: 1 }}>{String(emp.id).padStart(2, "0")}</span>
        </div>
        <div className="h-0.5 w-full" style={{ background: `linear-gradient(to left, ${accent}, transparent)` }} />
        <div className="px-3 pt-7 pb-2.5 text-center">
          <p className="text-foreground truncate" style={{ fontSize: 12 }}>{emp.name}</p>
          <p className="text-muted-foreground truncate mt-0.5" style={{ fontSize: 10 }}>{emp.position}</p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className={`px-1.5 py-0.5 rounded border ${statusColors[emp.status]}`} style={{ fontSize: 9 }}>{translateBackendCode(emp.status, employeeStatusKeys)}</span>
            {dbEmp?.device_employee_no ? (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-muted/20 border border-border/20 font-mono text-muted-foreground" style={{ fontSize: 8 }}>
                <Fingerprint className="w-2.5 h-2.5 text-primary/50" />
                #{dbEmp.device_employee_no}
              </span>
            ) : null}
          </div>
          {emp.phone !== "—" && (
            <p className="text-muted-foreground/50 truncate mt-1" style={{ fontSize: 8 }} dir="ltr">{emp.phone}</p>
          )}
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/[0.06]">
            <span className="flex items-center gap-0.5 text-muted-foreground/60" style={{ fontSize: 9 }}>
              <Calendar className="w-2.5 h-2.5" />
              <span dir="ltr">{emp.joinDate}</span>
            </span>
            <span className="text-muted-foreground" style={{ fontSize: 9 }} dir="ltr">{formatCurrency(emp.salary, emp.currency)}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default memo(EmployeeKanbanTile);
