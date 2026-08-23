import { Filter, Search } from "lucide-react";
import { arabicSource } from "@/i18n/source";

type EmployeesFiltersProps = {
  search: string;
  selectedDept: string;
  departments: string[];
  onSearchChange: (search: string) => void;
  onDepartmentChange: (department: string) => void;
};

const EmployeesFilters = ({
  search,
  selectedDept,
  departments,
  onSearchChange,
  onDepartmentChange,
}: EmployeesFiltersProps) => {
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    onSearchChange(e.target.value);
  };

  const handleDepartmentClick = (dept: string) => (): void => {
    onDepartmentChange(dept);
  };

  return (
  <div className="flex flex-wrap items-center gap-4">
    <div className="relative flex-1 min-w-[250px]">
      <Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 start-3 text-muted-foreground" />
      <input
        type="text"
        placeholder={arabicSource("common.search_for_an_employee")}
        value={search}
        onChange={handleSearchChange}
        className="w-full h-11 ps-10 pe-4 rounded-lg border border-border bg-input-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-primary outline-none"
      />
    </div>
    <div className="flex items-center gap-2">
      <Filter className="w-4 h-4 text-muted-foreground" />
      {departments.map(dept => (
        <button
          key={dept}
          onClick={handleDepartmentClick(dept)}
          className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
            selectedDept === dept
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
          }`}
          style={{ fontSize: 13 }}
        >
          {dept}
        </button>
      ))}
    </div>
  </div>
  );
};

export default EmployeesFilters;
