import { hrCall } from "./client";
import {
  mapDocumentType,
  mapDocument,
  mapContractType,
  mapEmployeeContract,
  mapExitChecklistItem,
  mapExitProcess,
  mapExitChecklistLine,
  mapIssue,
  mapApprovalWorkflow,
  mapApprovalRequest,
} from "./mappers";
import type {
  DbDocumentType,
  DbEmployeeDocument,
  DbContractType,
  DbEmployeeContract,
  DbExitChecklistItem,
  DbExitProcess,
  DbExitChecklist,
} from "../hooks";
import { items, eid } from "./httpHelpers";

export const createDocumentType = async (payload: Record<string, unknown>) => {
  return hrCall("/api/hr/document_types/create", payload);
}

export const updateDocumentType = async (typeId: string | number, payload: Record<string, unknown>) => {
  return hrCall(`/api/hr/document_types/${eid(typeId)}/update`, payload);
}

export const deleteDocumentType = async (typeId: string | number) => {
  return hrCall(`/api/hr/document_types/${eid(typeId)}/delete`, {});
}

export const fetchDocumentTypes = async (): Promise<DbDocumentType[]> => {
  const rows = await items<any>("/api/hr/document_types/list");
  return rows.map(mapDocumentType);
}

export const fetchDocuments = async (employeeId?: string): Promise<DbEmployeeDocument[]> => {
  const params: Record<string, unknown> = { limit: 200 };
  if (employeeId) params.employee_id = Number(employeeId) || employeeId;
  const rows = await items<any>("/api/hr/documents/list", params);
  return rows.map(mapDocument);
}

export const createDocument = async (payload: Record<string, unknown>) => {
  const params = { ...payload };
  if (params.employee_id != null) params.employee_id = eid(params.employee_id as string | number);
  if (params.document_type_id != null) {
    params.document_type_id = eid(params.document_type_id as string | number);
  }
  return hrCall("/api/hr/documents/create", params);
}

export const updateDocument = async (documentId: string | number, payload: Record<string, unknown>) => {
  return hrCall(`/api/hr/documents/${eid(documentId)}/update`, payload);
}

export const deleteDocument = async (documentId: string | number) => {
  return hrCall(`/api/hr/documents/${eid(documentId)}/delete`, {});
}

// ─── Slice A: Lifecycle (contracts / exit / custodies) ───────────────

export const fetchContractTypes = async (): Promise<DbContractType[]> => {
  const rows = await items<any>("/api/hr/contract_types/list", { active_only: true });
  return rows.map(mapContractType);
}

export const createContractType = async (payload: Record<string, unknown>) => {
  return hrCall("/api/hr/contract_types/create", payload);
}

export const updateContractType = async (typeId: string | number, payload: Record<string, unknown>) => {
  return hrCall(`/api/hr/contract_types/${eid(typeId)}/update`, payload);
}

export const deleteContractType = async (typeId: string | number) => {
  return hrCall(`/api/hr/contract_types/${eid(typeId)}/delete`, {});
}

export const fetchContracts = async (employeeId?: string | number): Promise<DbEmployeeContract[]> => {
  const params: Record<string, unknown> = { limit: 500 };
  if (employeeId) params.employee_id = eid(employeeId);
  const rows = await items<any>("/api/hr/contracts/list", params);
  return rows.map(mapEmployeeContract);
}

export const createContract = async (payload: Record<string, unknown>) => {
  const params = { ...payload };
  if (params.employee_id != null) params.employee_id = eid(params.employee_id as string | number);
  return hrCall("/api/hr/contracts/create", params);
}

export const updateContract = async (contractId: string | number, payload: Record<string, unknown>) => {
  return hrCall(`/api/hr/contracts/${eid(contractId)}/update`, payload);
}

export const deleteContract = async (contractId: string | number) => {
  return hrCall(`/api/hr/contracts/${eid(contractId)}/delete`, {});
}

export const fetchExitChecklistItems = async (): Promise<DbExitChecklistItem[]> => {
  const rows = await items<any>("/api/hr/exit/checklist_items/list", { active_only: true });
  return rows.map(mapExitChecklistItem);
}

export const fetchExitProcesses = async (
  employeeId?: string | number,
): Promise<{ processes: DbExitProcess[]; checklist: DbExitChecklist[] }> => {
  const params: Record<string, unknown> = { limit: 500 };
  if (employeeId) params.employee_id = eid(employeeId);
  const rows = await items<any>("/api/hr/exit/list", params);
  const processes = rows.map(mapExitProcess);
  const checklist: DbExitChecklist[] = [];
  for (const r of rows as any[]) {
    if (Array.isArray(r.checklist)) {
      checklist.push(...r.checklist.map(mapExitChecklistLine));
    }
  }
  return { processes, checklist };
}

