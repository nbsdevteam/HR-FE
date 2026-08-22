import { hrCall } from "./client";
import {
  mapEvaluation,
  mapEvaluationCriterion,
  mapWarning,
  mapPolicy,
  mapTrainingProgram,
  mapTrainingParticipant,
} from "./mappers";
import type {
  DbEvaluation,
  DbEvaluationCriteria,
  DbWarning,
  DbPolicy,
  DbTrainingProgram,
  DbTrainingParticipant,
} from "../hooks";
import { items, eid } from "./httpHelpers";

export const fetchEvaluations = async (employeeId?: string | number): Promise<DbEvaluation[]> => {
  const params: Record<string, unknown> = { limit: 500 };
  if (employeeId) params.employee_id = eid(employeeId);
  const rows = await items<any>("/api/hr/evaluations/list", params);
  return rows.map(mapEvaluation);
}

export const fetchEvaluationCriteria = async (): Promise<DbEvaluationCriteria[]> => {
  // Criteria are embedded in evaluations/list responses; provided for API parity.
  const rows = await items<any>("/api/hr/evaluations/list", { limit: 500 });
  const criteria: DbEvaluationCriteria[] = [];
  for (const r of rows as any[]) {
    if (Array.isArray(r.criteria)) {
      criteria.push(...r.criteria.map(mapEvaluationCriterion));
    }
  }
  return criteria;
}

export const fetchEvaluationsWithCriteria = async (
  employeeId?: string | number,
): Promise<{ evaluations: DbEvaluation[]; criteria: DbEvaluationCriteria[] }> => {
  const params: Record<string, unknown> = { limit: 500 };
  if (employeeId) params.employee_id = eid(employeeId);
  const rows = await items<any>("/api/hr/evaluations/list", params);
  const evaluations = rows.map(mapEvaluation);
  const criteria: DbEvaluationCriteria[] = [];
  for (const r of rows as any[]) {
    if (Array.isArray(r.criteria)) {
      criteria.push(...r.criteria.map(mapEvaluationCriterion));
    }
  }
  return { evaluations, criteria };
}

export const createEvaluation = async (payload: Record<string, unknown>) => {
  const params = { ...payload };
  if (params.employee_id != null) params.employee_id = eid(params.employee_id as string | number);
  return hrCall("/api/hr/evaluations/create", params);
}

export const updateEvaluation = async (evaluationId: string | number, payload: Record<string, unknown>) => {
  return hrCall(`/api/hr/evaluations/${eid(evaluationId)}/update`, payload);
}

export const deleteEvaluation = async (evaluationId: string | number) => {
  return hrCall(`/api/hr/evaluations/${eid(evaluationId)}/delete`, {});
}

export const fetchWarnings = async (employeeId?: string | number): Promise<DbWarning[]> => {
  const params: Record<string, unknown> = { limit: 500 };
  if (employeeId) params.employee_id = eid(employeeId);
  const rows = await items<any>("/api/hr/warnings/list", params);
  return rows.map(mapWarning);
}

export const createWarning = async (payload: Record<string, unknown>) => {
  const params = { ...payload };
  if (params.employee_id != null) params.employee_id = eid(params.employee_id as string | number);
  return hrCall("/api/hr/warnings/create", params);
}

export const updateWarning = async (warningId: string | number, payload: Record<string, unknown>) => {
  return hrCall(`/api/hr/warnings/${eid(warningId)}/update`, payload);
}

export const deleteWarning = async (warningId: string | number) => {
  return hrCall(`/api/hr/warnings/${eid(warningId)}/delete`, {});
}

export const fetchPolicies = async (): Promise<DbPolicy[]> => {
  const rows = await items<any>("/api/hr/policies/list", { limit: 200 });
  return rows.map(mapPolicy);
}

export const createPolicy = async (payload: Record<string, unknown>) => {
  return hrCall("/api/hr/policies/create", payload);
}

export const updatePolicy = async (policyId: string | number, payload: Record<string, unknown>) => {
  return hrCall(`/api/hr/policies/${eid(policyId)}/update`, payload);
}

export const deletePolicy = async (policyId: string | number) => {
  return hrCall(`/api/hr/policies/${eid(policyId)}/delete`, {});
}

export const fetchTrainingPrograms = async (): Promise<DbTrainingProgram[]> => {
  const rows = await items<any>("/api/hr/training/programs/list", { limit: 200 });
  return rows.map(mapTrainingProgram);
}

export const createTrainingProgram = async (payload: Record<string, unknown>) => {
  return hrCall("/api/hr/training/programs/create", payload);
}

export const updateTrainingProgram = async (programId: string | number, payload: Record<string, unknown>) => {
  return hrCall(`/api/hr/training/programs/${eid(programId)}/update`, payload);
}

export const deleteTrainingProgram = async (programId: string | number) => {
  return hrCall(`/api/hr/training/programs/${eid(programId)}/delete`, {});
}

export const fetchTrainingParticipants = async (
  programId?: string | number,
): Promise<DbTrainingParticipant[]> => {
  const params: Record<string, unknown> = { limit: 500 };
  if (programId) params.program_id = eid(programId);
  const rows = await items<any>("/api/hr/training/participants/list", params);
  return rows.map(mapTrainingParticipant);
}

export const createTrainingParticipant = async (payload: {
  training_program_id: string | number;
  employee_id: string | number;
  completion_status?: string;
  score?: number | null;
}) => {
  return hrCall("/api/hr/training/participants/create", {
    program_id: eid(payload.training_program_id),
    employee_id: eid(payload.employee_id),
    completion_status: payload.completion_status,
    score: payload.score,
  });
}

export const updateTrainingParticipant = async (
  participantId: string | number,
  payload: Record<string, unknown>,
) => {
  return hrCall(`/api/hr/training/participants/${eid(participantId)}/update`, payload);
}

export const deleteTrainingParticipant = async (participantId: string | number) => {
  return hrCall(`/api/hr/training/participants/${eid(participantId)}/delete`, {});
}
