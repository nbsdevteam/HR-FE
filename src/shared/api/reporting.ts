import { hrCall } from "./client";
import { mapNotification, mapAuditLog, mapReportTemplate, mapReportHistory } from "./mappers";
import type { DbNotification, DbAuditLog, DbReportTemplate, DbReportHistory } from "../hooks";
import { items, eid } from "./httpHelpers";

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

export const createReportTemplate = async (payload: Record<string, unknown>) => {
  return hrCall("/api/hr/reports/templates/create", payload);
}

export const updateReportTemplate = async (templateId: string | number, payload: Record<string, unknown>) => {
  return hrCall(`/api/hr/reports/templates/${eid(templateId)}/update`, payload);
}

export const deleteReportTemplate = async (templateId: string | number) => {
  return hrCall(`/api/hr/reports/templates/${eid(templateId)}/delete`, {});
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
