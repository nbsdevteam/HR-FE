import type {
  DbDocumentType,
  DbEmployeeDocument,
  DbContractType,
  DbEmployeeContract,
  DbExitChecklistItem,
  DbExitProcess,
  DbExitChecklist,
} from "../../hooks";
import { sid, sornull, num, bool, empty } from "./mapHelpers";

export const mapDocumentType = (r: any): DbDocumentType => {
  return {
    id: sid(r.id),
    name_ar: r.name_ar || r.name || "",
    name_en: r.name || r.name_en || null,
    code: r.code || "",
    has_expiry: bool(r.has_expiry),
    expiry_warning_days: num(r.before_days ?? r.expiry_warning_days, 30),
    is_required: bool(r.is_required),
    required_for_contract_types: r.required_for_contract_types || null,
    is_active: r.active !== false && r.is_active !== false,
    sort_order: num(r.sort_order),
    created_at: r.created_at || empty,
  };
}

export const mapDocument = (r: any): DbEmployeeDocument => {
  return {
    id: sid(r.id),
    employee_id: sid(r.employee_id),
    document_type_id: sid(r.document_type_id),
    document_number: r.document_number || r.name || null,
    issue_date: r.issue_date || null,
    expiry_date: r.expiry_date || null,
    file_url: r.file_url || r.attachment_url || null,
    file_name: r.file_name || r.name || null,
    notes: r.description || r.notes || null,
    status: r.status || "valid",
    created_at: r.created_at || empty,
    updated_at: r.updated_at || empty,
  };
}

// ——— Slice A: Lifecycle (contracts / exit / custodies) ———

export const mapContractType = (r: any): DbContractType => {
  return {
    id: sid(r.id),
    name_ar: r.name_ar || r.name || "",
    name_en: r.name || r.name_en || null,
    code: r.code || "",
    description: r.description || null,
    default_duration_months: r.default_duration_months ?? null,
    is_renewable: bool(r.is_renewable),
    probation_days: num(r.probation_days),
    notice_period_days: num(r.notice_period_days),
    is_active: r.active !== false && r.is_active !== false,
    sort_order: num(r.sort_order),
    created_at: r.created_at || empty,
    updated_at: r.updated_at || empty,
  };
}

export const mapEmployeeContract = (r: any): DbEmployeeContract => {
  return {
    id: sid(r.id),
    employee_id: sid(r.employee_id),
    contract_type_id: sid(r.contract_type_id),
    contract_number: r.contract_number || null,
    start_date: r.start_date || "",
    end_date: r.end_date || null,
    probation_end_date: r.probation_end_date || null,
    probation_status: r.probation_status || "ongoing",
    salary_amount: r.salary_amount ?? null,
    salary_currency: r.salary_currency || "IQD",
    renewal_count: num(r.renewal_count),
    status: r.status || "active",
    notes: r.notes || null,
    attachment_url: r.attachment_url || null,
    signed_date: r.signed_date || null,
    created_at: r.created_at || empty,
    updated_at: r.updated_at || empty,
  };
}

export const mapExitChecklistItem = (r: any): DbExitChecklistItem => {
  return {
    id: sid(r.id),
    name_ar: r.name_ar || r.name || "",
    name_en: r.name || r.name_en || null,
    category: r.category || "general",
    responsible_role: r.responsible_role || "",
    sort_order: num(r.sort_order),
    is_active: r.active !== false && r.is_active !== false,
    created_at: r.created_at || empty,
  };
}

export const mapExitProcess = (r: any): DbExitProcess => {
  return {
    id: sid(r.id),
    employee_id: sid(r.employee_id),
    exit_type: r.exit_type || "resignation",
    exit_date: r.exit_date || "",
    last_working_day: r.last_working_day || null,
    reason: r.reason || null,
    notice_date: r.notice_date || null,
    notice_period_days: r.notice_period_days ?? null,
    eos_amount: r.eos_amount ?? null,
    eos_currency: r.eos_currency || "IQD",
    final_settlement_amount: r.final_settlement_amount ?? null,
    status: r.status || "initiated",
    approved_by: r.approved_by || null,
    notes: r.notes || null,
    created_at: r.created_at || empty,
    updated_at: r.updated_at || empty,
  };
}

export const mapExitChecklistLine = (r: any): DbExitChecklist => {
  return {
    id: sid(r.id),
    exit_process_id: sid(r.exit_process_id),
    checklist_item_id: sid(r.checklist_item_id),
    is_completed: bool(r.is_completed),
    completed_by: r.completed_by || null,
    completed_at: r.completed_at || null,
    notes: r.notes || null,
    created_at: r.created_at || empty,
  };
}

export const mapApprovalWorkflow = (r: any): any => {
  return {
    id: sid(r.id),
    name_ar: r.name_ar || r.name || "",
    name_en: r.name || null,
    entity_type: r.entity_type || "",
    is_active: bool(r.active !== undefined ? r.active : r.is_active),
    steps: Array.isArray(r.steps) ? r.steps : [],
    employee_ids: r.employee_ids || [],
    created_at: r.created_at || empty,
    updated_at: r.updated_at || empty,
  };
}

export const mapApprovalRequest = (r: any): any => {
  return {
    id: sid(r.id),
    workflow_id: sornull(r.workflow_id),
    entity_type: r.entity_type || "",
    entity_id: sid(r.entity_res_id || r.entity_id),
    requested_by: sornull(r.requested_by_id || r.requested_by),
    current_step: r.current_step_sequence || r.current_step || 0,
    status: r.status || "",
    current_step_name: r.current_step_name || "",
    actions: Array.isArray(r.actions) ? r.actions : [],
    created_at: r.created_at || empty,
    updated_at: r.updated_at || empty,
  };
}

export const mapIssue = (r: any): any => {
  return {
    id: sid(r.id),
    name: r.name || r.subject || "",
    description: r.description || "",
    category: r.category || "other",
    priority: r.priority || "normal",
    state: r.state || r.status || "submitted",
    employee_id: sornull(r.employee_id),
    employee_name: r.employee_name || "",
    assignee_id: sornull(r.assignee_id),
    resolution_note: r.resolution_note || null,
    created_at: r.created_at || empty,
    updated_at: r.updated_at || empty,
  };
}
