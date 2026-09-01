import { useCallback } from "react";
import { Filter } from "lucide-react";
import { SearchInput, Select } from "@/shared/components";
import { arabicSource } from "@/i18n/source";

const SEARCH_INPUT_CLASS =
  "w-full h-11 ps-10 pe-4 rounded-lg border border-border bg-input-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-primary outline-none";

type EmployeesFiltersProps = {
  search: string;
  selectedDept: string;
  departments: string[];
  includeArchived: boolean;
  onSearchChange: (search: string) => void;
  onDepartmentChange: (department: string) => void;
  onIncludeArchivedChange: (includeArchived: boolean) => void;
};

const EmployeesFilters = ({
  search,
  selectedDept,
  departments,
  includeArchived,
  onSearchChange,
  onDepartmentChange,
  onIncludeArchivedChange,
}: EmployeesFiltersProps) => {
  const handleDepartmentChange = useCallback((value: string): void => {
    onDepartmentChange(value);
  }, [onDepartmentChange]);

  const handleIncludeArchivedChange = useCallback((e: React.ChangeEvent<HTMLInputElement>): void => {
    onIncludeArchivedChange(e.target.checked);
  }, [onIncludeArchivedChange]);

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
        <Select
          value={selectedDept}
          onChange={handleDepartmentChange}
          options={departments}
          aria-label={arabicSource("common.section")}
          className="w-48"
          style={{ height: 38 }}
        />
      </div>
      <label className="flex items-center gap-2 text-muted-foreground text-sm cursor-pointer">
        <input type="checkbox" checked={includeArchived} onChange={handleIncludeArchivedChange} />
        {arabicSource("employees.include_archived_label")}
      </label>
    </div>
  );
};

export default EmployeesFilters;
