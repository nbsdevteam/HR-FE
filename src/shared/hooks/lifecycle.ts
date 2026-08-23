import * as odooData from "@/shared/api/odooData";
import { useAsyncList } from "./useAsyncList";

// ——— Phase 4: Employee Lifecycle & Compliance Types ———

export interface DbContractType {
  id: string;
  name_ar: string;
  name_en: string | null;
  code: string;
  description: string | null;
  default_duration_months: number | null;
  is_renewable: boolean;
  probation_days: number;
  notice_period_days: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface DbEmployeeContract {
  id: string;
  employee_id: string;
  contract_type_id: string;
  contract_number: string | null;
  start_date: string;
  end_date: string | null;
  probation_end_date: string | null;
  probation_status: string;
  salary_amount: number | null;
  salary_currency: string;
  renewal_count: number;
  status: string;
  notes: string | null;
  attachment_url: string | null;
  signed_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbDocumentType {
  id: string;
  name_ar: string;
  name_en: string | null;
  code: string;
  has_expiry: boolean;
  expiry_warning_days: number;
  is_required: boolean;
  required_for_contract_types: string[] | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface DbEmployeeDocument {
  id: string;
  employee_id: string;
  document_type_id: string;
  document_number: string | null;
  issue_date: string | null;
  expiry_date: string | null;
  file_url: string | null;
  file_name: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbExitChecklistItem {
  id: string;
  name_ar: string;
  name_en: string | null;
  category: string;
  responsible_role: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface DbExitProcess {
  id: string;
  employee_id: string;
  exit_type: string;
  exit_date: string;
  last_working_day: string | null;
  reason: string | null;
  notice_date: string | null;
  notice_period_days: number | null;
  eos_amount: number | null;
  eos_currency: string;
  final_settlement_amount: number | null;
  status: string;
  approved_by: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbExitChecklist {
  id: string;
  exit_process_id: string;
  checklist_item_id: string;
  is_completed: boolean;
  completed_by: string | null;
  completed_at: string | null;
  notes: string | null;
  created_at: string;
}

export interface DbApprovalWorkflow {
  id: string;
  name_ar: string;
  name_en: string | null;
  entity_type: string;
  is_active: boolean;
  steps?: any[];
  employee_ids?: number[];
  created_at: string;
  updated_at: string;
}

export interface DbApprovalWorkflowStep {
  id: string;
  workflow_id: string;
  step_order: number;
  approver_type: string;
  approver_id: string | null;
  approver_role: string | null;
  can_skip: boolean;
  auto_approve_after_days: number | null;
  created_at: string;
}

export interface DbApprovalRequest {
  id: string;
  workflow_id: string | null;
  entity_type: string;
  entity_id: string;
  requested_by: string;
  current_step: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export const useContractTypes = () => {
  const { data: types, loading, refetch } = useAsyncList(() => odooData.fetchContractTypes(), [], "Failed to load contract types", undefined, { cacheKey: "contractTypes" });
  return { types, loading, refetch };
}

export const useEmployeeContracts = (employeeId?: string) => {
  const { data: contracts, loading, refetch } = useAsyncList(
    () => odooData.fetchContracts(employeeId),
    [employeeId],
    "Failed to load contracts",
    undefined,
    { cacheKey: "contracts" }
  );
  return { contracts, loading, refetch };
}

export const useDocumentTypes = () => {
  const { data: types, loading, refetch } = useAsyncList(() => odooData.fetchDocumentTypes(), [], "Failed to load document types", undefined, { cacheKey: "documentTypes" });
  return { types, loading, refetch };
}

export const useEmployeeDocuments = (employeeId?: string) => {
  const { data: documents, loading, refetch } = useAsyncList(
    () => odooData.fetchDocuments(employeeId),
    [employeeId],
    "Failed to load documents",
    undefined,
    { cacheKey: "documents" }
  );
  return { documents, loading, refetch };
}

export const useApprovalWorkflows = () => {
  const { data: workflows, loading, refetch } = useAsyncList(() => odooData.fetchApprovalWorkflows(), [], "Failed to load approval workflows", undefined, { cacheKey: "approvalWorkflows" });
  return { workflows, loading, refetch };
}

export const useApprovalWorkflowSteps = (workflowId?: string) => {
  const { data: steps, loading, refetch } = useAsyncList(async () => {
    const workflows = await odooData.fetchApprovalWorkflows();
    const wf = workflows.find((w: any) => String(w.id) === String(workflowId));
    return ((wf as any)?.steps || []).map((s: any) => ({
      id: String(s.id),
      workflow_id: String(workflowId || ""),
      step_order: s.sequence || 0,
      approver_type: s.approver_type || "",
      approver_id: s.approver_employee_id ? String(s.approver_employee_id) : null,
      approver_role: s.approver_permission || null,
      can_skip: Boolean(s.can_skip),
      auto_approve_after_days: s.auto_approve_after_days || null,
      created_at: "",
    }));
  }, [workflowId], "Failed to load workflow steps", undefined, { cacheKey: "approvalWorkflowSteps" });
  return { steps, loading, refetch };
}

export const useApprovalRequests = (filters?: { entityType?: string; status?: string }) => {
  const { data: requests, loading, refetch } = useAsyncList(
    () => odooData.fetchApprovalRequests({
      entityType: filters?.entityType,
      status: filters?.status,
    }),
    [filters?.entityType, filters?.status],
    "Failed to load approval requests",
    undefined,
    { cacheKey: "approvalRequests" }
  );
  return { requests, loading, refetch };
}

export const useIssues = (filters?: { employeeId?: string; state?: string }) => {
  const { data: issues, loading, refetch } = useAsyncList(
    () => odooData.fetchIssues({
      employeeId: filters?.employeeId,
      state: filters?.state,
    }),
    [filters?.employeeId, filters?.state],
    "Failed to load issues",
    undefined,
    { cacheKey: "issues" }
  );
  return { issues, loading, refetch };
}

export const useExitChecklistItems = () => {
  const { data: items, loading, refetch } = useAsyncList(() => odooData.fetchExitChecklistItems(), [], "Failed to load exit checklist items", undefined, { cacheKey: "exitChecklistItems" });
  return { items, loading, refetch };
}

export const useExitProcesses = (employeeId?: string) => {
  const { data: processes, loading, refetch } = useAsyncList(
    async () => (await odooData.fetchExitProcesses(employeeId)).processes,
    [employeeId],
    "Failed to load exit processes",
    undefined,
    { cacheKey: "exitProcesses" }
  );
  return { processes, loading, refetch };
}

export const useExitChecklist = (exitProcessId?: string) => {
  // Checklist lines are embedded in the exit processes payload.
  const { data: checklist, loading, refetch } = useAsyncList(async () => {
    const { checklist: rows } = await odooData.fetchExitProcesses();
    return exitProcessId ? rows.filter(c => c.exit_process_id === exitProcessId) : rows;
  }, [exitProcessId], "Failed to load exit checklist", undefined, { cacheKey: "exitChecklist" });
  return { checklist, loading, refetch };
}
