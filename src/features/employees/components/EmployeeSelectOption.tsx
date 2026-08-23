import { empDisplayName, type DbEmployee } from "@/shared/hooks";

type EmployeeSelectOptionProps = {
  emp: DbEmployee;
  active: boolean;
  showDepartment: boolean;
  onMouseDown: (e: React.MouseEvent<HTMLButtonElement>) => void;
};

const EmployeeSelectOption = ({ emp, active, showDepartment, onMouseDown }: EmployeeSelectOptionProps) => {
  const name = empDisplayName(emp);

  return (
    <button
      type="button"
      role="option"
      aria-selected={active}
      onMouseDown={onMouseDown}
      className={`w-full px-3 py-2 text-start hover:bg-primary/10 cursor-pointer border-b border-border/10 last:border-b-0 ${
        active ? "bg-primary/10 text-primary" : "text-foreground"
      }`}
      style={{ fontSize: 13 }}
    >
      <div className="truncate font-medium" dir="auto">
        {name}
      </div>
      {showDepartment &&
        (emp.department || emp.device_employee_no) && (
          <div
            className="text-muted-foreground truncate"
            style={{ fontSize: 11 }}
          >
            {[
              emp.department,
              emp.device_employee_no ? `#${emp.device_employee_no}` : "",
            ]
              .filter(Boolean)
              .join(" · ")}
          </div>
        )}
    </button>
  );
};

export default EmployeeSelectOption;
