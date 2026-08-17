import { motion } from "motion/react";
import { Calendar, Fingerprint } from "lucide-react";
import type { Employee } from "@/features/employees";
import type { DbEmployee } from "@/shared/hooks";
import { formatCurrency } from "@/features/payroll";
import { employeeStatusKeys, translateBackendCode } from "@/i18n/status";
import { arabicSource } from "@/i18n/source";
import { accentColors, deptColors, deptDots, statusColors } from "../styles";

type EmployeesKanbanViewProps = {
  departments: string[];
  employees: Employee[];
  dbEmployees: DbEmployee[];
  selectedDept: string;
  onSelectEmployee: (employee: Employee) => void;
};

const EmployeesKanbanView = ({
  departments,
  employees,
  dbEmployees,
  selectedDept,
  onSelectEmployee,
}: EmployeesKanbanViewProps) => (
  <motion.div
    key="kanban"
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{ duration: 0.2 }}
    className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3"
  >
    {departments.map((dept, ci) => {
      const items = employees.filter(e => e.department === dept);
      if (selectedDept !== arabicSource("common.all") && selectedDept !== dept) return null;

      return (
        <motion.div
          key={dept}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: ci * 0.08 }}
          className={`bg-card/20 backdrop-blur-md border ${deptColors[dept] || "border-border/40"} rounded-xl shadow-lg overflow-hidden`}
        >
          <div className="p-3 border-b border-border/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${deptDots[dept] || "bg-primary"}`} />
              <span className="text-foreground" style={{ fontSize: 13 }}>{dept}</span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-muted/30 text-muted-foreground" style={{ fontSize: 11 }}>
              {items.length}
            </span>
          </div>
          <div className="p-3 space-y-8 min-h-[140px] pt-8">
            {items.length > 0 ? items.map((emp, i) => {
              const accent = accentColors[(emp.id - 1) % accentColors.length];
              const dbEmp = dbEmployees.find(e => e.person_id === emp.id);

              return (
                <motion.div
                  key={emp.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  onClick={() => onSelectEmployee(emp)}
                  className="relative pt-7 cursor-pointer group"
                >
                  <div className="absolute top-0 inset-x-0 flex justify-center z-10">
                    <div className="relative">
                      <div className="absolute -inset-1 rounded-full opacity-40 group-hover:opacity-70 transition-opacity blur-sm" style={{ background: accent }} />
                      <div className="relative w-13 h-13 rounded-full overflow-hidden border-[3px] shadow-lg" style={{ borderColor: accent, boxShadow: `0 4px 14px ${accent}40` }}>
                        {emp.photo ? (
                          <img src={emp.photo} alt={emp.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-card">
                            <span className="text-primary" style={{ fontSize: 18 }}>{emp.name.charAt(0)}</span>
                          </div>
                        )}
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
            }) : (
              <div className="flex items-center justify-center h-[80px] text-muted-foreground" style={{ fontSize: 13 }}>{arabicSource("employees.there_are_no_employees")}</div>
            )}
          </div>
        </motion.div>
      );
    })}
  </motion.div>
);

export default EmployeesKanbanView;
