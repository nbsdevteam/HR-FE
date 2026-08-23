import { useMemo } from "react";
import { AlertTriangle, GraduationCap, FileCheck, Award, Zap } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import { pct } from "../utils/dashboardFormat";
import type { DashboardSectionData } from "./useDashboardData";

export const useDashboardComplianceData = (data: DashboardSectionData) => {
  const { cfg, expiryStats, warningStats, evalStats, trainingStats, evaluations } = data;

  const complianceStats = useMemo(
    () => [
      {
        label: arabicSource("dashboard.average_performance_rating"),
        value: `${evalStats.avgRating}/5`,
        sub: `${arabicSource("common.cover")} ${evalStats.coverageRate}${arabicSource("common.of_employees")}`,
        icon: Award,
        color:
          evalStats.avgRating >= cfg.performanceGoodThreshold
            ? "text-emerald-400"
            : "text-amber-400",
      },
      {
        label: arabicSource("common.active_alarms"),
        value: warningStats.active,
        sub: `${warningStats.escalationRisk} ${arabicSource("common.risk_of_escalation")}`,
        icon: AlertTriangle,
        color: warningStats.active > 0 ? "text-orange-400" : "text-emerald-400",
      },
      {
        label: arabicSource("dashboard.completion_of_training"),
        value: `${trainingStats.completionRate}%`,
        sub: `${arabicSource("common.cover")} ${trainingStats.coverageRate}${arabicSource("common.of_employees")}`,
        icon: GraduationCap,
        color:
          trainingStats.completionRate >= cfg.trainingCompletionTarget
            ? "text-emerald-400"
            : "text-amber-400",
      },
      {
        label: arabicSource("dashboard.expired_nearly_documents"),
        value: expiryStats.expiredDocs + expiryStats.expiringDocs,
        sub: `${expiryStats.expiredDocs} ${arabicSource("dashboard.finished")} ${expiryStats.expiringDocs} ${arabicSource("dashboard.close")}`,
        icon: FileCheck,
        color: expiryStats.expiredDocs > 0 ? "text-red-400" : "text-amber-400",
      },
      {
        label: arabicSource("dashboard.high_performance_rate"),
        value: `${pct(evalStats.high, evalStats.completed)}%`,
        sub: `${evalStats.high} ${arabicSource("common.from")} ${evalStats.completed} ${arabicSource("dashboard.evaluator")}`,
        icon: Zap,
        color: "text-purple-400",
      },
    ],
    [evalStats, cfg, warningStats, trainingStats, expiryStats],
  );

  const ratingLevels = useMemo(
    () => [
      {
        label: arabicSource("dashboard.featured_5"),
        count: evaluations.filter(
          (e: any) =>
            e.status === arabicSource("common.complete") &&
            e.overall_rating === 5,
        ).length,
        color: "bg-emerald-500",
      },
      {
        label: arabicSource("dashboard.exceeding_expectations_4"),
        count: evaluations.filter(
          (e: any) =>
            e.status === arabicSource("common.complete") &&
            e.overall_rating === 4,
        ).length,
        color: "bg-blue-500",
      },
      {
        label: arabicSource("dashboard.within_expected_3"),
        count: evaluations.filter(
          (e: any) =>
            e.status === arabicSource("common.complete") &&
            e.overall_rating === 3,
        ).length,
        color: "bg-primary",
      },
      {
        label: arabicSource("dashboard.below_expectations_2"),
        count: evaluations.filter(
          (e: any) =>
            e.status === arabicSource("common.complete") &&
            e.overall_rating === 2,
        ).length,
        color: "bg-amber-500",
      },
      {
        label: arabicSource("dashboard.not_achieved_1"),
        count: evaluations.filter(
          (e: any) =>
            e.status === arabicSource("common.complete") &&
            e.overall_rating === 1,
        ).length,
        color: "bg-red-500",
      },
    ],
    [evaluations],
  );

  const trainingTiles = useMemo(
    () => [
      {
        value: trainingStats.totalPrograms,
        label: arabicSource("common.total_programs"),
        colorClassName: "bg-primary/10 border border-primary/20",
        textColorClassName: "text-primary",
      },
      {
        value: trainingStats.ongoing,
        label: arabicSource("dashboard.now_underway"),
        colorClassName: "bg-blue-500/10 border border-blue-500/20",
        textColorClassName: "text-blue-400",
      },
      {
        value: trainingStats.completed,
        label: arabicSource("common.complete_2"),
        colorClassName: "bg-emerald-500/10 border border-emerald-500/20",
        textColorClassName: "text-emerald-400",
      },
      {
        value: trainingStats.uniqueTrainees,
        label: arabicSource("dashboard.unique_trainee"),
        colorClassName: "bg-amber-500/10 border border-amber-500/20",
        textColorClassName: "text-amber-400",
      },
      {
        value: `${trainingStats.completionRate}%`,
        label: arabicSource("dashboard.completion_rate"),
        colorClassName: "bg-purple-500/10 border border-purple-500/20",
        textColorClassName: "text-purple-400",
      },
      {
        value: trainingStats.avgScore || "—",
        label: arabicSource("dashboard.average_score"),
        colorClassName: "bg-cyan-500/10 border border-cyan-500/20",
        textColorClassName: "text-cyan-400",
      },
    ],
    [trainingStats],
  );

  return { complianceStats, ratingLevels, trainingTiles };
};
