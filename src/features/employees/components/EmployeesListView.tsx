import { motion } from "motion/react";
import { AlertCircle, Edit, Eye, Fingerprint, Trash2 } from "lucide-react";
import { SortableHeaderRow, toggleSort } from "@/shared/components/SortableHeader";
import type { Employee } from "@/features/employees";
import type { DbEmployee } from "@/shared/hooks";
import { formatCurrency } from "@/features/payroll";
import { employeeStatusKeys, translateBackendCode } from "@/i18n/status";
import { arabicSource } from "@/i18n/source";
import { statusColors } from "../styles";
import type { DeleteEmployeeTarget, EmployeeSortKey } from "../types";

type EmployeesListViewProps = {
  employees: Employee[];
  dbEmployees: DbEmployee[];
  deviceSyncedSet: Set<number>;
  pendingEmployees: Set<number>;
  sortBy: EmployeeSortKey;
  sortDir: "asc" | "desc";
  onSortByChange: (sortBy: EmployeeSortKey) => void;
  onSortDirChange: (sortDir: "asc" | "desc") => void;
  onSelectEmployee: (employee: Employee) => void;
  onDeleteTargetChange: (target: DeleteEmployeeTarget) => void;
};

const EmployeesListView = ({
  employees,
  dbEmployees,
  deviceSyncedSet,
  pendingEmployees,
  sortBy,
  sortDir,
  onSortByChange,
  onSortDirChange,
  onSelectEmployee,
  onDeleteTargetChange,
}: EmployeesListViewProps) => (
  <motion.div
    key="list"
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{ duration: 0.2 }}
    className="bg-card/30 backdrop-blur-md border border-border/40 rounded-xl overflow-hidden shadow-lg"
  >
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <SortableHeaderRow
            columns={[
              { label: arabicSource("common.employee"), key: "name" },
              { label: arabicSource("common.job_number"), key: "employeeNumber" },
              { label: arabicSource("common.fingerprint_number"), key: "deviceNo", center: true },
              { label: arabicSource("common.section"), key: "department" },
              { label: arabicSource("common.position"), key: "position" },
              { label: arabicSource("common.status"), key: "status" },
              { label: arabicSource("common.footprint"), key: null },
              { label: arabicSource("common.direct_date"), key: "joinDate" },
              { label: arabicSource("common.salary"), key: "salary" },
              { label: arabicSource("common.procedures"), key: null },
            ]}
            sortBy={sortBy}
            sortDir={sortDir}
            onSort={(key) => toggleSort(key, sortBy, sortDir, onSortByChange, onSortDirChange)}
          />
        </thead>
        <tbody>
          {employees.map((emp, i) => {
            const dbEmp = dbEmployees.find(e => e.person_id === emp.id);
            const deviceNo = dbEmp?.device_employee_no;

            return (
              <motion.tr
                key={emp.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                className="border-b border-border/20 hover:bg-muted/10 transition-colors"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {emp.photo ? (
                      <img src={emp.photo} alt={emp.name} className="w-9 h-9 rounded-full object-cover border border-primary/30" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
                        <span className="text-primary" style={{ fontSize: 14 }}>{emp.name.charAt(0)}</span>
                      </div>
                    )}
                    <div>
                      <p className="text-foreground">{emp.name}</p>
                      <p className="text-muted-foreground" style={{ fontSize: 12 }}>{emp.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground" style={{ fontSize: 13 }} dir="ltr">{emp.employeeNumber}</td>
                <td className="px-4 py-3 text-center">
                  {deviceNo ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-muted/30 border border-border/30 font-mono text-foreground" style={{ fontSize: 12 }}>
                      <Fingerprint className="w-3 h-3 text-primary/60" />
                      #{deviceNo}
                    </span>
                  ) : (
                    <span className="text-muted-foreground/40" style={{ fontSize: 11 }}>—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-foreground" style={{ fontSize: 13 }}>{emp.department}</td>
                <td className="px-4 py-3 text-foreground" style={{ fontSize: 13 }}>{emp.position}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-md border ${statusColors[emp.status]}`} style={{ fontSize: 12 }}>
                    {translateBackendCode(emp.status, employeeStatusKeys)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {pendingEmployees.has(emp.id) ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-amber-500/30 bg-amber-500/10 text-amber-400" style={{ fontSize: 11 }}>
                      <AlertCircle className="w-3 h-3" /> {arabicSource("employees.missing_data")}
                    </span>
                  ) : deviceSyncedSet.has(emp.id) ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-emerald-500/30 bg-emerald-500/10 text-emerald-400" style={{ fontSize: 11 }}>
                      <Fingerprint className="w-3 h-3" /> {arabicSource("employees.registered")}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-muted-foreground/20 bg-muted/10 text-muted-foreground" style={{ fontSize: 11 }}>
                      <Fingerprint className="w-3 h-3" /> {arabicSource("employees.is_not_registered")}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-muted-foreground" style={{ fontSize: 13 }} dir="ltr">{emp.startDate}</td>
                <td className="px-4 py-3 text-foreground" style={{ fontSize: 13 }} dir="ltr">{formatCurrency(emp.salary, emp.currency)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button onClick={() => onSelectEmployee(emp)} className="p-1.5 rounded hover:bg-secondary transition-colors cursor-pointer">
                      <Eye className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <button onClick={() => onSelectEmployee(emp)} className="p-1.5 rounded hover:bg-secondary transition-colors cursor-pointer">
                      <Edit className="w-4 h-4 text-muted-foreground" />
                    </button>
                    {dbEmp && (
                      <button onClick={() => onDeleteTargetChange({ id: dbEmp.id, name: emp.name })} className="p-1.5 rounded hover:bg-destructive/20 transition-colors cursor-pointer">
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </button>
                    )}
                  </div>
                </td>
              </motion.tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </motion.div>
);

export default EmployeesListView;
