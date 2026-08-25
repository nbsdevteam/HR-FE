import { Plus } from "lucide-react";
import { Button } from "@/shared/components";
import ViewToggle from "@/shared/components/ViewToggle";
import { arabicSource } from "@/i18n/source";
import type { EmployeeViewMode } from "../types";

type EmployeesHeaderProps = {
  viewMode: EmployeeViewMode;
  onViewModeChange: (viewMode: EmployeeViewMode) => void;
  onAddEmployee: () => void;
};

const EmployeesHeader = ({ viewMode, onViewModeChange, onAddEmployee }: EmployeesHeaderProps) => (
  <div className="flex items-center justify-between">
    <div>
      <h1 className="text-gradient-gold">{arabicSource("common.employees")}</h1>
      <p className="text-muted-foreground mt-1">{arabicSource("employees.employee_data_management")}</p>
    </div>
    <div className="flex items-center gap-3">
      <ViewToggle view={viewMode} onChange={onViewModeChange} />
      <Button
        variant="primary"
        size="unstyled"
        rounded="rounded-lg"
        motionProps={{ whileHover: { scale: 1.05 }, whileTap: { scale: 0.95 } }}
        onClick={onAddEmployee}
        className="flex items-center gap-2 px-6 py-3 shadow-lg shadow-primary/20"
        icon={Plus}
        iconClassName="w-5 h-5"
      >
        {arabicSource("common.add_an_employee")}
      </Button>
    </div>
  </div>
);

export default EmployeesHeader;
