import type {
  DbEvaluation,
  DbEvaluationCriteria,
  DbWarning,
  DbPolicy,
  DbTrainingProgram,
  DbTrainingParticipant,
} from "../../hooks";
import { sid, sornull, num, empty } from "./mapHelpers";

export const mapWarning = (r: any): DbWarning => {
  return {
    id: sid(r.id),
    employee_id: sid(r.employee_id),
    type: r.type || r.warning_type || "",
    reason: r.reason || "",
    details: r.details || null,
    date: r.date || "",
    issued_by: r.issued_by_name || sornull(r.issued_by_id) || null,
    status: r.status || "active",
    expiry_date: r.expiry_date || null,
    created_at: r.created_at || empty,
    updated_at: r.updated_at || empty,
  };
}

export const mapEvaluationCriterion = (r: any): DbEvaluationCriteria => {
  return {
    id: sid(r.id),
    evaluation_id: sid(r.evaluation_id),
    criterion_name: r.criterion_name || "",
    score: r.score ?? null,
    created_at: r.created_at || empty,
  };
}

export const mapEvaluation = (r: any): DbEvaluation => {
  return {
    id: sid(r.id),
    employee_id: sid(r.employee_id),
    evaluator_id: sornull(r.evaluator_id),
    period: r.period || "",
    overall_rating: num(r.overall_rating),
    status: r.status || "draft",
    comments: r.comments || null,
    created_at: r.created_at || empty,
    updated_at: r.updated_at || empty,
  };
}

export const mapPolicy = (r: any): DbPolicy => {
  return {
    id: sid(r.id),
    title: r.title || "",
    category: r.category || "",
    description: r.description || null,
    content: r.content || null,
    icon_name: r.icon_name || null,
    status: r.status || "active",
    version: num(r.version, 1),
    last_updated: r.last_updated || empty,
    created_at: r.created_at || empty,
  };
}

export const mapTrainingProgram = (r: any): DbTrainingProgram => {
  return {
    id: sid(r.id),
    title: r.title || "",
    category: r.category || "",
    weight: r.weight || "",
    instructor: r.instructor || null,
    duration: r.duration || null,
    status: r.status || "planned",
    completion_rate: num(r.completion_rate),
    start_date: r.start_date || null,
    end_date: r.end_date || null,
    objectives: r.objectives || null,
    max_participants: r.max_participants ?? null,
    created_at: r.created_at || empty,
    updated_at: r.updated_at || empty,
  };
}

export const mapTrainingParticipant = (r: any): DbTrainingParticipant => {
  return {
    id: sid(r.id),
    training_program_id: sid(r.training_program_id ?? r.program_id),
    employee_id: sid(r.employee_id),
    completion_status: r.completion_status || "enrolled",
    score: r.score ?? null,
    enrolled_at: r.enrolled_at || empty,
    completed_at: r.completed_at || null,
  };
}
