import { motion } from "motion/react";
import { Plus } from "lucide-react";
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
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onAddEmployee}
        className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg shadow-lg shadow-primary/20 hover:bg-gold-dark transition-colors cursor-pointer"
      >
        <Plus className="w-5 h-5" />
        {arabicSource("common.add_an_employee")}
      </motion.button>
    </div>
  </div>
);

export default EmployeesHeader;
