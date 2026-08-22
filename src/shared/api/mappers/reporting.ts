import type { DbNotification, DbAuditLog, DbReportTemplate, DbReportHistory } from "../../hooks";
import { sid, sornull, num, bool, empty } from "./mapHelpers";

export const mapNotification = (r: any): DbNotification => {
  return {
    id: sid(r.id),
    title: r.title || "",
    body: r.body || null,
    type: (r.type || r.notification_type || "info") as DbNotification["type"],
    category: r.category || "",
    entity_type: r.entity_type || null,
    entity_id: sornull(r.entity_id),
    target_employee_id: sornull(r.target_employee_id),
    is_read: bool(r.is_read),
    is_dismissed: bool(r.is_dismissed),
    action_url: r.action_url || null,
    attachments: Array.isArray(r.attachments) ? r.attachments : [],
    created_at: r.created_at || empty,
  };
}

export const mapAuditLog = (r: any): DbAuditLog => {
  return {
    id: sid(r.id),
    action: r.action || "",
    entity_type: r.entity_type || "",
    entity_id: sornull(r.entity_id),
    entity_label: r.entity_label || null,
    actor_name: r.actor_name || "",
    actor_employee_id: sornull(r.actor_employee_id),
    details: r.details || {},
    ip_address: r.ip_address || null,
    created_at: r.created_at || empty,
  };
}

export const mapReportTemplate = (r: any): DbReportTemplate => {
  return {
    id: sid(r.id),
    name_ar: r.name_ar || "",
    name_en: r.name_en || null,
    code: r.code || "",
    description: r.description || null,
    category: r.category || "custom",
    data_source: r.data_source || "",
    columns: r.columns || [],
    default_filters: r.default_filters || {},
    format: r.format || "table",
    is_active: bool(r.active ?? r.is_active ?? true),
    sort_order: num(r.sort_order),
    created_at: r.created_at || empty,
    updated_at: r.updated_at || empty,
  };
}

export const mapReportHistory = (r: any): DbReportHistory => {
  return {
    id: sid(r.id),
    report_template_id: sornull(r.report_template_id),
    report_name: r.report_name || "",
    filters_used: r.filters_used || {},
    row_count: num(r.row_count),
    generated_by: r.generated_by || "",
    generated_at: r.generated_at || empty,
  };
}
