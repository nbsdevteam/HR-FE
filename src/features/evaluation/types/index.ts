import { BarChart3, Calendar, CalendarRange, UserCheck } from "lucide-react";
import { arabicSource } from "@/i18n/source";

export const evaluationStatusToOdoo: Record<string, string> = {
  "قيد التقييم": "draft",
  "مكتمل": "completed",
  "لم يبدأ": "draft",
};

export const odooStatusToEvaluation: Record<string, string> = {
  draft: "قيد التقييم",
  completed: "مكتمل",
  approved: "مكتمل",
};

export const ratingScale = [
  { value: 1, label: arabicSource("evaluation.not_achieved"), labelEn: "No Achieve", color: "#DC2626", bgColor: "bg-red-500/10 border-red-500/20 text-red-400" },
  { value: 2, label: arabicSource("evaluation.below_expectations"), labelEn: "Below Expectation", color: "#F59E0B", bgColor: "bg-yellow-500/10 border-yellow-500/20 text-yellow-400" },
  { value: 3, label: arabicSource("evaluation.is_within_expected"), labelEn: "Within Expected", color: "#3B82F6", bgColor: "bg-blue-500/10 border-blue-500/20 text-blue-400" },
  { value: 4, label: arabicSource("evaluation.exceeded_expectations"), labelEn: "Exceeded Expectation", color: "#22C55E", bgColor: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" },
  { value: 5, label: arabicSource("evaluation.outstanding_performance"), labelEn: "Outstanding / Distinguished", color: "#D4AF37", bgColor: "bg-primary/10 border-primary/20 text-primary" },
];

export const defaultCriteria = [
  arabicSource("evaluation.quality_of_work"),
  arabicSource("evaluation.commitment"),
  arabicSource("evaluation.teamwork"),
  arabicSource("evaluation.initiative"),
  arabicSource("evaluation.leadership_skills"),
  arabicSource("evaluation.communication"),
];

export const evaluationCycles = [
  { value: arabicSource("common.quarterly"), label: arabicSource("evaluation.quarterly_every_3_months"), icon: CalendarRange },
  { value: arabicSource("common.semi_annually"), label: arabicSource("evaluation.semi_annually_every_6_months"), icon: Calendar },
  { value: arabicSource("common.annual"), label: arabicSource("common.annual"), icon: BarChart3 },
  { value: arabicSource("common.probationary_period"), label: arabicSource("evaluation.probation_period_for_new_employees"), icon: UserCheck },
] as const;

export type EvalCycleType = typeof evaluationCycles[number]["value"];

export const evaluationStatusColors: Record<string, string> = {
  [arabicSource("common.complete")]: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
  [arabicSource("common.under_evaluation")]: "bg-primary/10 border-primary/20 text-primary",
  [arabicSource("common.did_not_start")]: "bg-muted/30 border-border text-muted-foreground",
};

export type EvaluationSortKey = "employee" | "department" | "evaluator" | "period" | "rating" | "status";

export type EvaluationViewMode = "list" | "kanban";

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

export interface DbEvalCriteria {
  id: string;
  evaluation_id: string;
  criterion_name: string;
  score: number;
  created_at: string;
}
