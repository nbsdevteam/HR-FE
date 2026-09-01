import { memo } from "react";
import { Select } from "@/shared/components";
import { arabicSource } from "@/i18n/source";

type ManagerOption = { value: string; label: string };

type HierarchyFilterBarProps = {
  departmentOptions: string[];
  jobTitleOptions: string[];
  /** Omitted where there is no manager concept (the level-wise graph) — the select is hidden rather than shown empty. */
  managerOptions?: ManagerOption[];
  departmentFilter: string;
  jobTitleFilter: string;
  managerFilter?: string;
  hasActiveFilter: boolean;
  onDepartmentFilterChange: (value: string) => void;
  onJobTitleFilterChange: (value: string) => void;
  onManagerFilterChange?: (value: string) => void;
  onClearFilters: () => void;
};

/** Department/job-title(/manager) dropdowns above the chart, dimming/highlighting
 *  the same way search does. Mirrors `PositionsFilterBar`'s layout. */
const HierarchyFilterBar = ({
  departmentOptions,
  jobTitleOptions,
  managerOptions,
  departmentFilter,
  jobTitleFilter,
  managerFilter,
  hasActiveFilter,
  onDepartmentFilterChange,
  onJobTitleFilterChange,
  onManagerFilterChange,
  onClearFilters,
}: HierarchyFilterBarProps) => (
  <div className="flex items-center gap-2 flex-wrap">
    <Select
      value={departmentFilter}
      onChange={onDepartmentFilterChange}
      options={departmentOptions}
      blankLabel={arabicSource("hierarchy.filter_all_departments")}
      className="h-9 px-3 min-w-[160px]"
      optionsAreData
    />
    <Select
      value={jobTitleFilter}
      onChange={onJobTitleFilterChange}
      options={jobTitleOptions}
      blankLabel={arabicSource("hierarchy.filter_all_job_titles")}
      className="h-9 px-3 min-w-[160px]"
      optionsAreData
    />
    {managerOptions && onManagerFilterChange && (
      <Select
        value={managerFilter ?? ""}
        onChange={onManagerFilterChange}
        options={managerOptions}
        blankLabel={arabicSource("hierarchy.filter_all_managers")}
        className="h-9 px-3 min-w-[160px]"
        optionsAreData
      />
    )}
    {hasActiveFilter && (
      <button
        type="button"
        onClick={onClearFilters}
        className="text-primary hover:underline cursor-pointer"
        style={{ fontSize: 12 }}
      >
        {arabicSource("hierarchy.clear_filters")}
      </button>
    )}
  </div>
);

export default memo(HierarchyFilterBar);
