export type ReportRow = Record<string, any>;

export type ReportViewMode = "grid" | "table";

export type ReportSortBy = "name" | "category";

export type ReportSortDir = "asc" | "desc";

export type ReportFilters = {
  dateFrom: string;
  dateTo: string;
  filterDept: string;
};