export const createExitProcess = async (payload: Record<string, unknown>) => {
  const params = { ...payload };
  if (params.employee_id != null) params.employee_id = eid(params.employee_id as string | number);
  return hrCall("/api/hr/exit/create", params);
}

export const updateExitProcess = async (exitId: string | number, payload: Record<string, unknown>) => {
  return hrCall(`/api/hr/exit/${eid(exitId)}/update`, payload);
}

export const updateExitChecklistLine = async (lineId: string | number, payload: Record<string, unknown>) => {
  return hrCall(`/api/hr/exit/checklist/${eid(lineId)}/update`, payload);
}

export const fetchCustodies = async (employeeId?: string | number): Promise<any[]> => {
  const params: Record<string, unknown> = { limit: 500 };
  if (employeeId) params.employee_id = eid(employeeId);
  return items<any>("/api/hr/custodies/list", params);
}

export const createCustody = async (payload: Record<string, unknown>) => {
  const params = { ...payload };
  if (params.employee_id != null) params.employee_id = eid(params.employee_id as string | number);
  return hrCall("/api/hr/custodies/create", params);
}

export const updateCustody = async (custodyId: string | number, payload: Record<string, unknown>) => {
  return hrCall(`/api/hr/custodies/${eid(custodyId)}/update`, payload);
}

export const deleteCustody = async (custodyId: string | number) => {
  return hrCall(`/api/hr/custodies/${eid(custodyId)}/delete`, {});
}

export const fetchIssues = async (filters?: {
  employeeId?: string | number;
  state?: string;
  category?: string;
}): Promise<any[]> => {
  const params: Record<string, unknown> = { limit: 200 };
  if (filters?.employeeId != null) params.employee_id = eid(filters.employeeId);
  if (filters?.state) params.state = filters.state;
  if (filters?.category) params.category = filters.category;
  const rows = await items<any>("/api/hr/issues/list", params);
  return rows.map(mapIssue);
}

export const createIssue = async (payload: Record<string, unknown>) => {
  const params = { ...payload };
  if (params.employee_id != null) params.employee_id = eid(params.employee_id as string | number);
  return hrCall("/api/hr/issues/create", params);
}

export const updateIssue = async (issueId: string | number, payload: Record<string, unknown>) => {
  return hrCall(`/api/hr/issues/${eid(issueId)}/update`, payload);
}

export const resolveIssue = async (
  issueId: string | number,
  resolution_note?: string,
  state = "resolved",
) => {
  return hrCall(`/api/hr/issues/${eid(issueId)}/resolve`, { resolution_note, state });
}

export const fetchApprovalWorkflows = async (entityType = "leave_request"): Promise<any[]> => {
  const data = await hrCall<{ items?: any[] }>("/api/hr/approvals/workflows/list", {
    entity_type: entityType,
    active_only: true,
  });
  const rows = data?.items || [];
  return rows.map(mapApprovalWorkflow);
}

export const createApprovalWorkflow = async (payload: Record<string, unknown>) => {
  return hrCall("/api/hr/approvals/workflows/create", payload);
}

export const updateApprovalWorkflow = async (
  workflowId: string | number,
  payload: Record<string, unknown>,
) => {
  return hrCall(`/api/hr/approvals/workflows/${eid(workflowId)}/update`, payload);
}

export const fetchApprovalRequests = async (filters?: {
  entityType?: string;
  status?: string;
  mineOnly?: boolean;
}): Promise<any[]> => {
  const params: Record<string, unknown> = {
    status: filters?.status || "pending",
    limit: 200,
  };
  if (filters?.entityType) params.entity_type = filters.entityType;
  if (filters?.mineOnly) params.mine_only = true;
  const rows = await items<any>("/api/hr/approvals/requests/list", params);
  return rows.map(mapApprovalRequest);
}

export const approveApprovalRequest = async (requestId: string | number, comment?: string) => {
  return hrCall(`/api/hr/approvals/requests/${eid(requestId)}/approve`, { comment });
}

export const rejectApprovalRequest = async (requestId: string | number, comment?: string) => {
  return hrCall(`/api/hr/approvals/requests/${eid(requestId)}/reject`, { comment });
}
