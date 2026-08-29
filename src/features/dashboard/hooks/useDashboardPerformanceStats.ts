import { useMemo } from "react";
import { arabicSource } from "@/i18n/source";
import { pct } from "../utils/dashboardFormat";
import type { DashboardRiskConfig } from "./useDashboardRiskConfig";

// ═══════ PERFORMANCE & DEVELOPMENT KPIs ═══════
export const useDashboardPerformanceStats = (
  evaluations: any[],
  totalEmployees: number,
  warnings: any[],
  cfg: DashboardRiskConfig,
  trainingPrograms: any[],
  trainingParticipants: any[],
) => {
  const evalStats = useMemo(() => {
    const completed = evaluations.filter(e => e.status === arabicSource("common.complete"));
    const avgRating = completed.length > 0 ? completed.reduce((s, e) => s + e.overall_rating, 0) / completed.length : 0;
    const pending = evaluations.filter(e => e.status === arabicSource("common.did_not_start") || e.status === arabicSource("common.under_evaluation")).length;
    const high = completed.filter(e => e.overall_rating >= 4).length;
    const low = completed.filter(e => e.overall_rating <= 2).length;
    const coverageRate = totalEmployees > 0 ? pct(completed.length, totalEmployees) : 0;
    return { avgRating: Math.round(avgRating * 10) / 10, completed: completed.length, pending, high, low, coverageRate };
  }, [evaluations, totalEmployees]);

  const warningStats = useMemo(() => {
    const active = warnings.filter(w => w.status === cfg.warningActiveStatus).length;
    const byType: Record<string, number> = {};
    warnings.filter(w => w.status === cfg.warningActiveStatus).forEach(w => { byType[w.type] = (byType[w.type] || 0) + 1; });
    // Employees with multiple warnings (escalation risk — threshold from config)
    const empWarnings: Record<string, number> = {};
    warnings.filter(w => w.status === cfg.warningActiveStatus).forEach(w => { empWarnings[w.employee_id] = (empWarnings[w.employee_id] || 0) + 1; });
    const escalationRisk = Object.values(empWarnings).filter(c => c >= cfg.warningEscalationCount).length;
    return { active, byType, escalationRisk };
  }, [warnings, cfg.warningActiveStatus, cfg.warningEscalationCount]);

  const trainingStats = useMemo(() => {
    const ongoing = trainingPrograms.filter(p => p.status === arabicSource("common.my_neighbor")).length;
    const completed = trainingPrograms.filter(p => p.status === arabicSource("common.complete")).length;
    const totalParticipants = trainingParticipants.length;
    const completedParticipants = trainingParticipants.filter(p => p.completion_status === arabicSource("common.complete")).length;
    const completionRate = totalParticipants > 0 ? pct(completedParticipants, totalParticipants) : 0;
    // Training coverage: how many unique employees have participated
    const uniqueTrainees = new Set(trainingParticipants.map(p => p.employee_id)).size;
    const coverageRate = totalEmployees > 0 ? pct(uniqueTrainees, totalEmployees) : 0;
    // Avg score
    const scores = trainingParticipants.filter(p => p.score != null).map(p => p.score!);
    const avgScore = scores.length > 0 ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length) : 0;
    return { ongoing, completed, totalPrograms: trainingPrograms.length, totalParticipants, completionRate, coverageRate, uniqueTrainees, avgScore };
  }, [trainingPrograms, trainingParticipants, totalEmployees]);

  return { evalStats, warningStats, trainingStats };
};
