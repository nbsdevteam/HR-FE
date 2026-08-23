import { useMemo } from "react";
import { Building, Check, X } from "lucide-react";
import { Select, type SelectOption } from "@/shared/components";
import { arabicSource } from "@/i18n/source";
import EmployeeFieldRow from "./EmployeeFieldRow";

type EmployeeDepartmentFieldProps = {
  department: string;
  allDepts: string[];
  isEditing: boolean;
  addingNewDept: boolean;
  newDeptName: string;
  inputClass: string;
  onFieldChange: (field: "department", value: string) => void;
  onStartAddingDept: () => void;
  onNewDeptNameChange: (value: string) => void;
  onConfirmNewDept: () => void;
  onCancelNewDept: () => void;
};

const EmployeeDepartmentField = ({
  department,
  allDepts,
  isEditing,
  addingNewDept,
  newDeptName,
  inputClass,
  onFieldChange,
  onStartAddingDept,
  onNewDeptNameChange,
  onConfirmNewDept,
  onCancelNewDept,
}: EmployeeDepartmentFieldProps) => {
  const departmentOptions = useMemo<SelectOption[]>(
    () => [
      ...allDepts.map((d) => ({ value: d, label: d })),
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
    } else {
      onFieldChange("department", value);
    }
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
            />
            <button
              onClick={onConfirmNewDept}
              disabled={!newDeptName.trim()}
              className="p-1.5 rounded-lg bg-primary/15 text-primary hover:bg-primary/25 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={onCancelNewDept}
              className="p-1.5 rounded-lg hover:bg-muted/30 text-muted-foreground transition-colors cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <Select
            value={department}
            onChange={handleDepartmentChange}
            options={departmentOptions}
            className={inputClass}
            style={{ fontSize: 14 }}
          />
        )
      }
    />
  );
};

export default EmployeeDepartmentField;
