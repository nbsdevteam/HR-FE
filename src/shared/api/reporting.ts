import { hrCall } from "./client";
import { mapNotification, mapAuditLog, mapReportTemplate, mapReportHistory, mapReportTemplateMetadata } from "./mappers";
import type { DbNotification, DbAuditLog, DbReportTemplate, DbReportHistory, ReportTemplateMetadata } from "../hooks";
import { items, eid } from "./httpHelpers";

export type ReportTemplateListParams = {
  category?: string;
  search?: string;
  includeArchived?: boolean;
};

export type ReportTemplateListResult = {
  items: DbReportTemplate[];
  total: number;
};

export type ReportTemplateDeleteResult = {
  id: number;
  deleted: boolean;
  hard: boolean;
  active: boolean;
  history_detached: number;
};

/** A single selectable report column, as described by `/api/hr/reports/fields`. */
export type ReportField = {
  key: string;
  label: string;
  type: "string" | "number" | "boolean" | "date" | "time" | "datetime";
  default_selected: boolean;
};

export type ReportFieldsResult = {
  code: string;
  report_template_id: number | null;
  name_ar: string;
  name_en: string;
  category: string;
  fields: ReportField[];
  default_fields: string[];
  all_fields: string[];
  reports: ReportFieldsResult[];
  supported_codes: string[];
};

export type HrReportGenerateResult = {
  code: string;
  template: { id: number; code: string; name_ar: string; name_en: string; category: string };
  columns: { key: string; label: string }[];
  rows: Record<string, any>[];
  row_count: number;
  filters_used: Record<string, any>;
  available_fields: ReportField[];
  default_fields: string[];
  selected_fields: string[];
  selected_employee_ids: number[];
  history: Record<string, any> | null;
  timezone: string;
  generated_at: string;
};

export const fetchNotifications = async (includeDismissed = false): Promise<DbNotification[]> => {
  const rows = await items<any>("/api/hr/notifications/list", {
    include_dismissed: includeDismissed,
    limit: 200,
  });
  return rows.map(mapNotification);
}

export const createNotification = async (payload: Record<string, unknown>) => {
  return hrCall("/api/hr/notifications/create", payload);
}

export const markNotificationRead = async (notificationId: string | number) => {
  return hrCall(`/api/hr/notifications/${eid(notificationId)}/mark_read`, {});
}

export const dismissNotification = async (notificationId: string | number) => {
  return hrCall(`/api/hr/notifications/${eid(notificationId)}/dismiss`, {});
}

export const markAllNotificationsRead = async () => {
  return hrCall("/api/hr/notifications/mark_all_read", {});
}

export const fetchAuditLog = async (filters?: {
  entityType?: string;
  action?: string;
  entityId?: string | number;
}): Promise<DbAuditLog[]> => {
  const params: Record<string, unknown> = { limit: 200 };
  if (filters?.entityType) params.entity_type = filters.entityType;
  if (filters?.action) params.action = filters.action;
  if (filters?.entityId != null) params.entity_id = filters.entityId;
  const rows = await items<any>("/api/hr/audit/list", params);
  return rows.map(mapAuditLog);
}

export const createAuditLog = async (payload: Record<string, unknown>) => {
  return hrCall("/api/hr/audit/create", payload);
}

export const fetchReportTemplates = async (): Promise<DbReportTemplate[]> => {
  const rows = await items<any>("/api/hr/reports/templates/list", { active_only: true });
  return rows.map(mapReportTemplate);
}

/** Full list for the admin management screen — search/category/archived filters, plus `total` (backend §2.2). */
export const fetchReportTemplatesAdmin = async (params: ReportTemplateListParams = {}): Promise<ReportTemplateListResult> => {
  const data = await hrCall<{ items?: any[]; total?: number } | any[]>("/api/hr/reports/templates/list", {
    category: params.category,
    search: params.search,
    include_archived: params.includeArchived,
  });
  const rows = Array.isArray(data) ? data : data?.items || [];
  const total = Array.isArray(data) ? rows.length : Number(data?.total) || rows.length;
  return { items: rows.map(mapReportTemplate), total };
}

export const fetchReportTemplate = async (templateId: string | number): Promise<DbReportTemplate> => {
  const row = await hrCall<any>(`/api/hr/reports/templates/${eid(templateId)}`, {});
  return mapReportTemplate(row);
}

export const createReportTemplate = async (payload: Record<string, unknown>): Promise<DbReportTemplate> => {
  const row = await hrCall<any>("/api/hr/reports/templates/create", payload);
  return mapReportTemplate(row);
}

export const updateReportTemplate = async (templateId: string | number, payload: Record<string, unknown>): Promise<DbReportTemplate> => {
  const row = await hrCall<any>(`/api/hr/reports/templates/${eid(templateId)}/update`, payload);
  return mapReportTemplate(row);
}

export const deleteReportTemplate = async (templateId: string | number, opts: { hard?: boolean } = {}): Promise<ReportTemplateDeleteResult> => {
  return hrCall<ReportTemplateDeleteResult>(`/api/hr/reports/templates/${eid(templateId)}/delete`, { hard: !!opts.hard });
}

export const restoreReportTemplate = async (templateId: string | number): Promise<DbReportTemplate> => {
  const row = await hrCall<any>(`/api/hr/reports/templates/${eid(templateId)}/restore`, {});
  return mapReportTemplate(row);
}

/** Category/format choices, generatable codes and `can_manage` for the admin screen (backend §2.8). */
export const fetchReportTemplatesMetadata = async (): Promise<ReportTemplateMetadata> => {
  const data = await hrCall<any>("/api/hr/reports/templates/metadata", {});
  return mapReportTemplateMetadata(data);
}

export const fetchReportHistory = async (templateId?: string | number): Promise<DbReportHistory[]> => {
  const params: Record<string, unknown> = { limit: 100 };
  if (templateId) params.report_template_id = eid(templateId);
  const rows = await items<any>("/api/hr/reports/history/list", params);
  return rows.map(mapReportHistory);
}

export const createReportHistory = async (payload: Record<string, unknown>) => {
  const params = { ...payload };
  if (params.report_template_id != null) {
    params.report_template_id = eid(params.report_template_id as string | number);
  }
  return hrCall("/api/hr/reports/history/create", params);
}

/** Selectable field catalog for one (or, when `code` is omitted, every) backend-generated report. */
export const fetchReportFields = async (code?: string): Promise<ReportFieldsResult> => {
  return hrCall<ReportFieldsResult>("/api/hr/reports/fields", code ? { code } : {});
}

/** Runs a backend report generator with employee/field selection applied. */
export const generateHrReport = async (payload: Record<string, unknown>): Promise<HrReportGenerateResult> => {
  return hrCall<HrReportGenerateResult>("/api/hr/reports/generate", payload);
}
