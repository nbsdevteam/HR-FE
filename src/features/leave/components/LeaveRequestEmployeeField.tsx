import { AlertCircle, Loader2 } from "lucide-react";
import { EmployeeSelect } from "@/features/employees";
import { empDisplayName } from "@/shared/hooks";
import { leaveInputClass as inputCls } from "../styles";

type LeaveRequestEmployeeFieldProps = {
  employees: any[];
  employeeId: string;
  onEmployeeChange: (id: string) => void;
  selfOnly: boolean;
  employeesLoading: boolean;
  linkError: string | null;
  selfEmployee: any | null;
};

const LeaveRequestEmployeeField = ({
  employees,
  employeeId,
  onEmployeeChange,
  selfOnly,
  employeesLoading,
  linkError,
  selfEmployee,
}: LeaveRequestEmployeeFieldProps) => {
  if (!selfOnly) {
    return (
      <EmployeeSelect
        employees={employees}
        labels={Object.fromEntries(employees.map((e) => [String(e.id), empDisplayName(e)]))}
        value={employeeId}
        onChange={onEmployeeChange}
      />
    );
  }

  if (employeesLoading) {
    return (
      <div className={`${inputCls} flex items-center text-muted-foreground`} style={{ fontSize: 13 }}>
        <Loader2 className="w-4 h-4 animate-spin me-2" />
      </div>
    );
  }

  if (linkError || !selfEmployee) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive" style={{ fontSize: 13 }}>
        <AlertCircle className="w-4 h-4 flex-shrink-0" />
        {linkError || "Your user account is not linked to an employee. Please contact HR."}
      </div>
    );
  }

  return (
    <input
      type="text"
      readOnly
      disabled
      value={empDisplayName(selfEmployee)}
      className={`${inputCls} opacity-80 cursor-not-allowed`}
      style={{ fontSize: 13 }}
      dir="auto"
      aria-label="My employee"
    />
  );
};

export default LeaveRequestEmployeeField;
