import { memo, useCallback } from "react";
import { motion } from "motion/react";
import {
  ArchiveRestore,
  Edit,
  Eye,
  Fingerprint,
  Trash2,
  UserX,
} from "lucide-react";
import { Button, NodeAvatar, StatusBadge } from "@/shared/components";
import type { Employee } from "@/features/employees";
import { formatCurrency } from "@/shared/utils/currency";
import { getStatusColor } from "@/shared/utils/statusColors";
import { employeeStatusKeys, translateBackendCode } from "@/i18n/status";
import { arabicSource } from "@/i18n/source";
import { usePermissions } from "@/shared/auth/permissions";
import { statusColors } from "../styles";
import type { DeleteEmployeeTarget } from "../types";
import EmployeeDeviceStatusBadge from "./EmployeeDeviceStatusBadge";
import EmployeeOriginBadges from "./EmployeeOriginBadges";

type EmployeesTableRowProps = {
  emp: Employee;
  index: number;
  isPending: boolean;
  isDeviceSynced: boolean;
  isSelf: boolean;
  onSelectEmployee: (employee: Employee) => void;
  onEditEmployee: (employee: Employee) => void;
  onDeleteTargetChange: (target: DeleteEmployeeTarget) => void;
  onDeactivateEmployee: (employee: Employee) => void;
  onRestoreEmployee: (employee: Employee) => void;
};

const EmployeesTableRow = ({
  emp,
  index,
  isPending,
  isDeviceSynced,
  isSelf,
  onSelectEmployee,
  onEditEmployee,
  onDeleteTargetChange,
  onDeactivateEmployee,
  onRestoreEmployee,
}: EmployeesTableRowProps) => {
  const { hasPermission } = usePermissions();
  const canEdit = hasPermission("hr.employees.edit");
  const canDeactivate =
    hasPermission("hr.employees.deactivate") ||
    hasPermission("hr.employees.delete");
  // From the row itself: an archived (inactive/exited) employee is not in the
  // active roster, so a roster lookup showed their number as "—" and hid the
  // Restore button.
  const deviceNo = emp.deviceEmployeeNo;
  const isArchived = !emp.isActive;

  const handleSelect = useCallback(
    () => onSelectEmployee(emp),
    [onSelectEmployee, emp],
  );
  const handleEdit = useCallback(
    () => onEditEmployee(emp),
    [onEditEmployee, emp],
  );
  const handleDeleteTargetChange = useCallback(() => {
    onDeleteTargetChange({ id: emp.dbId, name: emp.name });
  }, [onDeleteTargetChange, emp.dbId, emp.name]);

  const handleDeactivateClick = useCallback(() => {
    onDeactivateEmployee(emp);
  }, [onDeactivateEmployee, emp]);

  const handleRestoreClick = useCallback(() => {
    onRestoreEmployee(emp);
  }, [onRestoreEmployee, emp]);

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
            <p className="text-muted-foreground" style={{ fontSize: 12 }}>
              {emp.email}
            </p>
            <EmployeeOriginBadges source={emp.source} hrInfoPending={emp.hrInfoPending} className="mt-1" />
          </div>
        </div>
      </td>
      <td
        className="px-4 py-3 text-muted-foreground"
        style={{ fontSize: 13 }}
        dir="ltr"
      >
        {emp.employeeNumber}
      </td>
      <td className="px-4 py-3 text-center">
        {deviceNo ? (
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-muted/30 border border-border/30 font-mono text-foreground"
            style={{ fontSize: 12 }}
          >
            <Fingerprint className="w-3 h-3 text-primary/60" />#{deviceNo}
          </span>
        ) : (
          <span className="text-muted-foreground/40" style={{ fontSize: 11 }}>
            —
          </span>
        )}
      </td>
      <td className="px-4 py-3 text-foreground" style={{ fontSize: 13 }}>
        {emp.department}
      </td>
      <td className="px-4 py-3 text-foreground" style={{ fontSize: 13 }}>
        {emp.position}
      </td>
      <td className="px-4 py-3">
        <StatusBadge colorClassName={getStatusColor(emp.status, statusColors)}>
          {translateBackendCode(emp.status, employeeStatusKeys)}
        </StatusBadge>
      </td>
      <td className="px-4 py-3">
        <EmployeeDeviceStatusBadge
          isPending={isPending}
          isDeviceSynced={isDeviceSynced}
          enrollmentState={emp.deviceEnrollmentState}
        />
      </td>
      <td
        className="px-4 py-3 text-muted-foreground"
        style={{ fontSize: 13 }}
        dir="ltr"
      >
        {emp.startDate}
      </td>
      <td
        className="px-4 py-3 text-foreground"
        style={{ fontSize: 13 }}
        dir="ltr"
      >
        {formatCurrency(emp.salary, emp.currency)}
      </td>
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
          {canEdit && !emp.readOnly && (
            <Button
              variant="unstyled"
              size="unstyled"
              rounded="rounded"
              onClick={handleEdit}
              className="p-1.5 hover:bg-secondary"
              icon={Edit}
              iconClassName="w-4 h-4 text-muted-foreground"
            />
          )}
          {canDeactivate && isArchived && (
            <Button
              variant="unstyled"
              size="unstyled"
              rounded="rounded"
              onClick={handleRestoreClick}
              className="p-1.5 hover:bg-secondary"
              icon={ArchiveRestore}
              iconClassName="w-4 h-4 text-muted-foreground"
            />
          )}
          {canDeactivate && !isArchived && !isSelf && (
            <Button
              variant="unstyled"
              size="unstyled"
              rounded="rounded"
              onClick={handleDeactivateClick}
              className="p-1.5 hover:bg-secondary"
              icon={UserX}
              iconClassName="w-4 h-4 text-muted-foreground"
              title={arabicSource("employees.deactivate_employee")}
            />
          )}
          {canDeactivate && !isArchived && !isSelf && (
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
