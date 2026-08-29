import { hrCall } from "./client";
import {
  mapDocumentType,
  mapDocument,
  mapContractType,
  mapEmployeeContract,
  mapExitChecklistItem,
  mapExitProcess,
  mapExitChecklistLine,
  mapCustody,
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
  DbCustody,
} from "../hooks";
import { items, eid } from "./httpHelpers";
import { crudFactory, fetchList, withEid } from "./crud";

const documentTypes = crudFactory("/api/hr/document_types");
const documents = crudFactory("/api/hr/documents");
const contractTypes = crudFactory("/api/hr/contract_types");
const contracts = crudFactory("/api/hr/contracts");
const exitProcesses = crudFactory("/api/hr/exit");
const exitChecklist = crudFactory("/api/hr/exit/checklist");
const custodies = crudFactory("/api/hr/custodies");
const issues = crudFactory("/api/hr/issues");
const approvalWorkflows = crudFactory("/api/hr/approvals/workflows");

export const createDocumentType = documentTypes.create;
export const updateDocumentType = documentTypes.update;
export const deleteDocumentType = documentTypes.remove;

export const fetchDocumentTypes = (): Promise<DbDocumentType[]> =>
  fetchList("/api/hr/document_types/list", mapDocumentType);

export const fetchDocuments = (
  employeeId?: string,
): Promise<DbEmployeeDocument[]> => {
  const params: Record<string, unknown> = { limit: 200 };
  if (employeeId) params.employee_id = Number(employeeId) || employeeId;
  return fetchList("/api/hr/documents/list", mapDocument, params);
};

export const createDocument = (payload: Record<string, unknown>) =>
  documents.create(withEid(payload, ["employee_id", "document_type_id"]));
export const updateDocument = documents.update;
export const deleteDocument = documents.remove;

// ─── Slice A: Lifecycle (contracts / exit / custodies) ───────────────

export const fetchContractTypes = (): Promise<DbContractType[]> =>
  fetchList("/api/hr/contract_types/list", mapContractType, {
    active_only: true,
  });

export const createContractType = contractTypes.create;
export const updateContractType = contractTypes.update;
export const deleteContractType = contractTypes.remove;

export const fetchContracts = (
  employeeId?: string | number,
): Promise<DbEmployeeContract[]> => {
  const params: Record<string, unknown> = { limit: 500 };
  if (employeeId) params.employee_id = eid(employeeId);
  return fetchList("/api/hr/contracts/list", mapEmployeeContract, params);
};

export const createContract = (payload: Record<string, unknown>) =>
  contracts.create(withEid(payload, ["employee_id"]));
export const updateContract = contracts.update;
export const deleteContract = contracts.remove;

export const fetchExitChecklistItems = (): Promise<DbExitChecklistItem[]> =>
  fetchList("/api/hr/exit/checklist_items/list", mapExitChecklistItem, {
    active_only: true,
  });

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
};

export const createExitProcess = (payload: Record<string, unknown>) =>
  exitProcesses?.create(withEid(payload, ["employee_id"]));
export const updateExitProcess = exitProcesses?.update;
export const updateExitChecklistLine = exitChecklist?.update;

export const fetchCustodies = (
  employeeId?: string | number,
): Promise<DbCustody[]> => {
  const params: Record<string, unknown> = { limit: 500 };
  if (employeeId) params.employee_id = eid(employeeId);
  return fetchList("/api/hr/custodies/list", mapCustody, params);
};

export const createCustody = (payload: Record<string, unknown>) =>
  custodies.create(withEid(payload, ["employee_id"]));
export const updateCustody = custodies?.update;
export const deleteCustody = custodies?.remove;

export const fetchIssues = (filters?: {
  employeeId?: string | number;
  state?: string;
  category?: string;
}): Promise<any[]> => {
  const params: Record<string, unknown> = { limit: 200 };
  if (filters?.employeeId != null) params.employee_id = eid(filters.employeeId);
  if (filters?.state) params.state = filters.state;
  if (filters?.category) params.category = filters.category;
  return fetchList("/api/hr/issues/list", mapIssue, params);
};

export const createIssue = (payload: Record<string, unknown>) =>
  issues.create(withEid(payload, ["employee_id"]));
export const updateIssue = issues.update;

export const resolveIssue = async (
  issueId: string | number,
  resolution_note?: string,
  state = "resolved",
) => {
  return hrCall(`/api/hr/issues/${eid(issueId)}/resolve`, {
    resolution_note,
    state,
  });
};

export const fetchApprovalWorkflows = async (
  entityType = "leave_request",
): Promise<any[]> => {
  const data = await hrCall<{ items?: any[] }>(
    "/api/hr/approvals/workflows/list",
    {
      entity_type: entityType,
      active_only: true,
    },
  );
  const rows = data?.items || [];
  return rows.map(mapApprovalWorkflow);
};

export const createApprovalWorkflow = approvalWorkflows.create;
export const updateApprovalWorkflow = approvalWorkflows.update;

export const fetchApprovalRequests = (filters?: {
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
  return fetchList(
    "/api/hr/approvals/requests/list",
    mapApprovalRequest,
    params,
  );
};

export const approveApprovalRequest = async (
  requestId: string | number,
  comment?: string,
) => {
  return hrCall(`/api/hr/approvals/requests/${eid(requestId)}/approve`, {
    comment,
  });
};

export const rejectApprovalRequest = async (
  requestId: string | number,
  comment?: string,
) => {
  return hrCall(`/api/hr/approvals/requests/${eid(requestId)}/reject`, {
    comment,
  });
};
