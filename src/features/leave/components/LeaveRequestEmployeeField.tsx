import { useCallback } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import {
  getEmployeeDescription,
  getEmployeeId,
  getEmployeeSearchText,
} from "@/shared/utils/employeeTypeAhead";
import { TypeAhead } from "@/shared/components";
import { localizedEmployeeName, useIsArabicLanguage } from "@/i18n/useLocalizedName";
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
  const isArabic = useIsArabicLanguage();

  const getEmployeeLabel = useCallback(
    (employee: any): string => localizedEmployeeName(employee, isArabic),
    [isArabic],
  );

  if (!selfOnly) {
    return (
      <TypeAhead
        items={employees}
        getId={getEmployeeId}
        getLabel={getEmployeeLabel}
        getDescription={getEmployeeDescription}
        getSearchText={getEmployeeSearchText}
        fallbackLabels={Object.fromEntries(employees.map((e) => [String(e.id), getEmployeeLabel(e)]))}
        value={employeeId}
        onChange={onEmployeeChange}
        optionsAreData
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
      value={localizedEmployeeName(selfEmployee, isArabic)}
      className={`${inputCls} opacity-80 cursor-not-allowed`}
      style={{ fontSize: 13 }}
      dir="auto"
      aria-label="My employee"
    />
  );
};

export default LeaveRequestEmployeeField;
