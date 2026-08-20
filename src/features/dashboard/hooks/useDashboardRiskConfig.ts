import { useMemo } from "react";
import { arabicSource } from "@/i18n/source";

export const useDashboardRiskConfig = (
  cfgNum: (key: string, fallback?: number) => number,
  cfgVal: (key: string, fallback?: string) => string,
) =>
  // ═══════ All thresholds from configurations table (NOT hard-coded) ═══════
  useMemo(
    () => ({
      // Risk scoring
      riskExpiredDocsCriticalThreshold: cfgNum('risk.expired_docs_critical_threshold', 5),
      riskExpiredDocsCriticalPoints: cfgNum('risk.expired_docs_critical_points', 25),
      riskExpiredDocsHighPoints: cfgNum('risk.expired_docs_high_points', 10),
      riskExpiringDocsThreshold: cfgNum('risk.expiring_docs_threshold', 5),
      riskExpiringDocsMediumPoints: cfgNum('risk.expiring_docs_medium_points', 15),
      riskExpiringDocsLowPoints: cfgNum('risk.expiring_docs_low_points', 5),
      riskExpiringContractsPoints: cfgNum('risk.expiring_contracts_points', 15),
      riskWarningsCriticalThreshold: cfgNum('risk.warnings_critical_threshold', 10),
      riskWarningsCriticalPoints: cfgNum('risk.warnings_critical_points', 20),
      riskWarningsMediumThreshold: cfgNum('risk.warnings_medium_threshold', 3),
      riskWarningsMediumPoints: cfgNum('risk.warnings_medium_points', 10),
      riskWarningsLowPoints: cfgNum('risk.warnings_low_points', 5),
      riskEscalationPoints: cfgNum('risk.escalation_points', 15),
      riskEscalationWarningCount: cfgNum('risk.escalation_warning_count', 2),
      riskAbsenteeismHighThreshold: cfgNum('risk.absenteeism_high_threshold', 10),
      riskAbsenteeismHighPoints: cfgNum('risk.absenteeism_high_points', 15),
      riskAbsenteeismMediumThreshold: cfgNum('risk.absenteeism_medium_threshold', 5),
      riskAbsenteeismMediumPoints: cfgNum('risk.absenteeism_medium_points', 8),
      riskTurnoverCriticalThreshold: cfgNum('risk.turnover_critical_threshold', 20),
      riskTurnoverCriticalPoints: cfgNum('risk.turnover_critical_points', 20),
      riskTurnoverMediumThreshold: cfgNum('risk.turnover_medium_threshold', 10),
      riskTurnoverMediumPoints: cfgNum('risk.turnover_medium_points', 10),
      riskPendingLeavesThreshold: cfgNum('risk.pending_leaves_threshold', 10),
      riskPendingLeavesPoints: cfgNum('risk.pending_leaves_points', 5),
      riskLevelCritical: cfgNum('risk.level_critical', 60),
      riskLevelHigh: cfgNum('risk.level_high', 35),
      riskLevelMedium: cfgNum('risk.level_medium', 15),
      // KPI display thresholds
      turnoverWarning: cfgNum('kpi.turnover_warning_threshold', 15),
      trainingCompletionTarget: cfgNum('kpi.training_completion_target', 70),
      performanceGoodThreshold: cfgNum('kpi.performance_good_threshold', 3.5),
      timeToFillWarningDays: cfgNum('kpi.time_to_fill_warning_days', 30),
      docExpiryWindowDays: cfgNum('kpi.document_expiry_window_days', 30),
      contractExpiryWindowDays: cfgNum('kpi.contract_expiry_window_days', 30),
      // Warning config
      warningActiveStatus: cfgVal('warnings.active_status', arabicSource("common.is_active")),
      warningEscalationCount: cfgNum('warnings.escalation_count', 2),
      // Employee active status
      employeeActiveStatus: cfgVal('employee.active_status', arabicSource("common.is_active")),
      employeeActiveStatusEn: cfgVal('employee.active_status_en', 'active'),
    }),
    [cfgNum, cfgVal],
  );

export type DashboardRiskConfig = ReturnType<typeof useDashboardRiskConfig>;
