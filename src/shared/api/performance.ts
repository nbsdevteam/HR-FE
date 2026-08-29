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
import { crudFactory, fetchList, withEid } from "./crud";

const evaluations = crudFactory("/api/hr/evaluations");
const warnings = crudFactory("/api/hr/warnings");
const policies = crudFactory("/api/hr/policies");
const trainingPrograms = crudFactory("/api/hr/training/programs");
const trainingParticipants = crudFactory("/api/hr/training/participants");

/** Criteria arrive embedded in each evaluation row; flatten them out once. */
const flattenCriteria = (rows: any[]): DbEvaluationCriteria[] => {
  const criteria: DbEvaluationCriteria[] = [];
  for (const r of rows) {
    if (Array.isArray(r.criteria)) criteria.push(...r.criteria.map(mapEvaluationCriterion));
  }
  return criteria;
}

export const fetchEvaluations = (employeeId?: string | number): Promise<DbEvaluation[]> => {
  const params: Record<string, unknown> = { limit: 500 };
  if (employeeId) params.employee_id = eid(employeeId);
  return fetchList("/api/hr/evaluations/list", mapEvaluation, params);
}

export const fetchEvaluationCriteria = async (): Promise<DbEvaluationCriteria[]> => {
  // Criteria are embedded in evaluations/list responses; provided for API parity.
  const rows = await items<any>("/api/hr/evaluations/list", { limit: 500 });
  return flattenCriteria(rows);
}

export const fetchEvaluationsWithCriteria = async (
  employeeId?: string | number,
): Promise<{ evaluations: DbEvaluation[]; criteria: DbEvaluationCriteria[] }> => {
  const params: Record<string, unknown> = { limit: 500 };
  if (employeeId) params.employee_id = eid(employeeId);
  const rows = await items<any>("/api/hr/evaluations/list", params);
  return { evaluations: rows.map(mapEvaluation), criteria: flattenCriteria(rows) };
}

export const createEvaluation = (payload: Record<string, unknown>) =>
  evaluations.create(withEid(payload, ["employee_id"]));
export const updateEvaluation = evaluations.update;
export const deleteEvaluation = evaluations.remove;

export const fetchWarnings = (employeeId?: string | number): Promise<DbWarning[]> => {
  const params: Record<string, unknown> = { limit: 500 };
  if (employeeId) params.employee_id = eid(employeeId);
  return fetchList("/api/hr/warnings/list", mapWarning, params);
}

/**
 * Both writers map the response so callers can read the stored `expiry_date`
 * back instead of reproducing the backend's month-end arithmetic (backend §3).
 */
export const createWarning = async (payload: Record<string, unknown>): Promise<DbWarning> =>
  mapWarning(await warnings.create(withEid(payload, ["employee_id"])));
export const updateWarning = async (
  id: string | number,
  payload: Record<string, unknown>,
): Promise<DbWarning> => mapWarning(await warnings.update(id, payload));
export const deleteWarning = warnings.remove;

export const fetchPolicies = (): Promise<DbPolicy[]> =>
  fetchList("/api/hr/policies/list", mapPolicy, { limit: 200 });
export const createPolicy = policies.create;
export const updatePolicy = policies.update;
export const deletePolicy = policies.remove;

export const fetchTrainingPrograms = (): Promise<DbTrainingProgram[]> =>
  fetchList("/api/hr/training/programs/list", mapTrainingProgram, { limit: 200 });
export const createTrainingProgram = trainingPrograms.create;
export const updateTrainingProgram = trainingPrograms.update;
export const deleteTrainingProgram = trainingPrograms.remove;

export const fetchTrainingParticipants = (
  programId?: string | number,
): Promise<DbTrainingParticipant[]> => {
  const params: Record<string, unknown> = { limit: 500 };
  if (programId) params.program_id = eid(programId);
  return fetchList("/api/hr/training/participants/list", mapTrainingParticipant, params);
}

export const createTrainingParticipant = (payload: {
  training_program_id: string | number;
  employee_id: string | number;
  completion_status?: string;
  score?: number | null;
}) =>
  trainingParticipants.create({
    program_id: eid(payload.training_program_id),
    employee_id: eid(payload.employee_id),
    completion_status: payload.completion_status,
    score: payload.score,
  });

export const updateTrainingParticipant = trainingParticipants.update;
export const deleteTrainingParticipant = trainingParticipants.remove;
