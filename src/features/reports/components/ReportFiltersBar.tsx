import { memo, useMemo } from "react";
import { LayoutGrid, Search, Table } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import type { DbDepartment } from "@/shared/hooks";
import { DatePicker, Select } from "@/shared/components";
import { categoryLabels } from "../constants/reports";
import { cardCls } from "../styles";
import type { ReportViewMode } from "../types";
import { selectStyle } from "@/styles/sharedClasses";

const CATEGORY_OPTIONS = [
  { value: "all", label: arabicSource("common.all_categories") },
  ...Object.entries(categoryLabels).map(([value, label]) => ({ value, label })),
];

type ReportFiltersBarProps = {
  searchQuery: string;
  filterCategory: string;
  filterDept: string;
  dateFrom: string;
  dateTo: string;
  departments: DbDepartment[];
  viewMode: ReportViewMode;
  onSearchQueryChange: (value: string) => void;
  onFilterCategoryChange: (value: string) => void;
  onFilterDeptChange: (value: string) => void;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  onViewModeChange: (mode: ReportViewMode) => void;
};

const ReportFiltersBar = ({
  searchQuery,
  filterCategory,
  filterDept,
  dateFrom,
  dateTo,
  departments,
  viewMode,
  onSearchQueryChange,
  onFilterCategoryChange,
  onFilterDeptChange,
  onDateFromChange,
  onDateToChange,
  onViewModeChange,
}: ReportFiltersBarProps) => {
  const departmentOptions = useMemo(
    () => departments.map((d) => ({ value: d.name, label: d.name })),
    [departments],
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
      <DatePicker value={dateFrom} onChange={onDateFromChange} />
      <span className="text-muted-foreground text-sm">
        {arabicSource("common.to")}
      </span>
      <DatePicker value={dateTo} onChange={onDateToChange} />
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
