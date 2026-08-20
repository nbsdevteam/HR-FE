import { useMemo } from "react";
import { arabicSource } from "@/i18n/source";
import type { DashboardRiskConfig } from "./useDashboardRiskConfig";

// ═══════ COMPOSITE RISK SCORECARD — ALL thresholds & points from configurations table ═══════
export const useDashboardRiskScore = (
  expiryStats: { expiredDocs: number; expiringDocs: number; expiringContracts: number; expiredContracts: number },
  warningStats: { active: number; byType: Record<string, number>; escalationRisk: number },
  attendanceStats: { absenteeismRate: number; [key: string]: any },
  turnoverRate: number,
  pendingLeaves: number,
  cfg: DashboardRiskConfig,
) =>
  useMemo(() => {
    let score = 0;
    const items: { label: string; points: number; level: "low" | "medium" | "high" | "critical" }[] = [];

    // Expired documents
    if (expiryStats.expiredDocs > cfg.riskExpiredDocsCriticalThreshold) { score += cfg.riskExpiredDocsCriticalPoints; items.push({ label: `${expiryStats.expiredDocs} ${arabicSource("common.finished_document")}`, points: cfg.riskExpiredDocsCriticalPoints, level: "critical" }); }
    else if (expiryStats.expiredDocs > 0) { score += cfg.riskExpiredDocsHighPoints; items.push({ label: `${expiryStats.expiredDocs} ${arabicSource("common.finished_document")}`, points: cfg.riskExpiredDocsHighPoints, level: "high" }); }

    // Expiring documents
    if (expiryStats.expiringDocs > cfg.riskExpiringDocsThreshold) { score += cfg.riskExpiringDocsMediumPoints; items.push({ label: `${expiryStats.expiringDocs} ${arabicSource("common.document_nearing_completion")}`, points: cfg.riskExpiringDocsMediumPoints, level: "medium" }); }
    else if (expiryStats.expiringDocs > 0) { score += cfg.riskExpiringDocsLowPoints; items.push({ label: `${expiryStats.expiringDocs} ${arabicSource("common.document_nearing_completion")}`, points: cfg.riskExpiringDocsLowPoints, level: "low" }); }

    // Expiring contracts
    if (expiryStats.expiringContracts > 0) { score += cfg.riskExpiringContractsPoints; items.push({ label: `${expiryStats.expiringContracts} ${arabicSource("common.contract_soon_to_expire")}`, points: cfg.riskExpiringContractsPoints, level: "high" }); }

    // Active warnings
    if (warningStats.active > cfg.riskWarningsCriticalThreshold) { score += cfg.riskWarningsCriticalPoints; items.push({ label: `${warningStats.active} ${arabicSource("common.alarm_active")}`, points: cfg.riskWarningsCriticalPoints, level: "critical" }); }
    else if (warningStats.active > cfg.riskWarningsMediumThreshold) { score += cfg.riskWarningsMediumPoints; items.push({ label: `${warningStats.active} ${arabicSource("common.alarm_active")}`, points: cfg.riskWarningsMediumPoints, level: "medium" }); }
    else if (warningStats.active > 0) { score += cfg.riskWarningsLowPoints; items.push({ label: `${warningStats.active} ${arabicSource("common.alarm_active")}`, points: cfg.riskWarningsLowPoints, level: "low" }); }

    // Escalation risk
    if (warningStats.escalationRisk > 0) { score += cfg.riskEscalationPoints; items.push({ label: `${warningStats.escalationRisk} ${arabicSource("dashboard.employee_with_multiple_warnings")}`, points: cfg.riskEscalationPoints, level: "high" }); }

    // High absenteeism
    if (attendanceStats.absenteeismRate > cfg.riskAbsenteeismHighThreshold) { score += cfg.riskAbsenteeismHighPoints; items.push({ label: `${arabicSource("common.absence_2")} ${attendanceStats.absenteeismRate}%`, points: cfg.riskAbsenteeismHighPoints, level: "high" }); }
    else if (attendanceStats.absenteeismRate > cfg.riskAbsenteeismMediumThreshold) { score += cfg.riskAbsenteeismMediumPoints; items.push({ label: `${arabicSource("common.absence_2")} ${attendanceStats.absenteeismRate}%`, points: cfg.riskAbsenteeismMediumPoints, level: "medium" }); }

    // High turnover
    if (turnoverRate > cfg.riskTurnoverCriticalThreshold) { score += cfg.riskTurnoverCriticalPoints; items.push({ label: `${arabicSource("common.rotation")} ${turnoverRate}%`, points: cfg.riskTurnoverCriticalPoints, level: "critical" }); }
    else if (turnoverRate > cfg.riskTurnoverMediumThreshold) { score += cfg.riskTurnoverMediumPoints; items.push({ label: `${arabicSource("common.rotation")} ${turnoverRate}%`, points: cfg.riskTurnoverMediumPoints, level: "medium" }); }

    // Pending leaves
    if (pendingLeaves > cfg.riskPendingLeavesThreshold) { score += cfg.riskPendingLeavesPoints; items.push({ label: `${pendingLeaves} ${arabicSource("dashboard.vacation_pending")}`, points: cfg.riskPendingLeavesPoints, level: "medium" }); }

    // Risk level boundaries — from config
    const level: "low" | "medium" | "high" | "critical" =
      score >= cfg.riskLevelCritical ? "critical" :
      score >= cfg.riskLevelHigh ? "high" :
      score >= cfg.riskLevelMedium ? "medium" : "low";
    return { score: Math.min(100, score), level, items: items.sort((a, b) => b.points - a.points) };
  }, [expiryStats, warningStats, attendanceStats, turnoverRate, pendingLeaves, cfg]);
