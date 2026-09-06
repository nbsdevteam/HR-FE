import * as odooData from "@/shared/api/odooData";
import { STALE_TIME } from "@/shared/api/queryClient";
import { useCachedList } from "./core";

// ——— Phase 5: Notifications, Audit Trail & Reports ———

export interface DbNotification {
  id: string;
  title: string;
  body: string | null;
  type: 'info' | 'warning' | 'success' | 'error' | 'action';
  category: string;
  entity_type: string | null;
  entity_id: string | null;
  target_employee_id: string | null;
  is_read: boolean;
  is_dismissed: boolean;
  action_url: string | null;
  attachments?: { id: number; name: string; mimetype?: string; file_size?: number }[];
  created_at: string;
}

export interface DbAuditLog {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  entity_label: string | null;
  actor_name: string;
  actor_employee_id: string | null;
  details: Record<string, any>;
  ip_address: string | null;
  created_at: string;
}

export interface DbReportTemplate {
  id: string;
  legacy_id: string;
  name_ar: string;
  name_en: string | null;
  code: string;
  description: string | null;
  category: string;
  data_source: string;
  columns: { key: string; label: string }[];
  default_filters: Record<string, any>;
  format: string;
  is_active: boolean;
  sort_order: number;
  supports_field_selection: boolean;
  can_generate: boolean;
  available_fields: { key: string; label: string }[];
  default_fields: string[];
  created_at: string;
  updated_at: string;
}

export interface ReportTemplateMetadata {
  categories: { value: string; label: string }[];
  formats: { value: string; label: string }[];
  generatableCodes: string[];
  codeAliases: Record<string, string>;
  codePattern: string;
  canManage: boolean;
}

export interface DbReportHistory {
  id: string;
  report_template_id: string | null;
  report_name: string;
  filters_used: Record<string, any>;
  row_count: number;
  generated_by: string;
  generated_at: string;
}

export const useNotifications = (employeeId?: string) => {
  const { data: notifications, loading, refetch } = useCachedList(
    "notifications",
    () => odooData.fetchNotifications(),
    "Failed to load notifications",
    [employeeId],
    true,
    { ttlMs: STALE_TIME.SHORT, refetchOnWindowFocus: true },
  );
  const unreadCount = notifications.filter(n => !n.is_read).length;
  return { notifications, unreadCount, loading, refetch };
}

export const useAuditLog = (filters?: { entityType?: string; action?: string; limit?: number }) => {
  const { data: logs, loading, refetch } = useCachedList(
    "auditLog",
    () => odooData.fetchAuditLog({ entityType: filters?.entityType, action: filters?.action }),
    "Failed to load audit log",
    [filters?.entityType, filters?.action, filters?.limit],
  );
  return { logs, loading, refetch };
}

export const useReportTemplates = () => {
  const { data: templates, loading, refetch } = useCachedList(
    "reportTemplates",
    () => odooData.fetchReportTemplates(),
    "Failed to load report templates",
    [],
    true,
    { ttlMs: STALE_TIME.LONG },
  );
  return { templates, loading, refetch };
}

/** Form choices + `can_manage` for the report-configuration admin screen (backend §2.8) — reference data, rarely changes. */
export const useReportTemplateMetadata = () => {
  const { data, loading, refetch } = useCachedList(
    "reportTemplateMetadata",
    async () => [await odooData.fetchReportTemplatesMetadata()],
    "Failed to load report metadata",
    [],
    true,
    { ttlMs: STALE_TIME.LONG },
  );
  return { metadata: data[0] ?? null, loading, refetch };
}

export const useReportHistory = () => {
  const { data: history, loading, refetch } = useCachedList("reportHistory", () => odooData.fetchReportHistory(), "Failed to load report history");
  return { history, loading, refetch };
}

/** Log an audit entry */
export const logAudit = async (entry: {
  action: string;
  entity_type: string;
  entity_id?: string;
  entity_label?: string;
  actor_name?: string;
  actor_employee_id?: string;
  details?: Record<string, any>;
}) => {
  try {
    await odooData.createAuditLog({
      action: entry.action,
      entity_type: entry.entity_type,
      entity_id: entry.entity_id,
      entity_label: entry.entity_label,
      details: entry.details || {},
    });
  } catch (e) {
    console.error(e);
  }
}

/** Create a notification */
export const createNotification = async (n: {
  title: string;
  body?: string;
  type?: 'info' | 'warning' | 'success' | 'error' | 'action';
  category?: string;
  entity_type?: string;
  entity_id?: string;
  target_employee_id?: string;
  action_url?: string;
}) => {
  try {
    await odooData.createNotification({
      title: n.title,
      body: n.body,
      type: n.type || "info",
      category: n.category || "system",
      entity_type: n.entity_type,
      entity_id: n.entity_id,
      target_employee_id: n.target_employee_id,
      action_url: n.action_url,
    });
  } catch (e) {
    console.error(e);
  }
}
