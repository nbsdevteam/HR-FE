export type ReportRow = Record<string, any>;

export type ReportViewMode = "grid" | "table";

export type ReportSortBy = "name" | "category";

export type ReportSortDir = "asc" | "desc";

export type ReportFilters = {
  dateFrom: string;
  dateTo: string;
  filterDept: string;
};

/** A single rendered/exported report column — key to read off a row, label to display. */
export type ReportColumn = { key: string; label: string };

/** Which section of the report modal's selection panel is showing. */
export type ReportSelectionTabId = "employees" | "columns";

/** One togglable cell of the selection grid — `initials` renders an avatar (employees only). */
export type ReportSelectionItem = { value: string; label: string; initials?: string };

export type { HrReportGenerateResult, ReportField, ReportFieldsResult } from "@/shared/api/reporting";
