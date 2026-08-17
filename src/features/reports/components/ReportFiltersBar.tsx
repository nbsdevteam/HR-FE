import { LayoutGrid, Search, Table } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import type { DbDepartment } from "@/shared/hooks";
import { categoryLabels } from "../constants/reports";
import { cardCls } from "../styles";
import type { ReportViewMode } from "../types";

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
}: ReportFiltersBarProps) => (
  <div className={cardCls}>
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2 flex-1 min-w-[200px]">
        <Search className="w-4 h-4 text-muted-foreground" />
        <input
          placeholder={arabicSource("reports.search_reports")}
          value={searchQuery}
          onChange={e => onSearchQueryChange(e.target.value)}
          className="flex-1 bg-transparent text-foreground text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>
      <select
        value={filterCategory}
        onChange={e => onFilterCategoryChange(e.target.value)}
        className="px-3 py-2 rounded-lg bg-input border border-border/50 text-foreground text-sm"
      >
        <option value="all">{arabicSource("common.all_categories")}</option>
        {Object.entries(categoryLabels).map(([k, v]) => (
          <option key={k} value={k}>{v}</option>
        ))}
      </select>
      <select
        value={filterDept}
        onChange={e => onFilterDeptChange(e.target.value)}
        className="px-3 py-2 rounded-lg bg-input border border-border/50 text-foreground text-sm"
      >
        <option value="">{arabicSource("reports.all_sections")}</option>
        {departments.map(d => (
          <option key={d.id} value={d.name}>{d.name}</option>
        ))}
      </select>
      <input
        type="date"
        value={dateFrom}
        onChange={e => onDateFromChange(e.target.value)}
        className="px-3 py-2 rounded-lg bg-input border border-border/50 text-foreground text-sm"
        dir="ltr"
      />
      <span className="text-muted-foreground text-sm">{arabicSource("common.to")}</span>
      <input
        type="date"
        value={dateTo}
        onChange={e => onDateToChange(e.target.value)}
        className="px-3 py-2 rounded-lg bg-input border border-border/50 text-foreground text-sm"
        dir="ltr"
      />
      <div className="flex items-center border border-border/50 rounded-lg overflow-hidden">
        <button
          onClick={() => onViewModeChange("grid")}
          className={`p-2 cursor-pointer ${viewMode === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
        >
          <LayoutGrid className="w-4 h-4" />
        </button>
        <button
          onClick={() => onViewModeChange("table")}
          className={`p-2 cursor-pointer ${viewMode === "table" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
        >
          <Table className="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
);

export default ReportFiltersBar;
