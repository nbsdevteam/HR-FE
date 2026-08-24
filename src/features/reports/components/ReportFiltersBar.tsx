import { memo, useMemo } from "react";
import { LayoutGrid, Search, Table } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import { empDisplayName, type DbDepartment, type DbEmployee } from "@/shared/hooks";
import { MultiSelect, Select, type MultiSelectItem } from "@/shared/components";
import { categoryLabels } from "../constants/reports";
import { cardCls } from "../styles";
import type { ReportViewMode } from "../types";
import { selectStyle } from "@/styles/sharedClasses";

const CATEGORY_OPTIONS = [
  { value: "all", label: arabicSource("common.all_categories") },
  ...Object.entries(categoryLabels).map(([value, label]) => ({ value, label })),
];

const formatEmployeeSummary = (selected: MultiSelectItem[]): string => {
  if (selected.length <= 2) return selected.map((item) => item.label).join("، ");
  return `${selected.length} ${arabicSource("reports.employees")} ${arabicSource("reports.selected_suffix")}`;
};

type ReportFiltersBarProps = {
  searchQuery: string;
  filterCategory: string;
  filterDept: string;
  dateFrom: string;
  dateTo: string;
  departments: DbDepartment[];
  employees: DbEmployee[];
  selectedEmployeeIds: string[];
  viewMode: ReportViewMode;
  onSearchQueryChange: (value: string) => void;
  onFilterCategoryChange: (value: string) => void;
  onFilterDeptChange: (value: string) => void;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  onSelectedEmployeeIdsChange: (ids: string[]) => void;
  onViewModeChange: (mode: ReportViewMode) => void;
};

const ReportFiltersBar = ({
  searchQuery,
  filterCategory,
  filterDept,
  dateFrom,
  dateTo,
  departments,
  employees,
  selectedEmployeeIds,
  viewMode,
  onSearchQueryChange,
  onFilterCategoryChange,
  onFilterDeptChange,
  onDateFromChange,
  onDateToChange,
  onSelectedEmployeeIdsChange,
  onViewModeChange,
}: ReportFiltersBarProps) => {
  const departmentOptions = useMemo(
    () => departments.map((d) => ({ value: d.name, label: d.name })),
    [departments],
  );
  const employeeOptions = useMemo(
    () => employees.map((e) => ({ value: e.id, label: empDisplayName(e) })),
    [employees],
  );

  const handleSearchQueryChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    onSearchQueryChange(e.target.value);
  };

  const handleFilterCategoryChange = (value: string): void => {
    onFilterCategoryChange(value);
  };

  const handleFilterDeptChange = (value: string): void => {
    onFilterDeptChange(value);
  };

  const handleDateFromChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    onDateFromChange(e.target.value);
  };

  const handleDateToChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    onDateToChange(e.target.value);
  };

  const handleSelectedEmployeeIdsChange = (ids: string[]): void => {
    onSelectedEmployeeIdsChange(ids);
  };

  const handleGridViewClick = (): void => {
    onViewModeChange("grid");
  };

  const handleTableViewClick = (): void => {
    onViewModeChange("table");
  };

  return (
  <div className={cardCls}>
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2 flex-1 min-w-[200px]">
        <Search className="w-4 h-4 text-muted-foreground" />
        <input
          placeholder={arabicSource("reports.search_reports")}
          value={searchQuery}
          onChange={handleSearchQueryChange}
          className="flex-1 bg-transparent text-foreground text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>
      <Select
        value={filterCategory}
        onChange={handleFilterCategoryChange}
        options={CATEGORY_OPTIONS}
        className={selectStyle}
      />
      <Select
        value={filterDept}
        onChange={handleFilterDeptChange}
        options={departmentOptions}
        blankLabel={arabicSource("reports.all_sections")}
        className={selectStyle}
      />
      <MultiSelect
        items={employeeOptions}
        selectedValues={selectedEmployeeIds}
        onChange={handleSelectedEmployeeIdsChange}
        placeholder={arabicSource("reports.all_employees")}
        searchPlaceholder={arabicSource("common.search")}
        formatSummary={formatEmployeeSummary}
        className={selectStyle}
      />

      <input
        type="date"
        value={dateFrom}
        onChange={handleDateFromChange}
        className="px-3 py-2 rounded-lg bg-input border border-border/50 text-foreground text-sm"
        dir="ltr"
      />
      <span className="text-muted-foreground text-sm">
        {arabicSource("common.to")}
      </span>
      <input
        type="date"
        value={dateTo}
        onChange={handleDateToChange}
        className="px-3 py-2 rounded-lg bg-input border border-border/50 text-foreground text-sm"
        dir="ltr"
      />
      <div className="flex items-center border border-border/50 rounded-lg overflow-hidden">
        <button
          onClick={handleGridViewClick}
          className={`p-2 cursor-pointer ${viewMode === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
        >
          <LayoutGrid className="w-4 h-4" />
        </button>
        <button
          onClick={handleTableViewClick}
          className={`p-2 cursor-pointer ${viewMode === "table" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
        >
          <Table className="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
  );
};

export default memo(ReportFiltersBar);
