export type ReportConfigColumn = { key: string; label: string };

export type ReportConfigFilterPair = { key: string; value: string };

/** Local edit-form shape for `lugal.hr.report.template` (backend §4). */
export type ReportConfigFormData = {
  name_ar: string;
  name_en: string;
  code: string;
  description: string;
  data_source: string;
  category: string;
  format: string;
  sort_order: string;
  active: boolean;
  columns: ReportConfigColumn[];
  filterPairs: ReportConfigFilterPair[];
};
