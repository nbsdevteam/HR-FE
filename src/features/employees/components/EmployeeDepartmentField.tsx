import { useMemo } from "react";
import { Building, Check, X } from "lucide-react";
import { Select, type SelectOption } from "@/shared/components";
import { arabicSource } from "@/i18n/source";
import type { DepartmentOption } from "../types";
import EmployeeFieldRow from "./EmployeeFieldRow";

type EmployeeDepartmentFieldProps = {
  department: string;
  departmentId: string | null;
  allDepts: DepartmentOption[];
  isEditing: boolean;
  addingNewDept: boolean;
  creatingDept: boolean;
  newDeptName: string;
  inputClass: string;
  /** Field-level `department_not_found` rejection from a save (backend §4). */
  error: string | null;
  onSelectDepartment: (deptId: string, deptName: string) => void;
  onStartAddingDept: () => void;
  onNewDeptNameChange: (value: string) => void;
  onConfirmNewDept: () => void;
  onCancelNewDept: () => void;
};

const EmployeeDepartmentField = ({
  department,
  departmentId,
  allDepts,
  isEditing,
  addingNewDept,
  creatingDept,
  newDeptName,
  inputClass,
  error,
  onSelectDepartment,
  onStartAddingDept,
  onNewDeptNameChange,
  onConfirmNewDept,
  onCancelNewDept,
}: EmployeeDepartmentFieldProps) => {
  const departmentOptions = useMemo<SelectOption[]>(
    () => [
      ...allDepts.map((d) => ({ value: d.id, label: d.name })),
      { divider: true },
      { value: "__NEW__", label: arabicSource("shared.add_a_new_section") },
    ],
    [allDepts],
  );

  const handleNewDeptNameChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    onNewDeptNameChange(e.target.value);
  };

  const handleNewDeptNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === "Enter" && newDeptName.trim()) {
      onConfirmNewDept();
    } else if (e.key === "Escape") {
      onCancelNewDept();
    }
  };

  const handleDepartmentChange = (value: string): void => {
    if (value === "__NEW__") {
      onStartAddingDept();
      return;
    }
    // Resolve the name from the exact option the user clicked, rather than
    // re-searching a separate copy of the list — with duplicate department
    // names/ids in the backend data, a second lookup can land on the wrong
    // (or no) match and silently drop the selection.
    const dept = allDepts.find((d) => d.id === value);
    onSelectDepartment(value, dept?.name ?? value);
  };

  return (
    <EmployeeFieldRow
      icon={Building} label={arabicSource("common.section")} value={department}
      isEditing={isEditing}
      editElement={
        addingNewDept ? (
          <div className="flex items-center gap-2">
            <input
              autoFocus
              value={newDeptName}
              onChange={handleNewDeptNameChange}
              onKeyDown={handleNewDeptNameKeyDown}
              placeholder={arabicSource("shared.write_the_name_of_the_new_section")}
              className={inputClass}
              style={{ fontSize: 14 }}
              disabled={creatingDept}
            />
            <button
              onClick={onConfirmNewDept}
              disabled={!newDeptName.trim() || creatingDept}
              className="p-1.5 rounded-lg bg-primary/15 text-primary hover:bg-primary/25 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={onCancelNewDept}
              disabled={creatingDept}
              className="p-1.5 rounded-lg hover:bg-muted/30 text-muted-foreground transition-colors cursor-pointer shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <>
            <Select
              value={departmentId || ""}
              onChange={handleDepartmentChange}
              options={departmentOptions}
              className={inputClass}
              style={{ fontSize: 14 }}
            />
            {error && <p className="text-destructive mt-1" style={{ fontSize: 11 }} role="alert">{error}</p>}
          </>
        )
      }
    />
  );
};

export default EmployeeDepartmentField;
