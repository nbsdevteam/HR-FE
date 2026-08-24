import * as odooData from "@/shared/api/odooData";
import { useCachedList } from "./core";

// ——— Evaluations, Warnings, Training, Policies Hooks ———

export interface DbEvaluation {
  id: string;
  employee_id: string;
    evaluator_id: string | null;
    evaluator_name?: string | null;
  period: string;
  overall_rating: number;
  status: string;
  comments: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbEvaluationCriteria {
  id: string;
  evaluation_id: string;
  criterion_name: string;
  score: number | null;
  created_at: string;
}

export interface DbWarning {
  id: string;
  employee_id: string;
  type: string;
  reason: string;
  details: string | null;
  date: string;
  issued_by: string | null;
  status: string;
  expiry_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbTrainingProgram {
  id: string;
  title: string;
  category: string;
  weight: string;
  instructor: string | null;
  duration: string | null;
  status: string;
  completion_rate: number;
  start_date: string | null;
  end_date: string | null;
  objectives: string[] | null;
  max_participants: number | null;
  created_at: string;
  updated_at: string;
}

export interface DbTrainingParticipant {
  id: string;
  training_program_id: string;
  employee_id: string;
  completion_status: string;
  score: number | null;
  enrolled_at: string;
  completed_at: string | null;
}

export interface DbPolicy {
  id: string;
  title: string;
  category: string;
  description: string | null;
  content: string | null;
  icon_name: string | null;
  status: string;
  version: number;
  last_updated: string;
  created_at: string;
}

export const useEvaluations = (filters?: { employeeId?: string; period?: string }) => {
  const { data: evaluations, loading, refetch } = useCachedList(
    "evaluations",
    () => odooData.fetchEvaluations(filters?.employeeId),
    "Failed to load evaluations",
    [filters?.employeeId, filters?.period],
  );
  return { evaluations, loading, refetch };
}

export const useWarnings = (filters?: { employeeId?: string; status?: string }) => {
  const { data: warnings, loading, refetch } = useCachedList(
    "warnings",
    () => odooData.fetchWarnings(filters?.employeeId),
    "Failed to load warnings",
    [filters?.employeeId, filters?.status],
  );
  return { warnings, loading, refetch };
}

export const useTrainingPrograms = () => {
  const { data: programs, loading, refetch } = useCachedList("trainingPrograms", () => odooData.fetchTrainingPrograms(), "Failed to load training programs");
  return { programs, loading, refetch };
}

export const useTrainingParticipants = (programId?: string) => {
  const { data: participants, loading, refetch } = useCachedList(
    "trainingParticipants",
    () => odooData.fetchTrainingParticipants(programId),
    "Failed to load participants",
    [programId],
  );
  return { participants, loading, refetch };
}

export const usePolicies = () => {
  const { data: policies, loading, refetch } = useCachedList("policies", () => odooData.fetchPolicies(), "Failed to load policies");
  return { policies, loading, refetch };
}
