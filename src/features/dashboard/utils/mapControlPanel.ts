/**
 * Builds the object every dashboard section renders from, out of the Control
 * Panel aggregate payloads.
 *
 * All mapping, no arithmetic: every number below arrives already computed by
 * `/api/hr/control-panel/*`. The per-block helpers live in
 * `./mapControlPanelParts`.
 */
import { arabicSource } from "@/i18n/source";
import { dayOfWeekLabel } from "@/i18n/status";
import type { MonthFormat } from "@/app/providers";
import type {
  ControlPanelEvaluations,
  ControlPanelOverview,
  ControlPanelRecruitment,
  ControlPanelSectionPayload,
  ControlPanelTraining,
} from "@/shared/api/controlPanel";
import {
  mapDashboardConfig,
  mapEvalStats,
  mapRecruitmentPipeline,
  mapRecruitmentStats,
  mapRiskScore,
  mapTrainingStats,
  mapWarningDistribution,
  monthLabel,
} from "./mapControlPanelParts";

/**
 * Merge the overview payload with whichever section payload is loaded. Section
 * responses repeat the blocks they own, so a freshly opened tab wins over the
 * mount-time snapshot; everything else falls back to the overview.
 */
export const buildDashboardSectionData = (
  overview: ControlPanelOverview | null,
  section: ControlPanelSectionPayload | null,
  extras: {
    evaluations?: ControlPanelEvaluations;
    training?: ControlPanelTraining;
    recruitment?: ControlPanelRecruitment;
  },
  monthFormat: MonthFormat,
) => {
  const headcount = section?.headcount ?? overview?.headcount;
  const attendance = overview?.attendance;
  const leave = section?.leave ?? overview?.leave;
  const contracts = section?.contracts ?? overview?.contracts;
  const documents = section?.documents ?? overview?.documents;
  const warnings = section?.warnings ?? overview?.warnings;
  const payroll = section?.payroll ?? overview?.payroll;
  const loans = section?.loans ?? overview?.loans;
  const exits = section?.exits ?? overview?.exits;
  const evaluations = section?.evaluations ?? extras.evaluations;
  const training = section?.training ?? extras.training;
  const recruitment = section?.recruitment ?? extras.recruitment;
  const tenure = headcount?.tenure;

  const recruitmentStats = mapRecruitmentStats(recruitment);

  return {
    // ─── Headcount ───
    totalEmployees: headcount?.total ?? 0,
    activeEmployees: headcount?.active ?? 0,
    inactiveEmployees: headcount?.inactive ?? 0,
    departmentData: headcount?.by_department ?? [],
    turnoverRate: headcount?.turnover_rate_12m ?? 0,
    newHireStats: {
      last30: headcount?.new_hires_30d ?? 0,
      last90: headcount?.new_hires_90d ?? 0,
      rate: headcount?.new_hire_rate ?? 0,
    },
    tenureStats: {
      avg: tenure?.avg_years ?? 0,
      median: tenure?.median_years ?? 0,
      under1: tenure?.under_1 ?? 0,
      y1to3: tenure?.y1_to_3 ?? 0,
      y3to5: tenure?.y3_to_5 ?? 0,
      over5: tenure?.over_5 ?? 0,
    },
    tenureDistribution: [
      { name: arabicSource("dashboard.less_than_a_year"), value: tenure?.under_1 ?? 0, color: "#3B82F6" },
      { name: arabicSource("dashboard.1_3_years"), value: tenure?.y1_to_3 ?? 0, color: "#22C55E" },
      { name: arabicSource("dashboard.3_5_years"), value: tenure?.y3_to_5 ?? 0, color: "#D4AF37" },
      { name: arabicSource("dashboard.more_than_5"), value: tenure?.over_5 ?? 0, color: "#8B5CF6" },
    ],
    headcountTrend: (headcount?.trend_12m ?? []).map((point) => ({
      label: monthLabel(point.month, monthFormat),
      value: point.value,
    })),

    // ─── Attendance ───
    attendanceStats: {
      date: overview?.business_date ?? "",
      present: attendance?.present ?? 0,
      absent: attendance?.absent ?? 0,
      late: attendance?.late ?? 0,
      leave: attendance?.on_leave ?? 0,
      attendanceRate: attendance?.attendance_rate ?? 0,
      prevAttendanceRate: attendance?.prev_attendance_rate ?? 0,
      attendanceTrend: (attendance?.attendance_rate ?? 0) - (attendance?.prev_attendance_rate ?? 0),
      punctualityRate: attendance?.punctuality_rate ?? 0,
      prevAbsent: attendance?.prev_absent ?? 0,
      prevLate: attendance?.prev_late ?? 0,
      rolling7Rate: attendance?.rolling_7d_rate ?? 0,
      rolling30Rate: attendance?.rolling_30d_rate ?? 0,
      absenteeismRate: attendance?.absenteeism_rate_30d ?? 0,
      deviceCount: attendance?.device_events_today ?? 0,
      deviceCoverage: attendance?.device_coverage ?? 0,
    },
    attendanceChartData: [
      { name: arabicSource("common.present"), value: attendance?.present ?? 0, color: "#22C55E" },
      { name: arabicSource("common.late"), value: attendance?.late ?? 0, color: "#D4AF37" },
      { name: arabicSource("common.absent"), value: attendance?.absent ?? 0, color: "#DC2626" },
      { name: arabicSource("common.leave"), value: attendance?.on_leave ?? 0, color: "#3B82F6" },
    ],
    deptAttendance: attendance?.by_department_7d ?? [],
    dayOfWeekAttendance: (attendance?.by_day_of_week_90d ?? []).map((point) => ({
      label: dayOfWeekLabel[point.day] ?? point.day,
      value: point.value,
    })),

    // ─── Leave ───
    totalLeaveRequests: leave?.total ?? 0,
    pendingLeaves: leave?.pending ?? 0,
    approvedLeaves: leave?.approved ?? 0,
    rejectedLeaves: leave?.rejected ?? 0,
    leaveUtilization: {
      rate: leave?.utilization.rate ?? 0,
      totalEntitled: leave?.utilization.total_entitled ?? 0,
      totalUsed: leave?.utilization.total_used ?? 0,
      avgUsed: leave?.utilization.avg_used_days ?? 0,
    },

    // ─── Contracts, documents, warnings ───
    activeContracts: contracts?.active ?? 0,
    probationCount: contracts?.probation ?? 0,
    expiryStats: {
      expiringDocs: documents?.expiring ?? 0,
      expiredDocs: documents?.expired ?? 0,
      expiringContracts: contracts?.expiring ?? 0,
      expiredContracts: contracts?.expired ?? 0,
    },
    warningStats: {
      active: warnings?.active ?? 0,
      byType: warnings?.by_type ?? {},
      escalationRisk: warnings?.escalation_risk ?? 0,
    },
    warningDistribution: mapWarningDistribution(warnings),

    // ─── Payroll & loans ───
    totalSalaries: payroll?.total_salaries ?? 0,
    avgSalary: payroll?.avg_salary ?? 0,
    medianSalary: payroll?.median_salary ?? 0,
    compensationStats: {
      totalAllowances: payroll?.total_allowances ?? 0,
      totalDeductions: payroll?.total_deductions ?? 0,
      totalCompensation: payroll?.total_compensation ?? 0,
      costPerEmployee: payroll?.cost_per_employee ?? 0,
    },
    allowanceCount: payroll?.allowance_count ?? 0,
    deductionCount: payroll?.deduction_count ?? 0,
    salaryByDept: payroll?.by_department ?? [],
    monthlyPayroll: (payroll?.monthly_trend ?? []).map((point) => ({
      label: monthLabel(point.month, monthFormat),
      value: point.net_total,
    })),
    payrollMoM: payroll?.mom_change_pct ?? 0,
    activeLoansCount: loans?.active ?? 0,
    totalLoanBalance: loans?.total_balance ?? 0,
    totalLoanGranted: loans?.total_granted ?? 0,
    loanUtilization: loans?.utilization ?? 0,

    // ─── Exits ───
    exitsInProgress: exits?.in_progress ?? 0,
    exitsCompletedTotal: exits?.completed_total ?? 0,
    exitsCompleted12m: exits?.completed_12m ?? 0,

    // ─── Performance, training, recruitment ───
    evalStats: mapEvalStats(evaluations),
    ratingDistribution: evaluations?.rating_distribution ?? {},
    trainingStats: mapTrainingStats(training),
    recruitmentStats,
    recruitmentPipeline: mapRecruitmentPipeline(recruitmentStats.stages),

    // ─── Cross-cutting ───
    riskScore: mapRiskScore(overview),
    unreadCount: overview?.notifications.unread ?? 0,
    notificationsPreview: overview?.notifications.preview ?? [],
    newJoiners: overview?.new_joiners ?? [],
    cfg: mapDashboardConfig(section?.config ?? overview?.config),
  };
};
