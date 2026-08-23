import { Filter } from "lucide-react";
import { FilterChip, SearchInput } from "@/shared/components";
import { arabicSource } from "@/i18n/source";

const SEARCH_INPUT_CLASS =
  "w-full h-11 ps-10 pe-4 rounded-lg border border-border bg-input-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-primary outline-none";

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
  const handleDepartmentClick = (dept: string) => (): void => {
    onDepartmentChange(dept);
  };

  return (
    <div className="flex flex-wrap items-center gap-4">
      <SearchInput
        value={search}
        onChange={onSearchChange}
        placeholder={arabicSource("common.search_for_an_employee")}
        wrapperClassName="relative flex-1 min-w-[250px]"
        iconClassName="w-4 h-4 absolute top-1/2 -translate-y-1/2 start-3 text-muted-foreground"
        inputClassName={SEARCH_INPUT_CLASS}
      />
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-muted-foreground" />
        {departments.map(dept => (
          <FilterChip
            key={dept}
            label={dept}
            active={selectedDept === dept}
            onClick={handleDepartmentClick(dept)}
            fontSize={13}
          />
        ))}
      </div>
    </div>
  );
};

export default EmployeesFilters;
