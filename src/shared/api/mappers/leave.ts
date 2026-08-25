import type { DbLeaveType, DbLeaveRequest, DbLeaveBalance, DbLeavePermission, DbLeavePolicy, DbLeaveAttachment, DbLeaveSettings } from "../../hooks";
import { arabicSource } from "@/i18n/source";
import { sid, sornull, num, bool, empty, hhmmFromFloatOrLabel, isActive } from "./mapHelpers";

export const mapLeaveType = (r: any): DbLeaveType => {
  return {
    id: sid(r.id),
    name_ar: r.name_ar || r.name || "",
    name_en: r.name_en || r.name || null,
    code: r.code || "",
    is_paid: r.is_paid !== false && !r.unpaid,
    default_days_per_year: num(r.default_days_per_year),
    max_days_per_request: r.max_days_per_request ?? null,
    min_days_per_request: num(r.min_days_per_request, 1),
    allow_half_day: bool(r.allow_half_day),
    requires_attachment: bool(r.requires_attachment),
    attachment_after_days: r.attachment_after_days ?? null,
    allow_hourly: bool(r.allow_hourly),
    gender_restriction: r.gender_restriction || null,
    min_service_months: num(r.min_service_months),
    is_carryover_allowed: bool(r.is_carryover_allowed),
    max_carryover_days: num(r.max_carryover_days),
    carryover_expiry_months: num(r.carryover_expiry_months),
    is_encashable: bool(r.is_encashable),
    encashment_percentage: num(r.encashment_percentage),
    accrual_method: r.accrual_method || "yearly",
    color: r.color || "#888888",
    icon: r.icon || "",
    is_active: isActive(r),
    sort_order: num(r.sort_order),
    created_at: r.created_at || empty,
    updated_at: r.updated_at || empty,
  };
}

/** Map Odoo leave state → FE canonical Arabic statuses used by Leave filters. */
function mapLeaveStatus(state: string): string {
  // Must match arabicSource("common.pending|accepted|rejected_3|canceled").
  // Previously confirm→"قيد الانتظار" broke the Pending filter (expects "معلق").
  const m: Record<string, string> = {
    draft: arabicSource("common.pending"),
    confirm: arabicSource("common.pending"),
    validate1: arabicSource("common.pending"),
    validate: arabicSource("common.accepted"),
    refuse: arabicSource("common.rejected_3"),
    cancel: arabicSource("common.canceled"),
    pending: arabicSource("common.pending"),
    approved: arabicSource("common.accepted"),
    accepted: arabicSource("common.accepted"),
    rejected: arabicSource("common.rejected_3"),
    // Legacy labels (idempotent if already mapped)
    "قيد الانتظار": arabicSource("common.pending"),
    "موافقة المدير": arabicSource("common.pending"),
    معلق: arabicSource("common.pending"),
    مقبول: arabicSource("common.accepted"),
    مرفوض: arabicSource("common.rejected_3"),
    ملغي: arabicSource("common.canceled"),
  };
  return m[state] || m[String(state || "").toLowerCase()] || state || "";
}

export const mapLeaveAttachment = (r: any): DbLeaveAttachment => {
  return {
    id: sid(r.id),
    file_name: r.file_name || "",
    mimetype: r.mimetype || "",
    file_size: num(r.file_size),
    created_at: r.created_at || empty,
  };
}

export const mapLeaveRequest = (r: any): DbLeaveRequest => {
  return {
    id: sid(r.id),
    employee_id: sid(r.employee_id),
    leave_type: r.leave_type_name || r.leave_type || "",
    leave_type_id: sornull(r.leave_type_id),
    start_date: r.date_from || r.start_date || "",
    end_date: r.date_to || r.end_date || "",
    days: num(r.number_of_days ?? r.days),
    is_half_day: bool(r.half_day ?? r.is_half_day),
    half_day_period: r.half_day_period || null,
    reason: r.reason || null,
    status: mapLeaveStatus(r.state || r.status || ""),
    approved_by: r.approved_by || null,
    rejection_reason: r.rejection_reason || null,
    attachment_url: r.attachment_url || null,
    created_at: r.created_at || empty,
    updated_at: r.updated_at || empty,
    duration_unit: r.duration_unit === "hour" ? "hour" : "day",
    is_hourly: bool(r.is_hourly),
    number_of_hours: num(r.number_of_hours),
    requested_hours: num(r.requested_hours),
    max_hours_at_request: num(r.max_hours_at_request),
    hour_from: num(r.hour_from),
    hour_to: num(r.hour_to),
    attachment_ids: Array.isArray(r.attachment_ids) ? r.attachment_ids.map(sid) : [],
    attachment_count: num(r.attachment_count),
    attachments: Array.isArray(r.attachments) ? r.attachments.map(mapLeaveAttachment) : [],
    requires_attachment: bool(r.requires_attachment),
  };
}

export const mapLeaveSettings = (r: any): DbLeaveSettings => {
  return {
    max_hours_per_request: num(r.max_hours_per_request, 4),
    max_hours_config_key: r.max_hours_config_key || "leave.max_hours_per_request",
    max_hours_default: num(r.max_hours_default, 4),
    max_hours_ceiling: num(r.max_hours_ceiling, 24),
    attachment_max_mb: num(r.attachment_max_mb, 10),
    attachment_max_bytes: num(r.attachment_max_bytes, 10485760),
    attachment_accepted_formats: Array.isArray(r.attachment_accepted_formats)
      ? r.attachment_accepted_formats
      : [".pdf", ".doc", ".docx", ".txt", ".rtf", ".png", ".jpg", ".jpeg"],
  };
}

export const mapLeaveBalance = (r: any): DbLeaveBalance => {
  return {
    id: sid(r.id || `${r.employee_id}-${r.leave_type_id}-${r.year}`),
    employee_id: sid(r.employee_id),
    leave_type: r.leave_type_name || r.leave_type || "",
    leave_type_id: sornull(r.leave_type_id),
    year: num(r.year),
    total_days: num(r.total_days ?? r.max_leaves),
    used_days: num(r.used_days ?? r.leaves_taken),
    carryover_days: num(r.carryover_days),
    accrued_days: num(r.accrued_days),
    created_at: r.created_at || empty,
    updated_at: r.updated_at || empty,
  };
}

export const mapLeavePermission = (r: any): DbLeavePermission => {
  return {
    id: sid(r.id),
    employee_id: sid(r.employee_id),
    date: r.date || "",
    start_time: hhmmFromFloatOrLabel(r.start_time),
    end_time: hhmmFromFloatOrLabel(r.end_time),
    hours: num(r.hours),
    reason: r.reason || null,
    status: r.status || r.state || "",
    approved_by: r.approved_by || null,
    created_at: r.created_at || empty,
    updated_at: r.updated_at || empty,
  };
}

export const mapLeavePolicy = (r: any): DbLeavePolicy => {
  return {
    id: sid(r.id),
    leave_type_id: sid(r.leave_type_id),
    scope: r.scope || "global",
    scope_value: r.scope_value || null,
    days_per_year: num(r.days_per_year),
    max_days_per_request: r.max_days_per_request ?? null,
    allow_half_day: r.allow_half_day ?? null,
    is_active: isActive(r),
    created_at: r.created_at || empty,
    updated_at: r.updated_at || empty,
  };
}
