import { memo, useCallback } from "react";
import { motion } from "motion/react";
import { AlertCircle, Edit, Eye, Fingerprint, Trash2 } from "lucide-react";
import { Button, NodeAvatar, StatusBadge } from "@/shared/components";
import type { Employee } from "@/features/employees";
import type { DbEmployee } from "@/shared/hooks";
import { formatCurrency } from "@/shared/utils/currency";
import { getStatusColor } from "@/shared/utils/statusColors";
import { employeeStatusKeys, translateBackendCode } from "@/i18n/status";
import { arabicSource } from "@/i18n/source";
import { statusColors } from "../styles";
import type { DeleteEmployeeTarget } from "../types";

type EmployeesTableRowProps = {
  emp: Employee;
  dbEmp: DbEmployee | undefined;
  index: number;
  isPending: boolean;
  isDeviceSynced: boolean;
  onSelectEmployee: (employee: Employee) => void;
  onEditEmployee: (employee: Employee) => void;
  onDeleteTargetChange: (target: DeleteEmployeeTarget) => void;
};

const EmployeesTableRow = ({
  emp, dbEmp, index, isPending, isDeviceSynced, onSelectEmployee, onEditEmployee, onDeleteTargetChange,
}: EmployeesTableRowProps) => {
  const deviceNo = dbEmp?.device_employee_no;

  const handleSelect = useCallback(() => onSelectEmployee(emp), [onSelectEmployee, emp]);
  const handleEdit = useCallback(() => onEditEmployee(emp), [onEditEmployee, emp]);
  const handleDeleteTargetChange = useCallback(() => {
    if (dbEmp) onDeleteTargetChange({ id: dbEmp.id, name: emp.name });
  }, [onDeleteTargetChange, dbEmp, emp.name]);

  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      // Capped: uncapped `index * 0.05` left row 500 invisible for 25 seconds
      // on a large roster, and windowing can mount a high index immediately.
      transition={{ delay: Math.min(index * 0.05, 0.4) }}
      className="border-b border-border/20 hover:bg-muted/10 transition-colors"
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <NodeAvatar
            photo={emp.photo}
            name={emp.name}
            initials={emp.name.charAt(0)}
            sizeClassName="w-9 h-9"
            extraClassName="border border-primary/30"
            fallbackClassName="bg-primary/20"
            textClassName="text-primary"
            fontSize={14}
          />
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
        <StatusBadge colorClassName={getStatusColor(emp.status, statusColors)}>{translateBackendCode(emp.status, employeeStatusKeys)}</StatusBadge>
      </td>
      <td className="px-4 py-3">
        {isPending ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-amber-500/30 bg-amber-500/10 text-amber-400" style={{ fontSize: 11 }}>
            <AlertCircle className="w-3 h-3" /> {arabicSource("employees.missing_data")}
          </span>
        ) : isDeviceSynced ? (
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
          <Button
            variant="unstyled"
            size="unstyled"
            rounded="rounded"
            onClick={handleSelect}
            className="p-1.5 hover:bg-secondary"
            icon={Eye}
            iconClassName="w-4 h-4 text-muted-foreground"
          />
          <Button
            variant="unstyled"
            size="unstyled"
            rounded="rounded"
            onClick={handleEdit}
            className="p-1.5 hover:bg-secondary"
            icon={Edit}
            iconClassName="w-4 h-4 text-muted-foreground"
          />
          {dbEmp && (
            <Button
              variant="unstyled"
              size="unstyled"
              rounded="rounded"
              onClick={handleDeleteTargetChange}
              className="p-1.5 hover:bg-destructive/20"
              icon={Trash2}
              iconClassName="w-4 h-4 text-destructive"
            />
          )}
        </div>
      </td>
    </motion.tr>
  );
};

export default memo(EmployeesTableRow);
