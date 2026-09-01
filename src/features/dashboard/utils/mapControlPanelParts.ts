/**
 * Per-block mappers behind `buildDashboardSectionData`.
 *
 * Nothing here computes a metric — the aggregate endpoints already did. What
 * these build is display: chart colours, Arabic labels for backend enum keys,
 * and month labels honouring the user's month-format setting.
 */
import { arabicSource } from "@/i18n/source";
import { applicantStageLabel, warningTypeLabel } from "@/i18n/status";
import { formatMonthOnly, type MonthFormat } from "@/app/providers";
import type {
  ControlPanelConfig,
  ControlPanelEvaluations,
  ControlPanelOverview,
  ControlPanelRecruitment,
  ControlPanelRiskItem,
  ControlPanelTraining,
  ControlPanelWarnings,
} from "@/shared/api/controlPanel";
import type { DashboardRiskItem, DashboardRiskScore } from "../types";

const WARNING_COLORS = ["#F59E0B", "#F97316", "#EF4444", "#DC2626", "#991B1B"];

/** `"2026-07"` → the month label the user's settings ask for. */
export const monthLabel = (month: string, monthFormat: MonthFormat): string =>
  formatMonthOnly(month.split("-")[1] ?? month, monthFormat);

/**
 * Risk labels are built from a stable key plus its count, so the scoring loop
 * no longer has to live on the FE just to produce a sentence.
 */
const riskItemLabel = (item: ControlPanelRiskItem): string => {
  switch (item.key) {
    case "expired_docs":
      return `${item.count} ${arabicSource("common.finished_document")}`;
    case "expiring_docs":
      return `${item.count} ${arabicSource("common.document_nearing_completion")}`;
    case "expiring_contracts":
      return `${item.count} ${arabicSource("common.contract_soon_to_expire")}`;
    case "active_warnings":
      return `${item.count} ${arabicSource("common.alarm_active")}`;
    case "escalation_risk":
      return `${item.count} ${arabicSource("dashboard.employee_with_multiple_warnings")}`;
    case "absenteeism":
      return `${arabicSource("common.absence_2")} ${item.count}%`;
    case "turnover":
      return `${arabicSource("common.rotation")} ${item.count}%`;
    case "pending_leaves":
      return `${item.count} ${arabicSource("dashboard.vacation_pending")}`;
    default:
      return String(item.key);
  }
};

export const emptyRiskScore: DashboardRiskScore = { score: 0, level: "low", items: [] };

export const mapRiskScore = (overview: ControlPanelOverview | null): DashboardRiskScore => {
  if (!overview) return emptyRiskScore;
  const items: DashboardRiskItem[] = overview.risk.items.map((item) => ({
    key: item.key,
    label: riskItemLabel(item),
    points: item.points,
    level: item.level,
  }));
  return { score: overview.risk.score, level: overview.risk.level, items };
};

/**
 * Only the KPI display thresholds survive on the FE — the risk score itself is
 * computed server-side now, so the scoring points and boundaries are no longer
 * read here. Keys are the configurations-table keys; the defaults match the
 * ones the backend resolves with, so a tile still colours correctly if the
 * payload predates a newly added setting.
 */
export const mapDashboardConfig = (config: ControlPanelConfig | undefined) => {
  const num = (key: string, fallback: number): number => {
    const value = config?.[key];
    return typeof value === "number" && !Number.isNaN(value) ? value : fallback;
  };
  return {
    turnoverWarning: num("kpi.turnover_warning_threshold", 15),
    trainingCompletionTarget: num("kpi.training_completion_target", 70),
    performanceGoodThreshold: num("kpi.performance_good_threshold", 3.5),
    timeToFillWarningDays: num("kpi.time_to_fill_warning_days", 30),
    docExpiryWindowDays: num("kpi.document_expiry_window_days", 30),
    contractExpiryWindowDays: num("kpi.contract_expiry_window_days", 30),
  };
};

export type DashboardConfig = ReturnType<typeof mapDashboardConfig>;

export const mapWarningDistribution = (warnings: ControlPanelWarnings | undefined) =>
  Object.entries(warnings?.by_type ?? {}).map(([key, value], index) => ({
    name: warningTypeLabel[key] ?? key,
    value,
    color: WARNING_COLORS[index] ?? "#EF4444",
  }));

export const mapEvalStats = (evaluations: ControlPanelEvaluations | undefined) => ({
  avgRating: evaluations?.avg_rating ?? 0,
  completed: evaluations?.completed ?? 0,
  pending: evaluations?.pending ?? 0,
  high: evaluations?.high_performers ?? 0,
  low: evaluations?.low_performers ?? 0,
  coverageRate: evaluations?.coverage_rate ?? 0,
});

export const mapTrainingStats = (training: ControlPanelTraining | undefined) => ({
  ongoing: training?.ongoing ?? 0,
  completed: training?.completed ?? 0,
  totalPrograms: training?.total_programs ?? 0,
  totalParticipants: training?.total_participants ?? 0,
  completionRate: training?.completion_rate ?? 0,
  coverageRate: training?.coverage_rate ?? 0,
  uniqueTrainees: training?.unique_trainees ?? 0,
  avgScore: training?.avg_score ?? 0,
});

export const mapRecruitmentStats = (recruitment: ControlPanelRecruitment | undefined) => ({
  totalJobs: recruitment?.total_jobs ?? 0,
  openPositions: recruitment?.open_positions ?? 0,
  closedPositions: recruitment?.closed_positions ?? 0,
  totalApplicants: recruitment?.total_applicants ?? 0,
  avgApplicantsPerJob: recruitment?.avg_applicants_per_job ?? 0,
  stages: recruitment?.stages ?? {},
  avgTimeToFill: recruitment?.avg_time_to_fill_days ?? 0,
  offerAcceptRate: recruitment?.offer_accept_rate ?? 0,
  hired: recruitment?.hired ?? 0,
  bookmarked: recruitment?.bookmarked ?? 0,
});

/**
 * Funnel order. The two interview rounds collapse into the single "interview"
 * step the funnel has always drawn, and `rejected` is not a funnel stage.
 */
const FUNNEL_STAGES: { keys: string[]; label: string; color: string }[] = [
  { keys: ["applied"], label: applicantStageLabel.applied, color: "#3B82F6" },
  { keys: ["screening"], label: applicantStageLabel.screening, color: "#8B5CF6" },
  { keys: ["interview_1", "interview_2"], label: applicantStageLabel.interview_1, color: "#D4AF37" },
  { keys: ["assessment"], label: applicantStageLabel.assessment, color: "#F97316" },
  { keys: ["offer"], label: applicantStageLabel.offer, color: "#22C55E" },
  { keys: ["hired"], label: applicantStageLabel.hired, color: "#10B981" },
];

export const mapRecruitmentPipeline = (stages: Record<string, number>) =>
  FUNNEL_STAGES.map((stage) => ({
    name: stage.label,
    value: stage.keys.reduce((sum, key) => sum + (stages[key] ?? 0), 0),
    color: stage.color,
  }));
